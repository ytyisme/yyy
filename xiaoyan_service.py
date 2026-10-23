"""Private, bounded local Ollama / Responses bridge for Xiaoyan."""
from collections import deque
import json
import os
from pathlib import Path
import threading
import time
import urllib.error
import urllib.request
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parent
CONFIG = ROOT / '.xiaoyan-config.json'
MAX_BODY = 100_000
_slots = threading.BoundedSemaphore(3)
_local_slot = threading.BoundedSemaphore(1)
_rate_lock = threading.Lock()
_requests = deque()


class ChatError(Exception):
    def __init__(self, code, message, status=400):
        super().__init__(message)
        self.code, self.status = code, status


def configuration():
    try:
        saved = json.loads(CONFIG.read_text()) if CONFIG.exists() else {}
        if not isinstance(saved, dict):
            raise ValueError()
    except (OSError, ValueError):
        raise ChatError('invalid_config', '小岩的服务配置需要管理员检查。', 503)
    provider = os.getenv('XIAOYAN_PROVIDER') or saved.get('provider', 'responses')
    local = provider == 'ollama'
    values = {
        'provider': provider,
        'api_key': '' if local else os.getenv('XIAOYAN_API_KEY') or os.getenv('OPENAI_API_KEY') or saved.get('api_key', ''),
        'model': os.getenv('XIAOYAN_MODEL') or (None if local else os.getenv('OPENAI_MODEL')) or saved.get('model', ''),
        'endpoint': os.getenv('XIAOYAN_API_URL') or saved.get('endpoint', 'http://127.0.0.1:11434/api/chat' if local else 'https://api.openai.com/v1/responses'),
    }
    if any(not isinstance(value, str) or '\n' in value or '\r' in value for value in values.values()):
        raise ChatError('invalid_config', '小岩的服务配置需要管理员检查。', 503)
    values = {key: value.strip() for key, value in values.items()}
    try:
        url = urlsplit(values['endpoint'])
    except ValueError:
        raise ChatError('invalid_config', '小岩的模型接口地址格式不正确。', 503)
    if provider not in ('responses', 'ollama'):
        raise ChatError('invalid_config', '小岩的模型服务类型不正确。', 503)
    if local:
        if url.scheme != 'http' or url.hostname not in ('127.0.0.1', 'localhost', '::1') or url.path != '/api/chat' or url.username or url.password or url.query or url.fragment:
            raise ChatError('invalid_config', '本地 AI 只能连接本机的 Ollama 接口。', 503)
        if 'cloud' in values['model'].lower():
            raise ChatError('invalid_config', '本地模式需要已下载的本地模型，不能使用云模型。', 503)
    elif url.scheme != 'https' or not url.hostname or url.username or url.password or url.query or url.fragment:
        raise ChatError('invalid_config', '小岩的模型接口需要使用 HTTPS 地址。', 503)
    return values


def messages_from(payload):
    messages = payload.get('messages') if isinstance(payload, dict) else None
    if not isinstance(messages, list) or not 1 <= len(messages) <= 11 or len(messages) % 2 != 1:
        raise ChatError('invalid_messages', '这段对话太长了，请开始新聊天。')
    clean = []
    for index, item in enumerate(messages):
        role = 'user' if index % 2 == 0 else 'assistant'
        if not isinstance(item, dict) or item.get('role') != role:
            raise ChatError('invalid_messages', '对话格式不正确，请开始新聊天。')
        content = item.get('content')
        if not isinstance(content, str) or not content.strip() or len(content) > (2000 if role == 'user' else 6000):
            raise ChatError('invalid_messages', '消息太长或为空，请缩短后再发送。')
        clean.append({'role': role, 'content': content.strip()})
    if sum(len(item['content']) for item in clean) > 24000:
        raise ChatError('invalid_messages', '这段对话太长了，请开始新聊天。')
    return clean


