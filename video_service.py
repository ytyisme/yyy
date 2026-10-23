"""Same-origin public video metadata and range streaming for the video room.

No account cookies, paid videos, challenge solvers or third-party parsers are
used. Providers that don't supply a public media URL need an original file.
"""
import html
import json
import re
import secrets
import threading
import time
import urllib.error
import urllib.parse
import urllib.request

API = 'https://api.bilibili.com'
REFERER = 'https://www.bilibili.com/'
HEADERS = {'User-Agent': 'Mozilla/5.0', 'Referer': REFERER}
_cache = {}
_streams = {}
_lock = threading.Lock()


class VideoError(Exception):
    def __init__(self, message, status=502):
        super().__init__(message)
        self.status = status


def plain(value, limit=200):
    return html.unescape(re.sub(r'<[^>]*>', '', str(value or '')))[:limit]


def valid_id(value):
    return isinstance(value, str) and bool(re.fullmatch(
        r'BV1[0-9A-Za-z]{9}|av[1-9][0-9]{0,17}|dy:[0-9]{15,22}|ks:[0-9A-Za-z_-]{8,40}', value))


def public_json(url):
    try:
        request = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(request, timeout=12) as response:
            body = response.read(3 * 1024 * 1024 + 1)
        if len(body) > 3 * 1024 * 1024:
            raise VideoError('返回的数据太大，请换个关键词。')
        result = json.loads(body)
    except (OSError, ValueError, urllib.error.URLError):
        raise VideoError('视频服务暂时无法连接，请稍后重试。')
    if result.get('code', 0) != 0:
        raise VideoError('来源暂未提供这项公开数据，请稍后重试。')
    return result.get('data') or {}


def cached(key, loader, ttl=180):
    with _lock:
        entry = _cache.get(key)
        if entry and entry[0] > time.monotonic():
            return entry[1]
    result = loader()
    with _lock:
        if len(_cache) >= 200:
            _cache.clear()
        _cache[key] = (time.monotonic() + ttl, result)
    return result


def search_creators(query, page=1):
    query = str(query).strip()[:100]
    if not query:
        raise VideoError('请输入创作者的名字。', 400)
    page = max(1, min(int(page), 20))
    def load():
        # This is a normal public homepage visit, not a fabricated fingerprint
        # or login cookie. Some public API hosts require a preceding visit.
        try:
            with urllib.request.urlopen(urllib.request.Request(REFERER, headers=HEADERS), timeout=5) as response:
                response.read(64)
        except OSError:
            pass
        data = public_json(API + '/x/web-interface/search/type?' + urllib.parse.urlencode({
            'search_type': 'bili_user', 'keyword': query, 'page': page}))
        creators = []
        for row in data.get('result') or []:
            uid = str(row.get('mid', ''))
            if not uid.isdigit():
                continue
            creators.append({'id': 'bili:' + uid, 'uid': uid, 'name': plain(row.get('uname'), 80),
                'description': plain(row.get('usign')), 'videoCount': max(0, int(row.get('videos') or 0)),
                'fans': max(0, int(row.get('fans') or 0))})
        return {'creators': creators, 'page': page, 'hasMore': page < min(int(data.get('numPages') or 1), 20)}
    return cached(('creators', query, page), load)


def creator_videos(uid, name, page=1):
    if not re.fullmatch(r'[1-9][0-9]{0,18}', str(uid)):
        raise VideoError('创作者编号无效。', 400)
    name = str(name).strip()[:100]
    if not name:
        raise VideoError('缺少创作者名字。', 400)
    page = max(1, min(int(page), 20))
    def load():
        data = public_json(API + '/x/space/arc/search?' + urllib.parse.urlencode({
            'mid': str(uid), 'ps': 20, 'pn': page}))
        if data.get('is_risk'):
            raise VideoError('来源暂未开放这位创作者的公开作品，请稍后重试。')
        videos = []
        for row in (data.get('list') or {}).get('vlist') or []:
            if str(row.get('mid', uid)) != str(uid) or not valid_id(row.get('bvid')):
                continue
            duration = str(row.get('length') or row.get('duration') or '0:00').split(':')
            seconds = 0
            for part in duration:
                seconds = seconds * 60 + (int(part) if part.isdigit() else 0)
            videos.append({'id': row['bvid'], 'title': plain(row.get('title'), 200), 'author': plain(row.get('author'), 80),
                'creatorId': 'bili:' + str(uid), 'category': 'custom', 'duration': seconds, 'parts': []})
        return {'videos': videos, 'page': page, 'hasMore': page < 20 and page * 20 < int((data.get('page') or {}).get('count') or 0)}
    return cached(('works', str(uid), name, page), load)


def trusted_stream(url):
    try:
        parsed = urllib.parse.urlsplit(url)
        host = parsed.hostname or ''
        return parsed.scheme == 'https' and not parsed.username and not parsed.password and parsed.port in (None, 443) and (
            host.endswith('.bilivideo.com') or host.endswith('.bilivideo.cn'))
    except ValueError:
        return False


