#!/usr/bin/env python3
"""EiliEili: independent video library with persistent local storage."""
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlsplit
import json
import os
import re
import secrets
import sqlite3
import time

ROOT = Path(__file__).resolve().parent
DATA = Path(os.environ.get('EILIEILI_DATA', ROOT / '.data'))
LIMIT = 100 * 1024 * 1024
DATA.mkdir(parents=True, exist_ok=True)
(DATA / 'videos').mkdir(exist_ok=True)
with sqlite3.connect(DATA / 'videos.sqlite3') as db:
    db.execute('CREATE TABLE IF NOT EXISTS videos (id TEXT PRIMARY KEY, title TEXT NOT NULL, author TEXT NOT NULL, description TEXT NOT NULL, category TEXT NOT NULL, mime TEXT NOT NULL, size INTEGER NOT NULL, created INTEGER NOT NULL)')

class Handler(BaseHTTPRequestHandler):
    def json_reply(self, code, data):
        body = json.dumps(data, ensure_ascii=False).encode()
        self.send_response(code); self.send_header('Content-Type', 'application/json; charset=utf-8'); self.send_header('Content-Length', str(len(body))); self.send_header('Cache-Control', 'no-store'); self.end_headers(); self.wfile.write(body)

    def do_GET(self):
        path = urlsplit(self.path).path
        if path == '/robots.txt':
            body = b'User-agent: *\nAllow: /\nDisallow: /api/\n'
            self.send_response(200); self.send_header('Content-Type', 'text/plain; charset=utf-8'); self.send_header('Content-Length', str(len(body))); self.end_headers(); self.wfile.write(body); return
        if path == '/api/videos':
            with sqlite3.connect(DATA / 'videos.sqlite3') as db:
                rows = db.execute('SELECT id,title,author,description,category,created FROM videos ORDER BY created DESC LIMIT 200').fetchall()
            return self.json_reply(200, {'videos': [dict(zip(('id','title','author','description','category','created'), row)) for row in rows]})
        match = re.fullmatch(r'/media/([0-9a-f]{32})', path)
        if match:
            with sqlite3.connect(DATA / 'videos.sqlite3') as db:
                row = db.execute('SELECT mime,size FROM videos WHERE id=?', (match.group(1),)).fetchone()
            if not row: return self.send_error(404)
            mime, size = row; start, end = 0, size - 1
            header = self.headers.get('Range')
            if header:
                m = re.fullmatch(r'bytes=(\d*)-(\d*)', header)
                if not m or not (m.group(1) or m.group(2)) or (m.group(1) and int(m.group(1)) >= size) or (not m.group(1) and int(m.group(2)) == 0):
                    self.send_response(416); self.send_header('Content-Range', f'bytes */{size}'); self.end_headers(); return
                if m.group(1):
                    start = int(m.group(1)); end = min(int(m.group(2)) if m.group(2) else end, end)
                else: start = max(0, size-int(m.group(2)))
                if end < start: return self.send_error(416)
            self.send_response(206 if header else 200); self.send_header('Content-Type', mime); self.send_header('Accept-Ranges', 'bytes'); self.send_header('Content-Length', str(end-start+1))
            if header: self.send_header('Content-Range', f'bytes {start}-{end}/{size}')
            self.end_headers()
            with (DATA / 'videos' / match.group(1)).open('rb') as f:
                f.seek(start); remaining = end-start+1
                while remaining:
                    chunk = f.read(min(65536, remaining))
                    if not chunk: break
                    self.wfile.write(chunk); remaining -= len(chunk)
            return
        files = {'/': ('index.html','text/html; charset=utf-8'), '/app.js': ('app.js','text/javascript; charset=utf-8'), '/style.css': ('style.css','text/css; charset=utf-8'), '/logo.png': ('logo.png','image/png')}
        if path not in files: return self.send_error(404)
        filename, mime = files[path]; body = (ROOT / filename).read_bytes()
        self.send_response(200); self.send_header('Content-Type', mime); self.send_header('Content-Length', str(len(body))); self.end_headers(); self.wfile.write(body)

    def do_POST(self):
        if urlsplit(self.path).path != '/api/videos': return self.send_error(404)
        params = parse_qs(urlsplit(self.path).query)
        title = params.get('title',[''])[0].strip()[:100]; author = params.get('author',[''])[0].strip()[:40]; description = params.get('description',[''])[0].strip()[:2000]; category = params.get('category',[''])[0]
        try: size = int(self.headers.get('Content-Length','0'))
        except ValueError: return self.json_reply(400, {'error':'文件大小无效'})
        mime = self.headers.get('Content-Type','').split(';')[0]
        if not title or not author or category not in ('生活','游戏','音乐','知识','动画','其他'): return self.json_reply(400, {'error':'请填写标题、昵称并选择分类'})
        if mime not in ('video/mp4','video/webm') or not 0 < size <= LIMIT: return self.json_reply(400, {'error':'请选择不超过 100 MB 的 MP4 或 WebM 视频'})
        video_id = secrets.token_hex(16); target = DATA / 'videos' / video_id
        first = self.rfile.read(min(size, 16))
        if not ((mime == 'video/mp4' and first[4:8] == b'ftyp') or (mime == 'video/webm' and first.startswith(b'\x1a\x45\xdf\xa3'))): return self.json_reply(400, {'error':'视频文件格式不正确'})
        remaining = size-len(first)
        try:
            with target.open('xb') as out:
                out.write(first)
                while remaining:
                    chunk = self.rfile.read(min(65536, remaining))
                    if not chunk: raise OSError('上传中断')
                    out.write(chunk); remaining -= len(chunk)
            with sqlite3.connect(DATA / 'videos.sqlite3') as db:
                db.execute('INSERT INTO videos VALUES (?,?,?,?,?,?,?,?)',(video_id,title,author,description,category,mime,size,int(time.time())))
        except OSError:
            target.unlink(missing_ok=True); return self.json_reply(500, {'error':'上传未完成，请重试'})
        self.json_reply(201, {'id':video_id})

if __name__ == '__main__':
    port = int(os.environ.get('EILIEILI_PORT','8082'))
    server = ThreadingHTTPServer(('0.0.0.0',port), Handler)
    print(f'EiliEili 已启动: http://127.0.0.1:{port}', flush=True)
    server.serve_forever()