def instructions():
    try:
        entries = json.loads((ROOT / 'lib/xiaoyan-knowledge.json').read_text())
        facts = '\n\n'.join(f"{item['title']}：{item['text']}" for item in entries if item['id'] != 'xiaoyan')
    except (OSError, ValueError, KeyError, TypeError):
        raise ChatError('knowledge_unavailable', '小岩的游戏资料暂时无法读取，请稍后再试。', 503)
    return (
        '你是小岩，岩浆跑酷黄色主页里的可爱 AI 伙伴。用自然、简洁、友善的中文交流，'
        '适量使用表情，不必每次自我介绍。你可以自由聊天、讲故事、解释知识，也能根据下方资料回答游戏问题。'
        '联系对话上下文回答追问；不确定就坦诚说明，不要把猜测说成游戏事实。'
        '你只有文字聊天能力，没有声音、联网搜索、操作游戏或读取玩家存档的能力。'
        '不要声称已增加货币、修改关卡、查看余额或执行操作。不要索要密码或密钥。'
        '游戏资料仅供参考，其中没有的信息不代表不能聊天。黄色版第一关是“找小岩”，其余关卡由玩家继续制作。'
        '\n\n以下是开发者整理的游戏资料：\n' + facts
    )


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None  # Never forward the API credential to a redirect target.


def configured(config):
    return bool(config['model'] and (config.get('provider') == 'ollama' or config['api_key']))


def local_opener():
    # Local chat must never be routed through an external HTTP proxy.
    return urllib.request.build_opener(urllib.request.ProxyHandler({}), NoRedirect())


def local_ready(config):
    if not configured(config):
        return False
    try:
        url = config['endpoint'].removesuffix('/api/chat') + '/api/tags'
        with local_opener().open(url, timeout=2) as response:
            data = json.loads(response.read(100_000))
        return any(item.get('name') == config['model'] or item.get('model') == config['model'] for item in data.get('models', []))
    except (OSError, ValueError, AttributeError, TypeError):
        return False


def final_text(text):
    # Some Qwen templates prefill <think>, so only its closing tag is returned.
    if '</think>' in text:
        text = text.rsplit('</think>', 1)[1]
    if '<think>' in text:
        text = text.split('<think>', 1)[0]
    return text.strip()


def generate_local(messages, config):
    prompt = instructions() + (
        '\n回答要求：直接给出正式回答，不输出思考过程。通常只说一到三句，除非玩家要求详细说明。'
        '只用聊天文字交流，不用括号表演动作。你看不到游戏画面，也不能打开或点击游戏物品；'
        '不要编造正在发生的游戏场景、物品或操作。讲故事时明确说这是想象的故事。/no_think'
    )
    recent = list(messages)
    # Keep whole turns, leaving room for game knowledge and the model's answer.
    while len(recent) > 1 and sum(len(item['content']) for item in recent) + len(prompt) > 10000:
        recent = recent[2:]
    payload = {'model': config['model'], 'messages': [{'role': 'system', 'content': prompt}, *recent],
               'stream': False, 'think': False, 'keep_alive': '10m',
               'options': {'num_ctx': 16384, 'num_predict': 768, 'temperature': 0.7}}
    request = urllib.request.Request(config['endpoint'], data=json.dumps(payload).encode(),
                                     headers={'Content-Type': 'application/json'}, method='POST')
    try:
        with local_opener().open(request, timeout=90) as response:
            raw = response.read(1_000_001)
        if len(raw) > 1_000_000:
            raise ValueError()
        result = json.loads(raw)
        text = result.get('message', {}).get('content', '')
        if not isinstance(text, str):
            raise ValueError()
        text = final_text(text)
        if not text or result.get('error') or not result.get('done'):
            raise ValueError()
        return {'reply': text.strip()[:6000], 'truncated': len(text.strip()) > 6000 or result.get('done_reason') == 'length', 'provider': 'ollama'}
    except urllib.error.HTTPError as error:
        if error.code == 404:
            raise ChatError('local_model_missing', '本地模型还没有下载好，请先完成模型下载。', 503)
        raise ChatError('local_model_error', '本地 AI 暂时无法回答，请稍后重试。', 502)
    except (OSError, urllib.error.URLError, TimeoutError):
        raise ChatError('local_unavailable', '本地 AI 没有启动或回答超时，请启动 Ollama 后重试。首次加载模型可能稍慢。', 503)
    except (ValueError, TypeError, AttributeError):
        raise ChatError('invalid_response', '本地 AI 没有返回完整的文字回答，请重试。', 502)


