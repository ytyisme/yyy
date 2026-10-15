"""Copy only runtime assets into the native application; never bundle credentials."""
from pathlib import Path
import json
import re
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'ios/LavaCity/Resources/Web'
ALLOWED = {'.html', '.js', '.mjs', '.css', '.webmanifest', '.json', '.png', '.jpg', '.jpeg', '.svg', '.wav', '.m4a', '.mp3', '.ogg', '.mp4', '.txt'}


def prepare():
    runtime = [p for p in ROOT.iterdir() if p.suffix in {'.html', '.js', '.css', '.webmanifest'} and p.name != 'game-qr.html']
    for directory in ['lib', 'levels', 'audio', 'assets', 'app-icons']:
        runtime.extend(p for p in (ROOT / directory).rglob('*') if p.is_file() and p.suffix in ALLOWED)
    runtime.extend(ROOT / 'phone-login' / name for name in ['index.html', 'login.css', 'login.js', 'demo-session.js'])
    if DEST.exists():
        shutil.rmtree(DEST)
    DEST.mkdir(parents=True)
    for source in runtime:
        relative = source.relative_to(ROOT)
        target = DEST / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        published = ROOT / 'sites/lava-game/dist' / relative
        # Reuse the smaller published media when available, keeping source recordings intact.
        if source.suffix == '.m4a' and source.stat().st_size > 25 * 1024 * 1024 and published.exists():
            shutil.copy2(published, target)
        else:
            shutil.copy2(source, target)
        if target.suffix == '.html':
            text = target.read_text()
            text = re.sub(r'\s*<link[^>]*href="https://fonts\.(?:googleapis|gstatic)\.com[^>]*>', '', text)
            target.write_text(text)
    # App Store applications are already installed and carry their offline assets.
    (DEST / 'pwa.js').write_text("window.addEventListener('DOMContentLoaded',()=>{document.querySelectorAll('[data-install-app],.app-how').forEach(e=>e.remove());const s=document.getElementById('app-status');if(s)s.textContent='游戏已安装 · 选择关卡开始';});\n")
    home = (DEST / 'app.html').read_text().replace('把游戏放到主屏幕，下次点图标就能继续。', '两季关卡和自由城市，点选下面的玩法开始。').replace('进度保存在当前设备 · 联机和影音内容需要网络', '进度保存在当前设备 · 在线联机和网络电影需要网络')
    (DEST / 'app.html').write_text(home)
    login = DEST / 'phone-login/login.js'
    login.write_text(login.read_text().replace("if(location.protocol!=='file:'){", "if(location.protocol!=='file:'&&!window.GAME_NATIVE_APP){"))
    page = DEST / 'phone-login/index.html'
    page.write_text(page.read_text().replace('输入 11 位手机号', '可用虚拟号码，如 13800000000').replace('演示模式 · 不发送短信', '演示模式 · 可用虚拟号码 · 不发送短信').replace('</form>', '</form><p><a class="phone-guest" href="../app.html">不填手机号，游客试玩 →</a></p><script src="../native-guest.js"></script>'))
    (DEST / 'native-guest.js').write_text("document.querySelector('.phone-guest').addEventListener('click',()=>{localStorage.setItem('lava-demo-phone-session',JSON.stringify({displayName:'玩家0000',maskedPhone:'游客',expires:Date.now()+604800000}));});\n")
    (DEST / 'native-privacy.html').write_text('''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>隐私说明</title><style>body{font:17px/1.8 system-ui;background:#fffaf0;color:#264f53;max-width:700px;margin:36px auto;padding:24px}a{color:inherit}</style><a href="app.html">← 返回游戏</a><h1>隐私说明</h1><p>本应用的游戏进度、玩家名和设置保存在当前设备。演示登录不发送短信，不验证真实身份，可以使用虚拟号码或直接游客试玩。演示码只在当前页面临时保留，登录后只保留显示名、遮挡的号码和到期时间。</p><p>单人关卡和自由城市使用应用内置文件。在线联机功能会把玩家昵称、游戏状态和你主动发送的聊天内容传给联机服务与其他玩家。网络电影由哔哩哔哩提供，播放时该服务会收到网络请求，并适用其隐私政策。退出网络内容后，仍可继续本地游戏。</p><p>本应用未加入广告或付费功能，也没有用于跟踪用户的分析 SDK。卸载应用会删除设备上的应用数据。</p><p><a href="https://www.bilibili.com/blackboard/privacy-pc.html">查看哔哩哔哩隐私政策</a></p></html>''')
    icons = ROOT / 'ios/LavaCity/Assets.xcassets/AppIcon.appiconset'
    icons.mkdir(parents=True, exist_ok=True)
    subprocess.run(['rtk', 'proxy', 'sips', '-z', '1024', '1024', str(ROOT / 'app-icons/icon-512.png'), '--out', str(icons / 'AppIcon.png')], check=True, stdout=subprocess.DEVNULL)
    (icons / 'Contents.json').write_text(json.dumps({'images': [{'idiom': 'universal', 'platform': 'ios', 'size': '1024x1024', 'filename': 'AppIcon.png'}], 'info': {'author': 'xcode', 'version': 1}}, indent=2))
    colors = ROOT / 'ios/LavaCity/Assets.xcassets/LaunchBackground.colorset'
    colors.mkdir(parents=True, exist_ok=True)
    (colors / 'Contents.json').write_text(json.dumps({'colors': [{'idiom': 'universal', 'color': {'color-space': 'srgb', 'components': {'red': '0.08', 'green': '0.18', 'blue': '0.21', 'alpha': '1.0'}}}], 'info': {'author': 'xcode', 'version': 1}}, indent=2))
    print(json.dumps({'web_files': len(list(DEST.rglob('*'))), 'bytes': sum(p.stat().st_size for p in DEST.rglob('*') if p.is_file()), 'directory': str(DEST)}))


if __name__ == '__main__':
    prepare()
