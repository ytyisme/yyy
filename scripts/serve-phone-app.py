#!/usr/bin/env python3
"""Serve the complete game behind owner-only SMS authentication.

Local preview works without SMS credentials and clearly shows an inactive service.
Production requires an HTTPS reverse proxy and a configured GAME_PHONE_ORIGIN.
"""
from functools import partial
from http.cookies import CookieError, SimpleCookie
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import argparse
import importlib.util
import json
import os
import sys
import urllib.parse

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("game_phone_auth", ROOT / "phone-login/auth.py")
auth_module = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = auth_module
spec.loader.exec_module(auth_module)
PhoneAuth, SmsConfig, AuthError = auth_module.PhoneAuth, auth_module.SmsConfig, auth_module.AuthError
DemoPhoneAuth = auth_module.DemoPhoneAuth
COOKIE, SESSION_TTL = auth_module.COOKIE, auth_module.SESSION_TTL
PUBLIC = {
    "/login-agreement.css": "login-agreement.css",
    "/login-agreement.js": "login-agreement.js",
    "/phone-login/": "phone-login/index.html",
    "/phone-login/index.html": "phone-login/index.html",
    "/phone-login/login.css": "phone-login/login.css",
    "/phone-login/login.js": "phone-login/login.js",
    "/phone-login/game-session.js": "phone-login/game-session.js",
    "/phone-login/demo-session.js": "phone-login/demo-session.js",
    "/sw.js": "phone-login/private-sw.js",
    "/manifest.webmanifest": "manifest.webmanifest",
    "/app-icons/icon-180.png": "app-icons/icon-180.png",
    "/app-icons/icon-192.png": "app-icons/icon-192.png",
    "/app-icons/icon-512.png": "app-icons/icon-512.png",
}
ASSET_DIRS = {"lib", "levels", "audio", "assets", "app-icons"}
ASSET_SUFFIXES = {".html", ".js", ".mjs", ".css", ".webmanifest", ".json", ".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif", ".m4a", ".mp3", ".wav", ".mp4", ".webm", ".ogg", ".woff", ".woff2"}


def load_environment(path):
    if not path.exists():
        return
    for line in path.read_text().splitlines():
        value = line.strip()
        if not value or value.startswith("#"):
            continue
        key, separator, content = value.partition("=")
        if not separator or key not in {"GAME_OWNER_PHONE", "TENCENTCLOUD_SECRET_ID", "TENCENTCLOUD_SECRET_KEY", "GAME_SMS_APP_ID", "GAME_SMS_SIGN_NAME", "GAME_SMS_TEMPLATE_ID", "GAME_SMS_REGION", "GAME_PHONE_ORIGIN"}:
            raise ValueError("Unsupported phone login configuration entry")
        os.environ.setdefault(key, content.strip().strip("\"'"))


class PhoneHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, auth, origin, **kwargs):
        self.auth, self.origin = auth, origin.rstrip("/")
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("Referrer-Policy", "same-origin")
        super().end_headers()

    def log_message(self, *_args):
        # Do not log login data, tokens, requested query strings, or SMS payloads.
        pass

    def send_data(self, status, body, content_type, extra=None):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        for key, value in (extra or {}).items():
            self.send_header(key, value)
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(body)

    def json_response(self, status, data, extra=None):
        self.send_data(status, json.dumps(data, ensure_ascii=False).encode(), "application/json; charset=utf-8", extra)

    def valid_host(self):
        if self.headers.get("Host", "").lower() != urllib.parse.urlsplit(self.origin).netloc.lower():
            self.json_response(421, {"error": "访问地址不匹配"})
            return False
        return True

    def token(self):
        try:
            cookies = SimpleCookie(self.headers.get("Cookie", ""))
            return cookies[COOKIE].value if COOKIE in cookies else ""
        except CookieError:
            return ""

    def cookie_header(self, token, lifetime=SESSION_TTL):
        cookie = f"{COOKIE}={token}; Path=/; HttpOnly; SameSite=Lax; Max-Age={lifetime}"
        if self.origin.startswith("https://"):
            cookie += "; Secure"
        return cookie

    def path_file(self, path):
        decoded = urllib.parse.unquote(path)
        if "\\" in decoded or "\x00" in decoded:
            return None
        parts = Path(decoded.lstrip("/")).parts
        if not parts or any(part in {".", ".."} or part.startswith(".") for part in parts):
            return None
        if len(parts) > 1 and parts[0] not in ASSET_DIRS:
            return None
        file = ROOT.joinpath(*parts).resolve()
        if ROOT not in file.parents or not file.is_file() or file.suffix.lower() not in ASSET_SUFFIXES:
            return None
        return file

    def serve_file(self, file, profile=None):
        if file.suffix == ".html":
            body = file.read_text()
            if file == ROOT / "phone-login/index.html" and not getattr(self.auth, "demo", False):
                body = body.replace('data-phone-mode="demo"', 'data-phone-mode="sms"')
            if profile:
                data = json.dumps(profile, ensure_ascii=False).replace("<", "\\u003c")
                bridge = f'<script>window.GAME_PHONE_SESSION={data};try{{localStorage.setItem("s2_player",window.GAME_PHONE_SESSION.displayName)}}catch{{}}</script><script defer src="/phone-login/game-session.js"></script>'
                body = body.replace("</head>", bridge + "</head>", 1)
            else:
                self.send_data(200, body.encode(), "text/html; charset=utf-8", {"Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'"})
                return
            self.send_data(200, body.encode(), "text/html; charset=utf-8")
            return
        # Streaming avoids buffering the game's large audio and video files.
        self.send_response(200)
        content_type = "text/javascript" if file.suffix == ".mjs" else self.guess_type(str(file))
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(file.stat().st_size))
        self.end_headers()
        if self.command != "HEAD":
            with file.open("rb") as handle:
                self.copyfile(handle, self.wfile)

    def do_GET(self):
        if not self.valid_host():
            return
        path = urllib.parse.urlsplit(self.path).path
        profile = self.auth.session(self.token())
        if path == "/api/phone/session":
            self.json_response(200, {"mode": "demo" if getattr(self.auth, "demo", False) else "sms", "ready": self.auth.config.ready, "authenticated": bool(profile), "profile": profile})
            return
        if path.startswith("/api/"):
            self.json_response(405, {"error": "请使用 POST 请求"})
            return
        if path == "/phone-login":
            self.send_data(302, b"", "text/plain", {"Location": "/phone-login/"})
            return
        if path in PUBLIC:
            self.serve_file(ROOT / PUBLIC[path])
            return
        if not profile:
            if self.headers.get("Sec-Fetch-Dest") in {None, "document"} and (path == "/" or path.endswith(".html")):
                next_path = self.path if path != "/" else "/app.html"
                self.send_data(302, b"", "text/plain", {"Location": "/phone-login/?next=" + urllib.parse.quote(next_path, safe="")})
            else:
                self.json_response(401, {"error": "请先用手机号登录"})
            return
        if path == "/":
            self.send_data(302, b"", "text/plain", {"Location": "/app.html"})
            return
        file = self.path_file(path)
        if file is None:
            self.json_response(404, {"error": "文件不存在"})
            return
        self.serve_file(file, profile)

    def do_HEAD(self):
        self.do_GET()

    def do_POST(self):
        if not self.valid_host():
            return
        try:
            if self.headers.get("Origin") != self.origin:
                raise AuthError("请从游戏登录页面进行操作", 403)
            if self.headers.get("Content-Type", "").split(";", 1)[0] != "application/json":
                raise AuthError("请求格式错误", 415)
            try:
                size = int(self.headers.get("Content-Length", "0"))
            except ValueError:
                raise AuthError("请求格式错误", 400)
            if size <= 0 or size > 2048:
                raise AuthError("请求大小无效", 413)
            try:
                data = json.loads(self.rfile.read(size))
            except (ValueError, UnicodeError):
                raise AuthError("请求格式错误", 400)
            if not isinstance(data, dict):
                raise AuthError("请求格式错误", 400)
            path = urllib.parse.urlsplit(self.path).path
            # Reverse proxy headers are intentionally ignored for rate limiting.
            address = self.client_address[0]
            if path == "/api/phone/send":
                self.json_response(200, self.auth.send(data.get("phone"), address))
            elif path == "/api/phone/verify":
                if data.get("agreementAccepted") is not True:
                    raise AuthError("请先阅读并勾选同意用户协议和隐私政策", 400)
                token = self.auth.verify(data.get("phone"), data.get("code"), address)
                self.auth.logout(self.token())
                self.json_response(200, {"authenticated": True}, {"Set-Cookie": self.cookie_header(token)})
            elif path == "/api/phone/logout":
                self.auth.logout(self.token())
                self.json_response(200, {"authenticated": False}, {"Set-Cookie": self.cookie_header("", 0)})
            else:
                self.json_response(404, {"error": "接口不存在"})
        except AuthError as error:
            data = {"error": str(error)}
            if error.retry_after:
                data["retryAfter"] = error.retry_after
            self.json_response(error.status, data)


def make_server(auth, port=8081, origin=None):
    server = ThreadingHTTPServer(("127.0.0.1", port), PhoneHandler)
    server.RequestHandlerClass = partial(PhoneHandler, auth=auth, origin=origin or f"http://127.0.0.1:{server.server_address[1]}")
    return server


def main():
    parser = argparse.ArgumentParser(description="Phone demo login; use --sms for real SMS authentication")
    parser.add_argument("port", nargs="?", type=int, default=8081)
    parser.add_argument("--sms", action="store_true", help="Require the real SMS service instead of displaying demo codes")
    args = parser.parse_args()
    load_environment(ROOT / "phone-login/.env")
    port = args.port
    origin = os.environ.get("GAME_PHONE_ORIGIN", f"http://127.0.0.1:{port}").rstrip("/")
    parsed = urllib.parse.urlsplit(origin)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc or parsed.path or parsed.query or parsed.fragment or parsed.username:
        raise ValueError("GAME_PHONE_ORIGIN must be a bare origin")
    if parsed.scheme != "https" and parsed.hostname not in {"127.0.0.1", "localhost"}:
        raise ValueError("Hosted phone login requires HTTPS")
    auth = PhoneAuth(SmsConfig.from_env(), ROOT / ".phone-login-data/sms") if args.sms else DemoPhoneAuth(ROOT / ".phone-login-data/demo", os.environ.get("GAME_OWNER_PHONE", ""))
    server = make_server(auth, port, origin)
    print(f"手机号登录预览: {origin}/phone-login/", flush=True)
    print(("短信服务已配置" if auth.config.ready else "短信服务尚未配置：不会发送短信，也不会允许登录。") if args.sms else "演示登录已启用：验证码显示在页面，不发送短信。", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
        auth.close()


if __name__ == "__main__":
    main()