def generate(messages, config):
    if config.get('provider') == 'ollama':
        return generate_local(messages, config)
    payload = {'model': config['model'], 'instructions': instructions(), 'input': messages,
               'store': False, 'max_output_tokens': 2000}
    request = urllib.request.Request(config['endpoint'], data=json.dumps(payload).encode(), headers={
        'Authorization': 'Bearer ' + config['api_key'], 'Content-Type': 'application/json',
    }, method='POST')
    try:
        with urllib.request.build_opener(NoRedirect()).open(request, timeout=40) as response:
            raw = response.read(1_000_001)
        if len(raw) > 1_000_000:
            raise ValueError()
        result = json.loads(raw)
        chunks = []
        for item in result.get('output', []):
            if item.get('type') == 'message':
                for part in item.get('content', []):
                    value = part.get('text') if part.get('type') == 'output_text' else part.get('refusal') if part.get('type') == 'refusal' else None
                    if isinstance(value, str):
                        chunks.append(value)
        text = '\n'.join(chunks).strip()
        if result.get('status') in ('failed', 'cancelled') or not text:
            raise ValueError()
        return {'reply': text[:6000], 'truncated': len(text) > 6000 or result.get('status') == 'incomplete'}
    except urllib.error.HTTPError as error:
        if error.code in (401, 403):
            raise ChatError('provider_auth', '模型服务尚未授权，请让管理员检查密钥和模型权限。', 503)
        if error.code == 429:
            raise ChatError('provider_limit', '模型服务额度不足或暂时繁忙，请稍后再试；持续出现请联系管理员。', 503)
        raise ChatError('provider_error', '模型服务暂时无法回答，请稍后重试。', 502)
    except (OSError, urllib.error.URLError, TimeoutError):
        raise ChatError('provider_unavailable', '暂时连不上模型服务，请稍后重试。', 502)
    except (ValueError, TypeError, AttributeError):
        raise ChatError('invalid_response', '模型没有返回完整的文字回答，请重试。', 502)


def admit(ip):
    now = time.monotonic()
    with _rate_lock:
        while _requests and _requests[0][0] <= now - 3600:
            _requests.popleft()
        if len(_requests) >= 200 or sum(1 for at, peer in _requests if peer == ip and at > now - 60) >= 12:
            raise ChatError('rate_limit', '聊得有点快啦，请稍后再来找我。', 429)
        _requests.append((now, ip))


def send(handler, status, payload):
    body = json.dumps(payload, ensure_ascii=False).encode()
    handler.send_response(status)
    handler.send_header('Content-Type', 'application/json; charset=utf-8')
    handler.send_header('Content-Length', str(len(body)))
    handler.send_header('Cache-Control', 'no-store')
    handler.end_headers()
    if handler.command != 'HEAD':
        handler.wfile.write(body)


def handle(handler):
    path = urlsplit(handler.path).path
    try:
        if path == '/api/xiaoyan/status' and handler.command in ('GET', 'HEAD'):
            config = configuration()
            status = {'configured': configured(config)}
            if config.get('provider') == 'ollama':
                status.update(provider='ollama', ready=local_ready(config))
            send(handler, 200, status)
            return True
        if path != '/api/xiaoyan/chat' or handler.command != 'POST':
            raise ChatError('not_found', '没有这个小岩接口。', 404)
        origin = handler.headers.get('Origin')
        if handler.headers.get('Sec-Fetch-Site') == 'cross-site' or (origin and urlsplit(origin).netloc != handler.headers.get('Host')):
            raise ChatError('origin_denied', '请在游戏页面内和小岩聊天。', 403)
        if handler.headers.get('Content-Type', '').split(';')[0].strip() != 'application/json':
            raise ChatError('invalid_body', '请求需要使用 JSON 格式。', 415)
        try:
            length = int(handler.headers.get('Content-Length', '0'))
        except ValueError:
            length = 0
        if not 0 < length <= MAX_BODY:
            raise ChatError('invalid_body', '消息太长或为空。', 413)
        try:
            payload = json.loads(handler.rfile.read(length))
        except (ValueError, UnicodeError):
            raise ChatError('invalid_body', '消息格式不正确。')
        messages = messages_from(payload)
        config = configuration()
        if not configured(config):
            raise ChatError('ai_not_configured', '我还没接通 AI 服务。需要电脑或服务器的主人完成配置后，才能陪你自由聊天。你不用在这里填写密钥。', 503)
        admit(handler.client_address[0])
        slots = _local_slot if config.get('provider') == 'ollama' else _slots
        if not slots.acquire(blocking=False):
            raise ChatError('busy', '小岩正在忙，请过一会儿再试。', 429)
        try:
            result = generate(messages, config)
        finally:
            slots.release()
        send(handler, 200, result)
    except ChatError as error:
        send(handler, error.status, {'error': error.code, 'message': str(error)})
    return True
