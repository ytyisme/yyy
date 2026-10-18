"""Persistent maps and community posts for the game server (stdlib only)."""
import hashlib
import json
import math
import os
from pathlib import Path
import re
import secrets
import sqlite3
import time
import threading
from contextlib import contextmanager
from urllib.parse import parse_qs, urlsplit

ID = re.compile(r"^[a-zA-Z0-9_-]{4,80}$")
TYPES = {'brick', 'slide', 'pool', 'beer', 'tv', 'track', 'stairs', 'station', 'coaster', 'tunnel', 'exit', 'dig'}
SHAPES = {'straight', 'up', 'down', 'loop', 'left', 'right', 'upLeft', 'downLeft', 'upRight', 'downRight'}
MAX_MEDIA = 40 * 1024 * 1024


class APIError(Exception):
    def __init__(self, message, status=400):
        super().__init__(message)
        self.status = status


def text(value, limit):
    return str(value or '').strip()[:limit]


def clean_scene(value):
    if not isinstance(value, list) or len(value) > 150:
        raise APIError('地图最多包含150件物品')
    result, seen = [], set()
    for raw in value:
        if not isinstance(raw, dict) or not ID.fullmatch(str(raw.get('id', ''))) or raw.get('id') in seen or not isinstance(raw.get('type'), str) or raw.get('type') not in TYPES:
            raise APIError('地图物品无效')
        item = {'id': raw['id'], 'type': raw['type']}
        for key, low, high, default in [('x', -120, 120, 0), ('z', -120, 120, 0), ('y', -60, 80, 0), ('w', .2, 60, None), ('h', .2, 60, None), ('l', .2, 60, None), ('rotation', -1e9, 1e9, 0)]:
            number = raw.get(key, default)
            if not isinstance(number, (int, float)) or isinstance(number, bool) or not math.isfinite(number) or not low <= number <= high:
                raise APIError('地图尺寸或坐标无效')
            item[key] = number
        item['on'] = bool(raw.get('on', False))
        if raw['type'] in ('track', 'station', 'exit'):
            item['shape'] = raw.get('shape', 'straight')
            if not isinstance(item['shape'], str) or item['shape'] not in SHAPES:
                raise APIError('轨道形状无效')
            item['tunnel'] = bool(raw.get('tunnel', False))
        if raw['type'] == 'coaster':
            for key in ('trackId', 'trainId'):
                item[key] = text(raw.get(key), 64)
                if item[key] and not ID.fullmatch(item[key]):
                    raise APIError('列车编号无效')
            for key, low, high in [('slot', 0, 31), ('distance', 0, 50000), ('speed', 2, 25)]:
                number = raw.get(key, 9 if key == 'speed' else 0)
                if not isinstance(number, (int, float)) or not math.isfinite(number) or not low <= number <= high:
                    raise APIError('列车参数无效')
                item[key] = number
            item.update(running=False, startedAt=0)
        seen.add(raw['id'])
        result.append(item)
    return result


