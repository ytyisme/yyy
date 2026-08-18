#!/usr/bin/env python3
"""Serve the game with no-cache headers so phones always get the latest files."""

from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
import os
import socket
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
ROOT = os.path.dirname(os.path.abspath(__file__))
BUILD = "40"


def lan_ips():
    ips = []
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.connect(("223.5.5.5", 80))
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
        path = self.path.split("?", 1)[0]
        if path in ("/lan.json", "/version.json"):
            payload = {
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


if __name__ == "__main__":
    server = ThreadingHTTPServer(("0.0.0.0", PORT), Handler)
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
