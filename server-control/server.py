#!/usr/bin/env python3
"""An independent, password-protected switch for the local/LAN game server."""

import argparse
import getpass
import hashlib
import http.client
from http import cookies
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import ipaddress
import json
from pathlib import Path
import secrets
import socket
import subprocess
import sys
import threading
import time
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parent.parent
WEB_ROOT = Path(__file__).resolve().parent
DATA = ROOT / ".server-control-data"
COOKIE = "game_control_session"
SESSION_TTL = 12 * 60 * 60


def write_private(path, value):
    path.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
    temporary = path.with_suffix(".tmp")
    with open(temporary, "w", encoding="utf-8") as file:
        import os
        os.chmod(temporary, 0o600)
        json.dump(value, file, ensure_ascii=False)
    temporary.replace(path)


class Authentication:
    def __init__(self, path):
        self.path = Path(path)
        self.credentials = json.loads(self.path.read_text(encoding="utf-8"))
        self.sessions = {}
        self.lock = threading.Lock()

    @staticmethod
    def configure(path, name, password):
        if not name.strip() or not password:
            raise ValueError("姓名和密码不能为空")
        salt = secrets.token_bytes(32)
        digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 310000)
        write_private(Path(path), {"name": name.strip(), "salt": salt.hex(), "digest": digest.hex()})

    def login(self, name, password):
        digest = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(self.credentials["salt"]), 310000)
        correct_name = secrets.compare_digest(name.encode(), self.credentials["name"].encode())
        if not correct_name or not secrets.compare_digest(digest.hex(), self.credentials["digest"]):
            return None
        token = secrets.token_urlsafe(32)
        session = {"csrf": secrets.token_urlsafe(32), "expires": time.monotonic() + SESSION_TTL}
        with self.lock:
            self.sessions = {key: value for key, value in self.sessions.items() if value["expires"] > time.monotonic()}
            self.sessions[token] = session
        return token, session

    def session(self, cookie_header):
        jar = cookies.SimpleCookie()
        try:
            jar.load(cookie_header or "")
            token = jar[COOKIE].value if COOKIE in jar else ""
        except cookies.CookieError:
            return None
        with self.lock:
            session = self.sessions.get(token)
            if session and session["expires"] > time.monotonic():
                return session
            self.sessions.pop(token, None)
        return None


def lan_addresses():
    addresses = set()
    try:
        addresses.update(info[4][0] for info in socket.getaddrinfo(socket.gethostname(), None, socket.AF_INET))
    except OSError:
        pass
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as probe:
            probe.connect(("1.1.1.1", 80))
            addresses.add(probe.getsockname()[0])
    except OSError:
        pass
    return sorted(ip for ip in addresses if ipaddress.ip_address(ip).is_private
                  and not ip.startswith(("127.", "169.254.", "198.18.", "198.19.")))


class GameServer:
    def __init__(self, root=ROOT, data=DATA, port=8080):
        self.root = Path(root).resolve()
        self.data = Path(data)
        self.port = port
        self.lock = threading.Lock()
        self.child = None

    def listening(self):
        try:
            with socket.create_connection(("127.0.0.1", self.port), timeout=0.3):
                return True
        except OSError:
            return False

    def identity(self):
        try:
            runtime = json.loads((self.data / f"game-{self.port}.json").read_text())
            if runtime.get("root") != str(self.root) or runtime.get("port") != self.port:
                return None
            connection = http.client.HTTPConnection("127.0.0.1", self.port, timeout=0.8)
            try:
                connection.request("GET", "/__server-control__/status", headers={"X-Control-Token": runtime["token"]})
                response = connection.getresponse()
                identity = json.loads(response.read()) if response.status == 200 else {}
                if all(identity.get(key) == runtime.get(key) for key in ("root", "pid", "port")):
                    return runtime
            finally:
                connection.close()
        except (OSError, ValueError, KeyError, http.client.HTTPException):
            pass
        return None

    def status(self):
        running = self.listening()
        return {"running": running, "controllable": not running or self.identity() is not None,
                "urls": [f"http://127.0.0.1:{self.port}/", *[f"http://{ip}:{self.port}/" for ip in lan_addresses()]]}

    def toggle(self):
        with self.lock:
            if self.listening():
                identity = self.identity()
                if not identity:
                    raise RuntimeError(f"{self.port}端口被其他服务占用，无法控制。")
                connection = http.client.HTTPConnection("127.0.0.1", self.port, timeout=3)
                try:
                    connection.request("POST", "/__server-control__/stop", body=b"", headers={"X-Control-Token": identity["token"]})
                    response = connection.getresponse()
                    response.read()
                    if response.status != 200:
                        raise RuntimeError("游戏服务器拒绝关闭，请重试。")
                finally:
                    connection.close()
                deadline = time.monotonic() + 5
                while self.listening() and time.monotonic() < deadline:
                    time.sleep(0.1)
                if self.listening():
                    raise RuntimeError("游戏服务器仍在关闭中，请稍后重试。")
                if self.child:
                    self.child.wait(timeout=5)
                    self.child = None
            else:
                self.data.mkdir(mode=0o700, parents=True, exist_ok=True)
                with open(self.data / "game.log", "ab") as log:
                    self.child = subprocess.Popen([sys.executable, "-u", str(self.root / "server.py"), str(self.port)],
                                                  cwd=self.root, stdin=subprocess.DEVNULL, stdout=log,
                                                  stderr=log, start_new_session=True)
                deadline = time.monotonic() + 5
                while time.monotonic() < deadline:
                    if self.identity():
                        break
                    if self.child.poll() is not None:
                        raise RuntimeError("启动失败，请查看本机游戏服务器日志。")
                    time.sleep(0.1)
                if not self.identity():
                    raise RuntimeError("启动超时，请稍后重试。")
            return self.status()