class CommunityStore:
    def __init__(self, directory):
        self.directory = Path(directory)
        self.directory.mkdir(mode=0o700, parents=True, exist_ok=True)
        self.uploads = self.directory / 'media'
        self.uploads.mkdir(exist_ok=True)
        self.database = self.directory / 'community.sqlite3'
        with self.connect() as db:
            db.executescript('''
                PRAGMA journal_mode=WAL;
                CREATE TABLE IF NOT EXISTS maps (id TEXT PRIMARY KEY, owner TEXT NOT NULL, name TEXT NOT NULL, author TEXT NOT NULL, scene TEXT NOT NULL, updated INTEGER NOT NULL);
                CREATE TABLE IF NOT EXISTS posts (id TEXT PRIMARY KEY, owner TEXT NOT NULL, author TEXT NOT NULL, title TEXT NOT NULL, text TEXT NOT NULL, category TEXT NOT NULL, media TEXT NOT NULL, map_id TEXT, created INTEGER NOT NULL, updated INTEGER NOT NULL, client_id TEXT NOT NULL, UNIQUE(owner,client_id));
                CREATE INDEX IF NOT EXISTS feed_order ON posts(updated DESC,id DESC);
                CREATE TABLE IF NOT EXISTS media (id TEXT PRIMARY KEY, owner TEXT NOT NULL, mime TEXT NOT NULL, size INTEGER NOT NULL);
            ''')
            if 'client_updated' not in {row['name'] for row in db.execute('PRAGMA table_info(maps)')}:
                db.execute('ALTER TABLE maps ADD COLUMN client_updated INTEGER NOT NULL DEFAULT 0')

    @contextmanager
    def connect(self):
        db = sqlite3.connect(self.database, timeout=15)
        db.row_factory = sqlite3.Row
        try:
            with db:
                yield db
        finally:
            db.close()

    def owner(self, key):
        if not re.fullmatch(r'[a-zA-Z0-9_-]{32,128}', key or ''):
            raise APIError('请刷新后重试，发布身份尚未准备好', 401)
        return hashlib.sha256(key.encode()).hexdigest()

    def save_map(self, owner, value):
        map_id = value.get('id', '')
        if not isinstance(map_id, str) or not ID.fullmatch(map_id):
            raise APIError('存档编号无效')
        scene = clean_scene(value.get('scene'))
        now = time.time_ns() // 1_000_000
        modified = value.get('modifiedAt', 0)
        if not isinstance(modified, (int, float)) or not math.isfinite(modified) or not 0 <= modified < 9e15:
            raise APIError('存档时间无效')
        name, author = text(value.get('name'), 40) or '我的自由创造', text(value.get('author'), 16) or '建造者'
        with self.connect() as db:
            db.execute('BEGIN IMMEDIATE')
            old = db.execute('SELECT owner,client_updated,name,scene,updated FROM maps WHERE id=?', (map_id,)).fetchone()
            if old and old['owner'] != owner:
                raise APIError('这个地图属于另一位玩家', 403)
            if old and old['client_updated'] and modified <= old['client_updated']:
                if old['name'] == name and json.loads(old['scene']) == scene:
                    return {'id': map_id, 'updatedAt': old['updated'], 'postId': 'map_' + map_id}
                raise APIError('另一个窗口已上传更新的地图，请刷新或另存当前作品', 409)
            db.execute('INSERT INTO maps(id,owner,name,author,scene,updated,client_updated) VALUES(?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,author=excluded.author,scene=excluded.scene,updated=excluded.updated,client_updated=excluded.client_updated', (map_id, owner, name, author, json.dumps(scene, ensure_ascii=False), now, modified))
            db.execute('INSERT INTO posts VALUES(?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(owner,client_id) DO UPDATE SET author=excluded.author,text=excluded.text,updated=excluded.updated', ('map_' + map_id, owner, author, '快来和我一起玩吧', name, '游戏', '[]', map_id, now, now, 'map_' + map_id))
        return {'id': map_id, 'updatedAt': now, 'postId': 'map_' + map_id}

    def post(self, owner, value):
        client_id = value.get('clientId', '')
        if not isinstance(client_id, str) or not ID.fullmatch(client_id):
            raise APIError('动态编号无效')
        title, body = text(value.get('title'), 60), text(value.get('text'), 2000)
        media = value.get('media', [])
        if not isinstance(media, list) or len(media) > 4 or any(not isinstance(i, str) or not ID.fullmatch(i) for i in media):
            raise APIError('一次最多发布4个附件')
        if not title and not body and not media:
            raise APIError('先写点内容，或添加图片、视频吧')
        author, category = text(value.get('author'), 16) or '玩家', value.get('category', '游戏')
        if category not in ('游戏', '生活', '随手发'):
            raise APIError('请选择有效分类')
        now, post_id = time.time_ns() // 1_000_000, 'post_' + secrets.token_hex(16)
        with self.connect() as db:
            for media_id in media:
                row = db.execute('SELECT owner FROM media WHERE id=?', (media_id,)).fetchone()
                if not row or row['owner'] != owner:
                    raise APIError('附件未上传完成')
            db.execute('INSERT OR IGNORE INTO posts VALUES(?,?,?,?,?,?,?,?,?,?,?)', (post_id, owner, author, title, body, category, json.dumps(media), None, now, now, client_id))
            row = db.execute('SELECT id FROM posts WHERE owner=? AND client_id=?', (owner, client_id)).fetchone()
        return {'id': row['id']}

    def feed(self, cursor=''):
        args, where = [], ''
        if cursor:
            try:
                stamp, post_id = cursor.split(':', 1)
                args = [int(stamp), int(stamp), post_id]
                where = 'WHERE (p.updated < ? OR (p.updated = ? AND p.id < ?))'
            except (ValueError, TypeError):
                raise APIError('分页位置无效')
        with self.connect() as db:
            rows = db.execute(f'SELECT p.*,m.name map_name,m.scene map_scene FROM posts p LEFT JOIN maps m ON m.id=p.map_id {where} ORDER BY p.updated DESC,p.id DESC LIMIT 31', args).fetchall()
            posts = []
            for row in rows[:30]:
                attachments = []
                for media_id in json.loads(row['media']):
                    media = db.execute('SELECT id,mime FROM media WHERE id=?', (media_id,)).fetchone()
                    if media:
                        attachments.append({'id': media['id'], 'url': '/api/community/media/' + media['id'], 'kind': 'video' if media['mime'].startswith('video/') else 'image'})
                posts.append({'id': row['id'], 'author': row['author'], 'title': row['title'], 'text': row['text'], 'category': row['category'], 'createdAt': row['created'], 'updatedAt': row['updated'], 'media': attachments, 'map': {'id': row['map_id'], 'name': row['map_name'], 'count': len(json.loads(row['map_scene']))} if row['map_id'] else None})
        return {'posts': posts, 'next': str(rows[29]['updated']) + ':' + rows[29]['id'] if len(rows) > 30 else ''}

    def map(self, map_id):
        with self.connect() as db:
            row = db.execute('SELECT * FROM maps WHERE id=?', (map_id,)).fetchone()
        if not row:
            raise APIError('没有找到这个地图', 404)
        return {'id': row['id'], 'name': row['name'], 'author': row['author'], 'scene': json.loads(row['scene']), 'updatedAt': row['updated']}

    def my_maps(self, owner):
        with self.connect() as db:
            rows = db.execute('SELECT id,name,author,updated FROM maps WHERE owner=? ORDER BY updated DESC', (owner,)).fetchall()
        return {'maps': [dict(row) for row in rows]}

    def upload(self, owner, mime, data):
        mime = mime.split(';')[0]
        valid = {
            'image/png': data.startswith(b'\x89PNG\r\n\x1a\n'),
            'image/jpeg': data.startswith(b'\xff\xd8\xff'),
            'image/gif': data.startswith((b'GIF87a', b'GIF89a')),
            'image/webp': data[:4] == b'RIFF' and data[8:12] == b'WEBP',
            'video/mp4': data[4:8] == b'ftyp',
            'video/quicktime': data[4:8] == b'ftyp',
            'video/webm': data.startswith(b'\x1aE\xdf\xa3'),
        }
        if not valid.get(mime):
            raise APIError('支持 PNG、JPG、GIF、WebP 图片和 MP4、WebM、MOV 视频')
        if not 0 < len(data) <= MAX_MEDIA:
            raise APIError('每个附件不能超过40MB', 413)
        media_id = 'media_' + secrets.token_hex(16)
        (self.uploads / media_id).write_bytes(data)
        with self.connect() as db:
            db.execute('INSERT INTO media VALUES(?,?,?,?)', (media_id, owner, mime, len(data)))
        return {'id': media_id, 'url': '/api/community/media/' + media_id, 'kind': 'video' if mime.startswith('video/') else 'image'}

    def media(self, media_id):
        with self.connect() as db:
            row = db.execute('SELECT mime,size FROM media WHERE id=?', (media_id,)).fetchone()
        if not row or not ID.fullmatch(media_id):
            raise APIError('附件不存在', 404)
        return self.uploads / media_id, row['mime'], row['size']


