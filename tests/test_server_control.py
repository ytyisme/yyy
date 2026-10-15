"""Check login enforcement and real game-server start/stop without using port 8080."""

import http.client
import importlib.util
import json
from pathlib import Path
import shutil
import socket
import tempfile
import threading
import time
import unittest

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("server_control", ROOT / "server-control" / "server.py")
control = importlib.util.module_from_spec(spec)
spec.loader.exec_module(control)


class AuthenticationTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.path = Path(self.directory.name) / "credentials.json"
        control.Authentication.configure(self.path, "测试用户", "test-password")
        self.auth = control.Authentication(self.path)

    def test_credentials_are_hashed_and_both_fields_must_match(self):
        self.assertNotIn("test-password", self.path.read_text())
        self.assertEqual(self.path.stat().st_mode & 0o777, 0o600)
        self.assertIsNone(self.auth.login("错误姓名", "test-password"))
        self.assertIsNone(self.auth.login("测试用户", "wrong-password"))
        self.assertIsNone(self.auth.session(""))
        token, session = self.auth.login("测试用户", "test-password")
        self.assertEqual(self.auth.session(f"{control.COOKIE}={token}"), session)
        session["expires"] = time.monotonic() - 1
        self.assertIsNone(self.auth.session(f"{control.COOKIE}={token}"))


class StubGame:
    def __init__(self):
        self.running = False
        self.calls = 0

    def status(self):
        return {"running": self.running, "controllable": True, "urls": ["http://127.0.0.1:8080/"]}

    def toggle(self):
        self.calls += 1
        self.running = not self.running
        return self.status()


class ControlHTTPTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        path = Path(self.directory.name) / "credentials.json"
        control.Authentication.configure(path, "测试用户", "test-password")
        self.game = StubGame()
        self.server = control.create_server(control.Authentication(path), self.game, host="127.0.0.1", port=0)
        self.port = self.server.server_address[1]
        self.origin = f"http://127.0.0.1:{self.port}"
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.addCleanup(self.stop)

    def stop(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=2)

    def request(self, method, path, value=None, headers=None):
        connection = http.client.HTTPConnection("127.0.0.1", self.port, timeout=5)
        all_headers = {"Origin": self.origin, "Content-Type": "application/json", **(headers or {})}
        connection.request(method, path, body=json.dumps(value).encode() if value is not None else None, headers=all_headers)
        response = connection.getresponse()
        status, response_headers, body = response.status, dict(response.getheaders()), response.read()
        connection.close()
        return status, response_headers, body

    def login(self):
        status, headers, body = self.request("POST", "/api/login", {"name": "测试用户", "password": "test-password"})
        self.assertEqual(status, 200)
        self.assertIn("HttpOnly", headers["Set-Cookie"])
        self.assertIn("SameSite=Strict", headers["Set-Cookie"])
        return headers["Set-Cookie"].split(";")[0], json.loads(body)["csrf"]

    def test_login_is_required_and_wrong_credentials_do_not_grant_control(self):
        self.assertEqual(self.request("GET", "/api/status")[0], 401)
        self.assertEqual(self.request("POST", "/api/toggle")[0], 401)
        status, headers, _ = self.request("POST", "/api/login", {"name": "测试用户", "password": "wrong"})
        self.assertEqual(status, 401)
        self.assertNotIn("Set-Cookie", headers)
        self.assertEqual(self.game.calls, 0)

    def test_authenticated_toggle_requires_same_origin_and_csrf(self):
        cookie, csrf = self.login()
        self.assertEqual(self.request("POST", "/api/toggle", headers={"Cookie": cookie})[0], 403)
        headers = {"Cookie": cookie, "X-CSRF-Token": csrf, "Origin": "http://another-site.invalid"}
        self.assertEqual(self.request("POST", "/api/toggle", headers=headers)[0], 403)
        self.assertEqual(self.game.calls, 0)
        headers["Origin"] = self.origin
        self.assertEqual(self.request("POST", "/api/toggle", headers=headers)[0], 200)
        self.assertTrue(self.game.running)
        self.assertEqual(self.request("POST", "/api/toggle", headers=headers)[0], 200)
        self.assertFalse(self.game.running)

    def test_backend_source_and_credentials_cannot_be_downloaded(self):
        for path in ("/server.py", "/../.server-control-data/credentials.json", "/.server-control-data/credentials.json"):
            self.assertEqual(self.request("GET", path)[0], 404)
        status, _, body = self.request("GET", "/")
        self.assertEqual(status, 200)
        self.assertIn("服务器开关", body.decode())
        self.assertNotIn("test-password", body.decode())
        self.assertEqual(self.request("GET", "/", headers={"Host": "evil.example"})[0], 421)


class RealGameTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.root = Path(self.directory.name)
        shutil.copyfile(ROOT / "server.py", self.root / "server.py")
        (self.root / "index.html").write_text("test game")
        (self.root / "server-control").mkdir()
        (self.root / "server-control" / "server.py").write_text("private backend")
        with socket.socket() as probe:
            probe.bind(("127.0.0.1", 0))
            self.port = probe.getsockname()[1]
        self.game = control.GameServer(root=self.root, data=self.root / ".server-control-data", port=self.port)
        self.addCleanup(self.stop)

    def stop(self):
        if self.game.identity():
            self.game.toggle()

    def get(self, path, method="GET"):
        connection = http.client.HTTPConnection("127.0.0.1", self.port, timeout=3)
        connection.request(method, path)
        response = connection.getresponse()
        status, body = response.status, response.read()
        connection.close()
        return status, body

    def test_real_game_start_stop_restart_and_private_files(self):
        self.assertFalse(self.game.status()["running"])
        self.assertTrue(self.game.toggle()["running"])
        self.assertEqual(self.get("/")[1], b"test game")
        for method in ("GET", "HEAD"):
            for path in ("/server-control/server.py", "/%73erver-control/server.py", "/.server-control-data/game-%s.json" % self.port, "/server.py", "/__server-control__/status"):
                self.assertEqual(self.get(path, method)[0], 404)
        self.assertEqual(self.get("/__server-control__/stop", "POST")[0], 404)
        self.assertFalse(self.game.toggle()["running"])
        self.assertFalse(self.game.listening())
        self.assertTrue(self.game.toggle()["running"])
        self.assertEqual(self.get("/")[0], 200)

    def test_unrelated_listener_is_never_stopped(self):
        other = control.ThreadingHTTPServer(("127.0.0.1", self.port), control.BaseHTTPRequestHandler)
        thread = threading.Thread(target=other.serve_forever, daemon=True)
        thread.start()
        try:
            self.assertFalse(self.game.status()["controllable"])
            with self.assertRaisesRegex(RuntimeError, "其他服务"):
                self.game.toggle()
            self.assertTrue(self.game.listening())
        finally:
            other.shutdown()
            other.server_close()
            thread.join(timeout=2)


if __name__ == "__main__":
    unittest.main()