class ControlHandler(BaseHTTPRequestHandler):
    def log_message(self, *_):
        pass

    def reply(self, status, body, content_type="application/json; charset=utf-8", cookie=None):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("Referrer-Policy", "same-origin")
        self.send_header("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'")
        if cookie:
            self.send_header("Set-Cookie", cookie)
        self.end_headers()
        self.wfile.write(body)

    def json_reply(self, status, value, cookie=None):
        self.reply(status, json.dumps(value, ensure_ascii=False).encode(), cookie=cookie)

    def valid_host(self):
        if self.headers.get("Host", "") not in self.server.allowed_hosts:
            self.json_reply(421, {"error": "地址不匹配"})
            return False
        return True

    def authorized(self):
        session = self.server.auth.session(self.headers.get("Cookie"))
        if not session:
            self.json_reply(401, {"error": "请先输入正确的姓名和密码"})
        return session

    def do_GET(self):
        if not self.valid_host():
            return
        path = urlsplit(self.path).path
        if path in ("/api/session", "/api/status"):
            session = self.authorized()
            if session:
                self.json_reply(200, {**self.server.game.status(), "csrf": session["csrf"]})
            return
        assets = {"/": ("index.html", "text/html; charset=utf-8"),
                  "/index.html": ("index.html", "text/html; charset=utf-8"),
                  "/style.css": ("style.css", "text/css; charset=utf-8"),
                  "/app.js": ("app.js", "text/javascript; charset=utf-8")}
        if path not in assets:
            self.json_reply(404, {"error": "页面不存在"})
            return
        file, mime = assets[path]
        self.reply(200, (WEB_ROOT / file).read_bytes(), mime)

    def do_POST(self):
        if not self.valid_host():
            return
        if self.headers.get("Origin") != "http://" + self.headers.get("Host", ""):
            self.json_reply(403, {"error": "请求来源不匹配"})
            return
        path = urlsplit(self.path).path
        if path == "/api/login":
            try:
                size = int(self.headers.get("Content-Length", "0"))
                if not 0 < size <= 4096 or self.headers.get("Content-Type", "").split(";")[0] != "application/json":
                    raise ValueError()
                data = json.loads(self.rfile.read(size))
                name, password = data["name"], data["password"]
                if not isinstance(name, str) or not isinstance(password, str):
                    raise ValueError()
            except (ValueError, KeyError, TypeError):
                self.json_reply(400, {"error": "请输入姓名和密码"})
                return
            result = self.server.auth.login(name, password)
            if not result:
                self.json_reply(401, {"error": "姓名或密码不正确，不能使用服务器开关"})
                return
            token, session = result
            self.json_reply(200, {**self.server.game.status(), "csrf": session["csrf"]},
                            cookie=f"{COOKIE}={token}; HttpOnly; SameSite=Strict; Path=/; Max-Age={SESSION_TTL}")
            return
        if path != "/api/toggle":
            self.json_reply(404, {"error": "页面不存在"})
            return
        session = self.authorized()
        if not session:
            return
        if not secrets.compare_digest(self.headers.get("X-CSRF-Token", ""), session["csrf"]):
            self.json_reply(403, {"error": "登录验证失效，请刷新后重试"})
            return
        try:
            self.json_reply(200, self.server.game.toggle())
        except (RuntimeError, OSError, subprocess.TimeoutExpired) as error:
            self.json_reply(409, {"error": str(error)})


def create_server(auth, game, host="0.0.0.0", port=8081):
    server = ThreadingHTTPServer((host, port), ControlHandler)
    actual_port = server.server_address[1]
    server.allowed_hosts = {f"{ip}:{actual_port}" for ip in ("127.0.0.1", "localhost", *lan_addresses())}
    server.auth, server.game = auth, game
    return server


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8081)
    parser.add_argument("--game-port", type=int, default=8080)
    parser.add_argument("--setup", action="store_true", help="设置控制网站的姓名和密码")
    args = parser.parse_args()
    credential_path = DATA / "credentials.json"
    if args.setup:
        name = input("姓名：")
        password = getpass.getpass("密码（输入不显示）：")
        Authentication.configure(credential_path, name, password)
        print("登录信息已保存。")
        return
    if not credential_path.exists():
        parser.error("请先运行 python3 server-control/server.py --setup 设置登录信息。")
    server = create_server(Authentication(credential_path), GameServer(port=args.game_port), port=args.port)
    print(f"服务器开关：http://127.0.0.1:{args.port}/", flush=True)
    for ip in lan_addresses():
        print(f"局域网控制：http://{ip}:{args.port}/", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
