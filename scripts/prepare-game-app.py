"""Prepare the shared installable game and a clean, static Site checkout."""
from pathlib import Path
import hashlib
import json
import math
import os
import shutil
import struct
import subprocess
import zlib

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / 'sites/lava-game'
DIST = SITE / 'dist'


def icon(size):
    polygons = [
        ([(.19,.68),(.49,.68),(.49,.76),(.19,.76)], (89,118,100)),
        ([(.57,.57),(.84,.57),(.84,.65),(.57,.65)], (89,118,100)),
        ([(.30,.41),(.40,.41),(.40,.51),(.30,.51)], (245,204,160)),
        ([(.29,.40),(.41,.40),(.41,.44),(.29,.44)], (43,68,75)),
        ([(.30,.51),(.41,.51),(.41,.61),(.30,.61)], (246,174,81)),
        ([(.22,.53),(.31,.53),(.31,.57),(.22,.57)], (246,174,81)),
        ([(.40,.49),(.47,.49),(.47,.53),(.40,.57)], (246,174,81)),
        ([(.30,.60),(.34,.60),(.30,.67),(.26,.67)], (49,74,88)),
        ([(.37,.60),(.41,.60),(.46,.66),(.41,.66)], (49,74,88)),
    ]
    star = []
    for i in range(10):
        angle = -math.pi/2 + i*math.pi/5
        radius = .13 if i % 2 == 0 else .057
        star.append((.67+math.cos(angle)*radius, .34+math.sin(angle)*radius))
    polygons.append((star,(255,231,135)))
    def contains(x,y,points):
        inside = False
        for i,(ax,ay) in enumerate(points):
            bx,by = points[i-1]
            if (ay>y)!=(by>y) and x<(bx-ax)*(y-ay)/(by-ay)+ax:
                inside = not inside
        return inside
    raw = bytearray()
    for py in range(size):
        raw.append(0)
        y = (py+.5)/size
        for px in range(size):
            x = (px+.5)/size
            color = (round(39+20*y),round(79+25*y),round(96+22*y))
            if y>.79: color=(232,round(125+30*math.sin(x*32+y*12)),68)
            if .77<y<.81: color=(255,205,108)
            for points,fill in polygons:
                if contains(x,y,points): color=fill
            raw.extend(color)
    def chunk(kind,data):
        return struct.pack('>I',len(data))+kind+data+struct.pack('>I',zlib.crc32(kind+data)&0xffffffff)
    png=b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',size,size,8,2,0,0,0))+chunk(b'IDAT',zlib.compress(raw,9))+chunk(b'IEND',b'')
    (ROOT/'app-icons'/f'icon-{size}.png').write_bytes(png)


(ROOT/'app-icons').mkdir(exist_ok=True)
for size in [180,192,512]: icon(size)

head = '''\n<!-- Installable game application -->
<link rel="manifest" href="manifest.webmanifest">
<meta name="theme-color" content="#152d36">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="岩浆跑酷">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<link rel="apple-touch-icon" href="app-icons/icon-180.png">
<link rel="icon" type="image/png" href="app-icons/icon-192.png">
<link rel="stylesheet" href="pwa.css">
<script defer src="pwa.js"></script>
'''
pages = [p for p in ROOT.glob('*.html') if p.name != 'game-qr.html']
for page in pages:
    text = page.read_text()
    if '<!-- Installable game application -->' not in text:
        text=text.replace('<meta name="mobile-web-app-capable" content="no" />','').replace('<meta name="apple-mobile-web-app-capable" content="no" />','')
        text=text.replace('</head>',head+'</head>')
        page.write_text(text)

runtime = [p for p in ROOT.iterdir() if p.suffix in {'.html','.js','.css','.webmanifest'} and p.name not in {'game-qr.html','precache-assets.js'}]
for directory in ['lib','levels','audio','assets','app-icons']:
    runtime.extend(p for p in (ROOT/directory).rglob('*') if p.is_file() and p.name != '.DS_Store')
runtime.extend(ROOT/'phone-login'/name for name in ['index.html','login.css','login.js','demo-session.js'])
offline_media = {'assets/flash-step/flash-step.mp4', 'assets/flash-step/poster.jpg'}
core = sorted('./'+str(p.relative_to(ROOT)) for p in runtime if (p.suffix in {'.html','.js','.mjs','.css','.webmanifest','.png','.json'} or p.relative_to(ROOT).as_posix() in offline_media) and p.name!='sw.js')
digest=hashlib.sha256()
for path in sorted(runtime):
    if path.suffix in {'.html','.js','.mjs','.css','.webmanifest'}:
        digest.update(str(path.relative_to(ROOT)).encode());digest.update(path.read_bytes())
(ROOT/'precache-assets.js').write_text('self.GAME_APP_VERSION='+json.dumps(digest.hexdigest()[:12])+';\nself.GAME_APP_ASSETS='+json.dumps(core,ensure_ascii=False)+';\n')
runtime.append(ROOT/'precache-assets.js')
DIST.mkdir(parents=True,exist_ok=True)
for source in runtime:
    target=DIST/source.relative_to(ROOT);target.parent.mkdir(parents=True,exist_ok=True)
    if source.stat().st_size>25*1024*1024 and source.suffix=='.m4a':
        if not target.exists() or not 1024*1024<target.stat().st_size<=25*1024*1024:
            encoder=os.environ.get('GAME_FFMPEG') or shutil.which('ffmpeg')
            if not encoder: raise RuntimeError('Set GAME_FFMPEG to an ffmpeg executable for oversized audio assets.')
            subprocess.run(['rtk','proxy',encoder,'-v','error','-y','-i',str(source),'-vn','-c:a','aac','-b:a','48k',str(target)],check=True)
    else: shutil.copy2(source,target)
    if target.stat().st_size>25*1024*1024: raise RuntimeError('Asset exceeds hosting limit: '+str(target))
manifest=SITE/'.openai/hosting.json'
data=json.loads(manifest.read_text()) if manifest.exists() else {}
data['static']={'directory':'dist'}
manifest.parent.mkdir(exist_ok=True);manifest.write_text(json.dumps(data,indent=2)+'\n')
print(json.dumps({'pages':len(pages),'precache_assets':len(core),'runtime_files':len(runtime),'dist':str(DIST),'cache_version':digest.hexdigest()[:12]}))
