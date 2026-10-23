"""Run on the game server as its owner. Credentials are never printed."""
import getpass
import json
import os
from pathlib import Path
from urllib.parse import urlsplit

root = Path(__file__).resolve().parents[1]
target = root / '.xiaoyan-config.json'
print('配置小岩的模型服务（仅服务器保存密钥，不写入网页）。')
endpoint = input('Responses API 完整 HTTPS 地址 [https://api.openai.com/v1/responses]：').strip() or 'https://api.openai.com/v1/responses'
url = urlsplit(endpoint)
if url.scheme != 'https' or not url.hostname or url.username or url.password or url.query or url.fragment:
    raise SystemExit('地址无效，未保存。')
model = input('你有权限使用的模型 ID：').strip()
key = getpass.getpass('API 密钥（输入不会显示）：').strip()
if not model or not key or any(c in key + model for c in '\r\n'):
    raise SystemExit('模型和密钥不能为空，未保存。')
if target.exists() and input('已有私有配置。替换？输入 yes：').strip() != 'yes':
    raise SystemExit('未修改。')
fd = os.open(target, os.O_WRONLY | os.O_CREAT | os.O_TRUNC | os.O_NOFOLLOW, 0o600)
with os.fdopen(fd, 'w') as file:
    os.fchmod(file.fileno(), 0o600)
    json.dump({'endpoint': endpoint, 'model': model, 'api_key': key}, file)
print('已保存私有配置。运行新版 server.py 后，回游戏重新打开小岩即可；是否连通以实际回答为准。')
