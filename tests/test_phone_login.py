"""Authentication and HTTP boundary tests; never contact an SMS provider."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import http.client
import importlib.util
import json
import sys
import tempfile
import threading
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("phone_app_server", ROOT / "scripts/serve-phone-app.py")
server_module = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = server_module
spec.loader.exec_module(server_module)
PhoneAuth, SmsConfig, AuthError = server_module.PhoneAuth, server_module.SmsConfig, server_module.AuthError
module = server_module.auth_module
TEST_PHONE = "13800000000"


class AuthFixture(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.clock = 1800000000.0
        self.sent = []
        self.config = SmsConfig(TEST_PHONE, "test-id", "test-secret", "test-app", "测试签名", "test-template")
        self.auth = PhoneAuth(self.config, self.directory.name, sender=lambda config, phone, code: self.sent.append((phone, code)), now=lambda: self.clock)

    def tearDown(self):
        self.auth.close()
        self.directory.cleanup()

    def login(self):
        self.auth.send(TEST_PHONE, "test-client")
        return self.auth.verify(TEST_PHONE, self.sent[-1][1], "test-client")


class AuthTests(AuthFixture):
    def test_disabled_service_never_sends_or_authenticates(self):
        self.auth.config = SmsConfig()
        with self.assertRaisesRegex(AuthError, "尚未启用"):
            self.auth.send(TEST_PHONE, "test-client")
        self.assertEqual(self.sent, [])
        self.assertIsNone(self.auth.session("invented-token"))

    def test_only_configured_owner_can_receive_a_code(self):
        with self.assertRaises(AuthError) as raised:
            self.auth.send("13900000000", "test-client")
        self.assertEqual(raised.exception.status, 403)
        self.assertEqual(self.sent, [])

    def test_real_provider_payload_is_only_sent_to_provider(self):
        response = self.auth.send(TEST_PHONE, "test-client")
        code = self.sent[0][1]
        self.assertEqual(self.sent[0][0], "+86" + TEST_PHONE)
        self.assertRegex(code, r"^\d{6}$")
        self.assertNotIn(code, json.dumps(response))
        self.assertNotIn(code, self.auth.db.execute("SELECT digest FROM codes").fetchone()[0])

    def test_code_is_single_use_and_sessions_can_be_revoked(self):
        token = self.login()
        self.assertEqual(self.auth.session(token)["maskedPhone"], "138****0000")
        with self.assertRaises(AuthError):
            self.auth.verify(TEST_PHONE, self.sent[0][1], "test-client")
        self.auth.logout(token)
        self.assertIsNone(self.auth.session(token))

    def test_expired_code_cannot_login(self):
        self.auth.send(TEST_PHONE, "test-client")
        self.clock += 300
        with self.assertRaises(AuthError):
            self.auth.verify(TEST_PHONE, self.sent[0][1], "test-client")

    def test_five_wrong_codes_invalidate_the_challenge(self):
        self.auth.send(TEST_PHONE, "test-client")
        correct = self.sent[0][1]
        wrong = "000000" if correct != "000000" else "111111"
        for _ in range(5):
            with self.assertRaises(AuthError):
                self.auth.verify(TEST_PHONE, wrong, "test-client")
        with self.assertRaises(AuthError):
            self.auth.verify(TEST_PHONE, correct, "test-client")

    def test_concurrent_verifications_only_succeed_once(self):
        self.auth.send(TEST_PHONE, "test-client")
        def verify(_):
            try:
                return self.auth.verify(TEST_PHONE, self.sent[0][1], "test-client")
            except AuthError:
                return None
        with ThreadPoolExecutor(2) as pool:
            tokens = list(pool.map(verify, range(2)))
        self.assertEqual(sum(token is not None for token in tokens), 1)

    def test_concurrent_sends_reserve_one_delivery(self):
        def send(_):
            try:
                return self.auth.send(TEST_PHONE, "test-client")
            except AuthError:
                return None
        with ThreadPoolExecutor(2) as pool:
            results = list(pool.map(send, range(2)))
        self.assertEqual(len(self.sent), 1)
        self.assertEqual(sum(result is not None for result in results), 1)

    def test_hourly_send_budget_cannot_be_bypassed_with_another_ip(self):
        for index in range(5):
            self.auth.send(TEST_PHONE, str(index))
            self.clock += 61
        with self.assertRaises(AuthError) as raised:
            self.auth.send(TEST_PHONE, "new-client")
        self.assertEqual(raised.exception.status, 429)
        self.assertEqual(len(self.sent), 5)

    def test_provider_failure_cannot_create_a_usable_code(self):
        def fail(config, phone, code):
            self.sent.append((phone, code))
            raise RuntimeError("Private provider response")
        self.auth.sender = fail
        with self.assertRaisesRegex(AuthError, "发送失败"):
            self.auth.send(TEST_PHONE, "test-client")
        with self.assertRaises(AuthError):
            self.auth.verify(TEST_PHONE, self.sent[0][1], "test-client")

    def test_session_survives_server_restart_but_expires_or_owner_change(self):
        token = self.login()
        self.auth.close()
        self.auth = PhoneAuth(self.config, self.directory.name, now=lambda: self.clock)
        self.assertIsNotNone(self.auth.session(token))
        self.auth.config = SmsConfig("13900000000", "id", "secret", "app", "sign", "template")
        self.assertIsNone(self.auth.session(token))
        self.auth.config = self.config
        self.clock += module.SESSION_TTL
        self.assertIsNone(self.auth.session(token))

    def test_provider_request_uses_template_and_no_key_in_body(self):
        request = module.signed_sms_request(self.config, "+86" + TEST_PHONE, "123456", 1800000000)
        body = json.loads(request.data)
        self.assertEqual(body["TemplateParamSet"], ["123456", "5"])
        self.assertEqual(body["PhoneNumberSet"], ["+86" + TEST_PHONE])
        self.assertNotIn("test-secret", request.data.decode())
        self.assertEqual(request.get_header("X-tc-version"), "2021-01-11")
        self.assertTrue(request.get_header("Authorization").startswith("TC3-HMAC-SHA256 "))

    def test_provider_rejecting_one_number_is_not_a_success(self):
        class Response:
            def __enter__(self): return self
            def __exit__(self, *_args): pass
            def read(self, _limit): return json.dumps({"Response": {"SendStatusSet": [{"Code": "FailedOperation.SignatureIncorrectOrUnapproved"}]}}).encode()
        with patch.object(module.urllib.request, "urlopen", return_value=Response()):
            with self.assertRaises(AuthError):
                module.send_tencent_sms(self.config, "+86" + TEST_PHONE, "123456")


class HTTPTests(AuthFixture):
    def setUp(self):
        super().setUp()
        self.server = server_module.make_server(self.auth, port=0)
        self.port = self.server.server_address[1]
        self.origin = f"http://127.0.0.1:{self.port}"
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join()
        super().tearDown()

    def request(self, method, path, data=None, cookie="", origin=None, host=None):
        connection = http.client.HTTPConnection("127.0.0.1", self.port)
        headers = {"Origin": self.origin if origin is None else origin}
        if data is not None: headers["Content-Type"] = "application/json"
        if cookie: headers["Cookie"] = cookie
        if host: headers["Host"] = host
        connection.request(method, path, body=json.dumps(data) if data is not None else None, headers=headers)
        response = connection.getresponse()
        result = response.status, dict(response.getheaders()), response.read()
        connection.close()
        return result

    def http_login(self):
        status, _, response = self.request("POST", "/api/phone/send", {"phone": TEST_PHONE})
        self.assertEqual(status, 200)
        self.assertNotIn(self.sent[-1][1].encode(), response)
        status, headers, _ = self.request("POST", "/api/phone/verify", {"phone": TEST_PHONE, "code": self.sent[-1][1]})
        self.assertEqual(status, 200)
        self.assertIn("HttpOnly", headers["Set-Cookie"])
        return headers["Set-Cookie"].split(";", 1)[0]

    def test_direct_game_pages_and_assets_require_authentication(self):
        for path in ["/app.html", "/index.html", "/season2.html", "/season2-lv15.html"]:
            status, headers, _ = self.request("GET", path)
            self.assertEqual(status, 302)
            self.assertTrue(headers["Location"].startswith("/phone-login/"))
        self.assertEqual(self.request("GET", "/game.js")[0], 401)
        self.assertEqual(self.request("GET", "/lib/city-world.mjs")[0], 401)

    def test_public_login_and_status_do_not_leak_owner_phone(self):
        status, headers, body = self.request("GET", "/phone-login/")
        self.assertEqual(status, 200)
        self.assertIn("default-src 'self'", headers["Content-Security-Policy"])
        self.assertNotIn(TEST_PHONE.encode(), body)
        status, _, body = self.request("GET", "/api/phone/session")
        self.assertEqual(json.loads(body), {"mode": "sms", "ready": True, "authenticated": False, "profile": None})

    def test_complete_login_game_access_logout_and_revocation(self):
        cookie = self.http_login()
        status, headers, body = self.request("GET", "/app.html", cookie=cookie)
        self.assertEqual(status, 200)
        self.assertIn(b"GAME_PHONE_SESSION", body)
        self.assertEqual(headers["Cache-Control"], "no-store")
        self.assertEqual(self.request("GET", "/lib/city-world.mjs", cookie=cookie)[0], 200)
        self.assertEqual(self.request("POST", "/api/phone/logout", {}, cookie=cookie)[0], 200)
        self.assertEqual(self.request("GET", "/game.js", cookie=cookie)[0], 401)

    def test_secrets_database_and_traversal_are_never_served(self):
        cookie = self.http_login()
        for path in ["/.git/config", "/phone-login/.env", "/phone-login/auth.py", "/.phone-login-data/auth.sqlite3", "/assets/%2e%2e/README.md", "/assets/%2e%2e/game.js", "/assets/..%5cgame.js"]:
            self.assertEqual(self.request("GET", path, cookie=cookie)[0], 404, path)

    def test_cross_origin_sends_and_wrong_host_are_rejected(self):
        self.assertEqual(self.request("POST", "/api/phone/send", {"phone": TEST_PHONE}, origin="https://other.example")[0], 403)
        self.assertEqual(self.request("GET", "/phone-login/", host="other.example")[0], 421)
        self.assertEqual(self.sent, [])

    def test_https_cookie_is_secure(self):
        self.server.RequestHandlerClass = server_module.partial(server_module.PhoneHandler, auth=self.auth, origin="https://game.example")
        self.auth.send(TEST_PHONE, "direct-test")
        status, headers, _ = self.request("POST", "/api/phone/verify", {"phone": TEST_PHONE, "code": self.sent[-1][1]}, host="game.example", origin="https://game.example")
        self.assertEqual(status, 200)
        self.assertIn("; Secure", headers["Set-Cookie"])

    def test_private_service_worker_does_not_precache_game(self):
        status, headers, body = self.request("GET", "/sw.js")
        self.assertEqual(status, 200)
        self.assertNotIn(b"cache.put", body)
        self.assertIn(b"caches.delete", body)
        self.assertEqual(headers["Cache-Control"], "no-store")

    def test_demo_http_flow_displays_code_without_an_sms_service(self):
        self.auth.close()
        self.auth = server_module.DemoPhoneAuth(self.directory.name, now=lambda: self.clock)
        self.server.RequestHandlerClass = server_module.partial(server_module.PhoneHandler, auth=self.auth, origin=self.origin)
        with patch.object(module.urllib.request, "urlopen") as network:
            status, _, body = self.request("GET", "/api/phone/session")
            self.assertEqual(json.loads(body)["mode"], "demo")
            status, _, body = self.request("POST", "/api/phone/send", {"phone": TEST_PHONE})
            self.assertEqual(status, 200)
            demo = json.loads(body)["demoCode"]
            self.assertRegex(demo, r"^\d{6}$")
            status, headers, _ = self.request("POST", "/api/phone/verify", {"phone": TEST_PHONE, "code": demo})
            self.assertEqual(status, 200)
            self.assertEqual(self.request("GET", "/app.html", cookie=headers["Set-Cookie"].split(";", 1)[0])[0], 200)
            network.assert_not_called()


class DemoTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.auth = server_module.DemoPhoneAuth(self.directory.name)

    def tearDown(self):
        self.auth.close()
        self.directory.cleanup()

    def test_demo_code_is_bound_to_its_phone_and_can_only_be_used_once(self):
        code = self.auth.send(TEST_PHONE, "client")["demoCode"]
        with self.assertRaises(AuthError):
            self.auth.verify("13900000000", code, "client")
        token = self.auth.verify(TEST_PHONE, code, "client")
        self.assertIsNotNone(self.auth.session(token))
        with self.assertRaises(AuthError):
            self.auth.verify(TEST_PHONE, code, "client")

    def test_demo_can_preserve_an_optional_owner_number(self):
        self.auth.config = module.DemoConfig(TEST_PHONE)
        with self.assertRaises(AuthError):
            self.auth.send("13900000000", "client")


if __name__ == "__main__":
    unittest.main()
