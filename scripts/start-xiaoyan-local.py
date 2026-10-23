"""Start the project's local-only Ollama runtime without a login or API key."""
import json
import os
from pathlib import Path
import subprocess
import time
import urllib.request

root = Path(__file__).resolve().parents[1]
runtime = root / '.local-ai/runtime/ollama'
opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))


def models():
    try:
        with opener.open('http://127.0.0.1:11434/api/tags', timeout=2) as response:
            return json.load(response).get('models', [])
    except (OSError, ValueError):
        return None


if models() is None:
    if not runtime.is_file():
        raise SystemExit('还没有安装本地 AI 程序，请先按 XIAOYAN_SETUP.md 安装 Ollama。')
    env = dict(os.environ, OLLAMA_HOST='127.0.0.1:11434', OLLAMA_MODELS=str(root / '.local-ai/models'),
               OLLAMA_NO_CLOUD='1', OLLAMA_NUM_PARALLEL='1', OLLAMA_MAX_LOADED_MODELS='1')
    with (root / '.local-ai/ollama.log').open('ab') as log:
        process = subprocess.Popen([str(runtime), 'serve'], cwd=root, env=env, stdin=subprocess.DEVNULL,
                                   stdout=log, stderr=log, start_new_session=True)
    for _ in range(30):
        if models() is not None:
            break
        if process.poll() is not None:
            raise SystemExit('本地 AI 启动失败，请检查 .local-ai/ollama.log。')
        time.sleep(.5)

available = models()
if available is None:
    raise SystemExit('本地 AI 还没启动好，请稍后再试。')
if not any(item.get('name') == 'qwen3:4b' for item in available):
    raise SystemExit('本地服务已启动，但模型未下载。请运行 .local-ai/runtime/ollama pull qwen3:4b。')
if not any(item.get('name') == 'xiaoyan-local:latest' for item in available):
    subprocess.run([str(runtime), 'create', 'xiaoyan-local', '-f', str(root / 'scripts/xiaoyan.Modelfile')], check=True)
print('小岩本地 AI 已就绪，无需密钥。打开游戏，点击“和小岩聊聊”即可。')
