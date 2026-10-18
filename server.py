#!/usr/bin/env python3
"""Serve the game with no-cache headers so phones always get the latest files."""

from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
import os
import secrets
import socket
import sys
import threading
from urllib.parse import unquote, urlsplit

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
ROOT = os.path.dirname(os.path.abspath(__file__))
BUILD = "266"
CONTROL_DATA = os.path.join(ROOT, ".server-control-data")
CONTROL_TOKEN = secrets.token_urlsafe(32)


def private_path(path):
    parts = [part for part in unquote(urlsplit(path).path).split("/") if part]
    return any(part.startswith(".") for part in parts) or any(
        part in ("server-control", "server.py", "community_store.py", "__server-control__") for part in parts
    )


def lan_ips():
    ips = []
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.connect(("1.1.1.1", 80))
        ip = sock.getsockname()[0]
        sock.close()
        if ip and not ip.startswith("127."):
            ips.append(ip)
    except OSError:
        pass
    try:
        for info in socket.getaddrinfo(socket.gethostname(), None, socket.AF_INET):
            ip = info[4][0]
            if ip and ip not in ips and not ip.startswith("127."):
                ips.append(ip)
    except OSError:
        pass
    return ips


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def handle(self):
        try:
            super().handle()
        except OSError:
            pass

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def do_GET(self):
        if self.community_request():
            return
        if urlsplit(self.path).path == "/__server-control__/status":
            if not self.control_authorized():
                self.send_error(404)
                return
            body = json.dumps({"root": ROOT, "pid": os.getpid(), "port": PORT}).encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        if private_path(self.path):
            self.send_error(404)
            return
        path = self.path.split("?", 1)[0]
        if path in ("/lan.json", "/version.json"):
            payload = {
                "gameServer": True,
                "build": BUILD,
                "urls": [f"http://{ip}:{PORT}/?v={BUILD}" for ip in lan_ips()],
            }
            body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        return super().do_GET()

    def do_HEAD(self):
        if self.community_request():
            return
        if private_path(self.path):
            self.send_error(404)
            return
        return super().do_HEAD()

    def control_authorized(self):
        return self.client_address[0] in ("127.0.0.1", "::1") and secrets.compare_digest(
            self.headers.get("X-Control-Token", ""), CONTROL_TOKEN
        )

    def do_POST(self):
        if self.community_request():
            return
        if urlsplit(self.path).path != "/__server-control__/stop" or not self.control_authorized():
            self.send_error(404)
            return
        body = b'{"stopping":true}'
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)
        threading.Thread(target=self.server.shutdown, daemon=True).start()

    def community_request(self):
        if not urlsplit(self.path).path.startswith('/api/community/'):
            return False
        from community_store import handle
        return handle(self)

    def list_directory(self, path):
        self.send_error(404)
        return None


if __name__ == "__main__":
    server = ThreadingHTTPServer(("0.0.0.0", PORT), Handler)
    os.makedirs(CONTROL_DATA, mode=0o700, exist_ok=True)
    runtime_path = os.path.join(CONTROL_DATA, f"game-{PORT}.json")
    runtime = {"root": ROOT, "pid": os.getpid(), "port": PORT, "token": CONTROL_TOKEN}
    temporary_path = runtime_path + f".{os.getpid()}.tmp"
    with open(os.open(temporary_path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600), "w") as file:
        json.dump(runtime, file)
    os.replace(temporary_path, runtime_path)
    print(f"电脑打开: http://127.0.0.1:{PORT}/?v={BUILD}")
    ips = lan_ips()
    if ips:
        for ip in ips:
            print(f"手机打开: http://{ip}:{PORT}/?v={BUILD}")
    else:
        print("没找到局域网 IP，手机请和电脑连同一个 WiFi 后再试。")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n已停止")
    finally:
        server.server_close()
        try:
            with open(runtime_path) as file:
                current = json.load(file)
            if current.get("token") == CONTROL_TOKEN:
                os.unlink(runtime_path)
        except (OSError, ValueError):
            pass