_store = None
_init_lock = threading.Lock()


def handle(handler):
    """Return True for API routes, otherwise allow the static server to continue."""
    global _store
    path = urlsplit(handler.path).path
    if not path.startswith('/api/community/'):
        return False
    try:
        with _init_lock:
            if _store is None:
                _store = CommunityStore(os.environ.get('GAME_COMMUNITY_DATA', Path(__file__).parent / '.game-community-data'))
        method = handler.command
        if method in ('GET', 'HEAD') and path.startswith('/api/community/media/'):
            file, mime, size = _store.media(path.rsplit('/', 1)[-1])
            start, end, status = 0, size - 1, 200
            request_range = handler.headers.get('Range')
            if request_range:
                match = re.fullmatch(r'bytes=(\d*)-(\d*)', request_range)
                if not match or not any(match.groups()):
                    raise APIError('无效的播放范围', 416)
                if match[1]:
                    start = int(match[1]); end = min(end, int(match[2])) if match[2] else end
                else:
                    start = max(0, size - int(match[2]))
                if start > end or start >= size:
                    raise APIError('播放范围超出文件', 416)
                status = 206
            handler.send_response(status)
            handler.send_header('Content-Type', mime)
            handler.send_header('X-Content-Type-Options', 'nosniff')
            handler.send_header('Accept-Ranges', 'bytes')
            handler.send_header('Content-Length', str(end - start + 1))
            if status == 206:
                handler.send_header('Content-Range', f'bytes {start}-{end}/{size}')
            handler.end_headers()
            if method != 'HEAD':
                with file.open('rb') as stream:
                    stream.seek(start)
                    remaining = end - start + 1
                    while remaining:
                        chunk = stream.read(min(65536, remaining))
                        if not chunk:
                            break
                        handler.wfile.write(chunk); remaining -= len(chunk)
            return True
        if method == 'GET':
            query = parse_qs(urlsplit(handler.path).query)
            if path == '/api/community/feed':
                value = _store.feed(query.get('before', [''])[0])
            elif path == '/api/community/my-maps':
                value = _store.my_maps(_store.owner(handler.headers.get('X-Community-Key')))
            elif path.startswith('/api/community/maps/'):
                value = _store.map(path.rsplit('/', 1)[-1])
            else:
                raise APIError('接口不存在', 404)
        elif method == 'POST':
            origin = handler.headers.get('Origin')
            if origin and urlsplit(origin).netloc != handler.headers.get('Host'):
                raise APIError('请在游戏页面内发布', 403)
            owner = _store.owner(handler.headers.get('X-Community-Key'))
            limit = MAX_MEDIA if path == '/api/community/media' else 256 * 1024
            try:
                length = int(handler.headers.get('Content-Length', '0'))
            except ValueError:
                raise APIError('请求长度无效')
            if not 0 < length <= limit:
                raise APIError('附件过大或请求为空', 413)
            data = handler.rfile.read(length)
            if path == '/api/community/media':
                value = _store.upload(owner, handler.headers.get('Content-Type', ''), data)
            else:
                try:
                    body = json.loads(data, parse_constant=lambda _: None)
                except (ValueError, UnicodeDecodeError):
                    raise APIError('发布内容格式无效')
                if not isinstance(body, dict):
                    raise APIError('发布内容格式无效')
                if path == '/api/community/maps':
                    value = _store.save_map(owner, body)
                elif path == '/api/community/posts':
                    value = _store.post(owner, body)
                else:
                    raise APIError('接口不存在', 404)
        else:
            raise APIError('不支持的操作', 405)
        status = 200
    except APIError as error:
        value, status = {'error': str(error)}, error.status
    except (TypeError, ValueError, OverflowError):
        value, status = {'error': '请求内容无效，请检查后重试'}, 400
    except (OSError, sqlite3.Error):
        value, status = {'error': '游戏圈暂时无法保存，请稍后重试'}, 503
    body = json.dumps(value, ensure_ascii=False).encode()
    handler.send_response(status)
    handler.send_header('Content-Type', 'application/json; charset=utf-8')
    handler.send_header('Content-Length', str(len(body)))
    handler.end_headers()
    if handler.command != 'HEAD':
        handler.wfile.write(body)
    return True