def playback(video_id, page=1):
    if not valid_id(video_id):
        raise VideoError('视频编号无效。', 400)
    if video_id.startswith(('dy:', 'ks:')):
        raise VideoError('这条短视频需要提供无水印原片。点击「添加原片」后可在这里播放。', 422)
    page = max(1, min(int(page), 1000))
    def load():
        params = {'bvid': video_id} if video_id.startswith('BV') else {'aid': video_id[2:]}
        metadata = public_json(API + '/x/web-interface/view?' + urllib.parse.urlencode(params))
        if metadata.get('rights', {}).get('pay') or metadata.get('is_upower_exclusive'):
            raise VideoError('这条视频需要在来源账号授权后观看。', 403)
        parts = metadata.get('pages') or []
        if not 1 <= page <= len(parts):
            raise VideoError('没有找到这个分集。', 404)
        part = parts[page - 1]
        params.update({'cid': part['cid'], 'qn': 16, 'platform': 'html5', 'high_quality': 0})
        data = public_json(API + '/x/player/playurl?' + urllib.parse.urlencode(params))
        streams = data.get('durl') or []
        if len(streams) != 1 or not trusted_stream(streams[0].get('url')):
            raise VideoError('暂时没有可直接播放的公开原片，请添加视频文件。', 422)
        token = secrets.token_urlsafe(24)
        with _lock:
            now = time.monotonic()
            for key in list(_streams):
                if _streams[key][0] <= now:
                    del _streams[key]
            if len(_streams) >= 200:
                del _streams[next(iter(_streams))]
            _streams[token] = (now + 4 * 3600, streams[0]['url'])
        return {'src': '/api/video/stream/' + token, 'title': plain(metadata.get('title'), 200),
            'author': plain(metadata.get('owner', {}).get('name'), 80),
            'parts': [{'title': plain(p.get('part'), 200), 'duration': p.get('duration', 0)} for p in parts],
            'page': page}
    return cached(('play', video_id, page), load, 120)


class StreamRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        if not trusted_stream(newurl):
            raise VideoError('视频地址暂不可用。')
        return super().redirect_request(req, fp, code, msg, headers, newurl)


def stream(handler, token):
    with _lock:
        entry = _streams.get(token)
    if not entry or entry[0] <= time.monotonic():
        raise VideoError('播放连接已过期，请重新加载。', 410)
    url = entry[1]
    if not trusted_stream(url):
        raise VideoError('视频地址无效。', 400)
    headers = dict(HEADERS)
    byte_range = handler.headers.get('Range')
    if byte_range:
        if not re.fullmatch(r'bytes=(?:[0-9]{1,16}-[0-9]{0,16}|-[0-9]{1,16})', byte_range):
            raise VideoError('播放范围无效。', 416)
        headers['Range'] = byte_range
    request = urllib.request.Request(url, headers=headers, method=handler.command)
    opener = urllib.request.build_opener(StreamRedirect())
    try:
        response = opener.open(request, timeout=18)
    except (OSError, urllib.error.URLError):
        raise VideoError('视频连接中断，请重新加载。')
    with response:
        handler.send_response(response.status)
        for name in ('Content-Type', 'Content-Length', 'Content-Range', 'Accept-Ranges'):
            if response.headers.get(name):
                handler.send_header(name, response.headers[name])
        handler.send_header('X-Content-Type-Options', 'nosniff')
        handler.end_headers()
        if handler.command != 'HEAD':
            try:
                while True:
                    chunk = response.read(64 * 1024)
                    if not chunk:
                        break
                    handler.wfile.write(chunk)
            except (BrokenPipeError, ConnectionResetError, TimeoutError):
                pass


def handle(handler):
    parsed = urllib.parse.urlsplit(handler.path)
    if not parsed.path.startswith('/api/video/'):
        return False
    status = 200
    try:
        if handler.command not in ('GET', 'HEAD'):
            raise VideoError('请使用读取请求。', 405)
        query = urllib.parse.parse_qs(parsed.query)
        get = lambda key, default='': (query.get(key) or [default])[0]
        page = int(get('page', '1'))
        if parsed.path == '/api/video/creators':
            result = search_creators(get('q'), page)
        elif parsed.path == '/api/video/works':
            result = creator_videos(get('uid'), get('name'), page)
        elif parsed.path == '/api/video/play':
            result = playback(get('id'), page)
        elif re.fullmatch(r'/api/video/stream/[A-Za-z0-9_-]{32}', parsed.path):
            stream(handler, parsed.path.rsplit('/', 1)[-1])
            return True
        else:
            raise VideoError('没有找到这个视频功能。', 404)
    except VideoError as error:
        status, result = error.status, {'error': str(error)}
    except (ValueError, TypeError, KeyError):
        status, result = 400, {'error': '搜索或播放参数无效。'}
    body = json.dumps(result, ensure_ascii=False).encode('utf-8')
    handler.send_response(status)
    handler.send_header('Content-Type', 'application/json; charset=utf-8')
    handler.send_header('Content-Length', str(len(body)))
    handler.send_header('X-Content-Type-Options', 'nosniff')
    handler.end_headers()
    if handler.command != 'HEAD':
        handler.wfile.write(body)
    return True
