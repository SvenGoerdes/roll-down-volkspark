"""Local real-Chrome acceptance checks; no production requests or leaderboard writes."""
import base64
import argparse
import json
import subprocess
import time
import tempfile
import urllib.request
from pathlib import Path
import websocket
from PIL import Image

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--port', type=int, default=8765)
args = parser.parse_args()
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / '.claude/review/28'
OUT.mkdir(parents=True, exist_ok=True)
profile = tempfile.TemporaryDirectory(prefix='chrome-', dir=OUT)
chrome = subprocess.Popen([
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '--headless=new',
    '--remote-debugging-port=0',
    f'--user-data-dir={profile.name}', '--no-first-run', '--no-default-browser-check', 'about:blank',
], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
    for _ in range(100):
        try:
            port = int((Path(profile.name) / 'DevToolsActivePort').read_text().splitlines()[0])
            targets = json.load(urllib.request.urlopen(f'http://127.0.0.1:{port}/json'))
            break
        except Exception:
            time.sleep(.1)
    page = next(p for p in targets if p['type'] == 'page')
    ws = websocket.create_connection(page['webSocketDebuggerUrl'], suppress_origin=True)
    counter = 0
    errors = []
    requests = []

    def call(method, params=None):
        global counter
        counter += 1
        n = counter
        ws.send(json.dumps({'id': n, 'method': method, 'params': params or {}}))
        while True:
            result = json.loads(ws.recv())
            if result.get('method') == 'Runtime.exceptionThrown':
                errors.append(result['params'])
            if result.get('method') == 'Network.requestWillBeSent':
                requests.append(result['params']['request']['url'])
            if result.get('id') == n:
                assert 'error' not in result, result
                return result.get('result', {})

    def js(code):
        result = call('Runtime.evaluate', {'expression': code, 'returnByValue': True, 'awaitPromise': True})
        assert 'exceptionDetails' not in result, result
        return result.get('result', {}).get('value')

    def capture(name):
        js('rollDown.step(0)')
        data = call('Page.captureScreenshot', {'format': 'png'})['data']
        (OUT / name).write_bytes(base64.b64decode(data))

    def click(selector):
        box = js(f'JSON.parse(JSON.stringify(document.querySelector({json.dumps(selector)}).getBoundingClientRect()))')
        x, y = box['x'] + box['width']/2, box['y'] + box['height']/2
        for kind in ('mousePressed', 'mouseReleased'):
            call('Input.dispatchMouseEvent', {'type': kind, 'x': x, 'y': y, 'button': 'left', 'clickCount': 1})

    call('Page.enable')
    call('Runtime.enable')
    call('Network.enable')
    call('Network.setCacheDisabled', {'cacheDisabled':True})
    call('Network.setBlockedURLs', {'urls': ['*workers.dev*']})
    call('Emulation.setDeviceMetricsOverride', {'width': 390, 'height': 844, 'deviceScaleFactor': 1, 'mobile': True})
    call('Page.addScriptToEvaluateOnNewDocument', {'source': 'localStorage.removeItem("rollDownBest");window.__nativeRaf=window.requestAnimationFrame.bind(window);window.requestAnimationFrame = cb => cb.name === "frame" ? 1 : window.__nativeRaf(cb);'})
    call('Page.navigate', {'url': f'http://127.0.0.1:{args.port}/#debug'})
    for _ in range(100):
        if js('document.body?.dataset.state') == 'start':
            break
        time.sleep(.1)
    assert js('document.body.dataset.state') == 'start'
    assert js('rollDown.game().theme') == 'volkspark'
    assert not any('brandenburg-gate-' in url and '.webp' in url for url in requests)
    capture('01-start-volkspark.png')
    call('Network.setBlockedURLs', {'urls':['*workers.dev*','*brandenburg-gate-*.webp*']})
    click('#themes button:nth-child(2)')
    assert js('document.body.dataset.state') == 'start'
    assert js('rollDown.game().theme') == 'berlin-tour'
    capture('02-start-berlin-tour.png')
    click('#start .tap')
    for _ in range(100):
        if js('document.querySelector("#start .tap").textContent') == 'Nochmal versuchen': break
        time.sleep(.1)
    assert js('document.body.dataset.state') == 'start'
    assert js('document.querySelector("#start .tap").textContent') == 'Nochmal versuchen'
    assert js('[...document.querySelectorAll("#themes button")].every(b=>!b.disabled)')
    capture('17-gate-load-error-retry.png')
    call('Network.setBlockedURLs', {'urls':['*workers.dev*']})
    click('#start .tap')
    for _ in range(100):
        if js('document.body.dataset.state') == 'intro':
            break
        time.sleep(.1)
    assert js('document.body.dataset.state') == 'intro', js('({state:document.body.dataset.state,text:document.querySelector("#start .tap").textContent,disabled:[...document.querySelectorAll("#themes button")].map(b=>b.disabled)})')
    js('rollDown.step(10)')
    assert js('document.body.dataset.state') == 'playing'
    js('rollDown.spawn(); rollDown.game().nextSpawnIn=9999')
    time.sleep(2.3)
    capture('03-berlin-playing.png')
    fixture = '''const g=rollDown.game(); g.walls=[
      {z:NEAR,gaps:GAPS,index:0}, {z:NEAR+19.1,gaps:[{x:NEXT,w:2.5}],index:1}];
      g.pickups=[];g.puddles=[];g.player.x=0;g.player.target=0;g.player.vx=0;'''
    for name, near, gaps, nxt in [
        ('04-gate-left.png', 13, [{'x':-1.7,'w':2.3}], 1.4),
        ('05-gate-right.png', 10, [{'x':1.7,'w':2.3}], -1.4),
        ('06-gate-near-following.png', 5.2, [{'x':-1.4,'w':1.95}], 1.5),
        ('07-gate-summer-double.png', 11, [{'x':-2,'w':2.2},{'x':2,'w':2.2}], -.8),
        ('08-gate-widen-overlap.png', 10, [{'x':-1,'w':2.8},{'x':1,'w':2.8}], 1),
    ]:
        if 'summer' in name or 'widen' in name:
            js('rollDown.setSeason(1);rollDown.game().passed=20;rollDown.game().seasonFade=1')
        js('(()=>{'+fixture.replace('NEAR',str(near)).replace('GAPS',json.dumps(gaps)).replace('NEXT',str(nxt))+'})()')
        if 'widen' in name:
            js('rollDown.game().effects.widen=7')
        capture(name)
        js('rollDown.game().effects.widen=0')
    js('rollDown.setSeason(0);rollDown.game().passed=0;rollDown.game().seasonFade=1')
    time.sleep(2.3)
    call('Emulation.setDeviceMetricsOverride', {'width':390,'height':844,'deviceScaleFactor':2,'mobile':True})
    js('window.dispatchEvent(new Event("resize"))')
    js('(()=>{'+fixture.replace('NEAR','6.5').replace('GAPS','[{x:2.1,w:1.95}]').replace('NEXT','-1.4')+'})()')
    capture('13-gate-near-dpr2.png')
    image = Image.open(OUT/'13-gate-near-dpr2.png')
    for name, box in [
        ('14-roof-closeup.png',(0,250,390,435)),
        ('15-pier-closeup.png',(170,420,235,600)),
        ('16-barrier-closeup.png',(5,540,140,610)),
    ]:
        image.crop(tuple(v*2 for v in box)).save(OUT/name)
    call('Emulation.setCPUThrottlingRate', {'rate':4})
    js('(()=>{const g=rollDown.game();for(let i=2;i<5;i++)g.walls.push({z:6.5+i*19.1,gaps:[{x:(i%2?1:-1),w:2.5}],index:i})})()')
    perf = js('''new Promise(resolve=>{const costs=[],intervals=[];let last=0,n=0;
      const frame=now=>{if(last)intervals.push(now-last);last=now;
      const at=performance.now();rollDown.step(0);costs.push(performance.now()-at);
      if(++n<130)window.__nativeRaf(frame);else{const stats=a=>{a=a.slice(10).sort((x,y)=>x-y);return {median:a[a.length>>1],p95:a[Math.floor(a.length*.95)],max:a.at(-1)}};
      resolve({renderMs:stats(costs),frameIntervalMs:stats(intervals),frames:n,cpuThrottle:4,viewport:[390,844],dpr:2,fixture:'five gates at original start spacing, near and shifted following passage'});}};
      window.__nativeRaf(frame);})''')
    (OUT/'performance.json').write_text(json.dumps(perf,indent=2)+'\n')
    call('Emulation.setCPUThrottlingRate', {'rate':1})
    call('Emulation.setDeviceMetricsOverride', {'width':390,'height':844,'deviceScaleFactor':1,'mobile':True})
    js('window.dispatchEvent(new Event("resize"))')
    js("(()=>{const g=rollDown.game(); g.walls=[{z:4.01,gaps:[{x:0,w:2}],index:0}];g.player.x=g.player.target=0;g.player.vx=0;g.nextSpawnIn=9999;rollDown.update(.01)})()")
    assert js('rollDown.game().passed') == 1
    capture('09-pass.png')
    js("(()=>{const g=rollDown.game();g.walls=[{z:4.01,gaps:[{x:3,w:2}],index:1}];g.player.helmets=1;rollDown.update(.01)})()")
    assert js('rollDown.game().player.helmets') == 0
    assert js('document.body.dataset.state') == 'playing'
    js("(()=>{const g=rollDown.game();g.walls=[{z:4.01,gaps:[{x:3,w:2}],index:2}];rollDown.update(.01)})()")
    assert js('document.body.dataset.state') == 'over'
    time.sleep(1.2)
    js('rollDown.step(.7)')
    capture('10-crash.png')
    click('#over .tap')
    assert js('document.body.dataset.state') == 'playing'
    assert js('rollDown.game().theme') == 'berlin-tour'
    assert js('rollDown.game().passed') == 0
    capture('11-restart.png')
    js("(()=>{const g=rollDown.game();g.walls=[{z:4.01,gaps:[{x:3,w:2}],index:0}];rollDown.update(.01)})()")
    assert js('document.body.dataset.state') == 'over'
    time.sleep(.85)
    click('#change-figure')
    assert js('document.body.dataset.state') == 'start'
    click('#themes button:first-child')
    click('#start .tap')
    for _ in range(100):
        if js('document.body.dataset.state') == 'intro': break
        time.sleep(.1)
    js('rollDown.step(10);rollDown.spawn();rollDown.game().walls[0].z=10')
    assert js('rollDown.game().theme') == 'volkspark'
    capture('12-volkspark-unchanged.png')
    requests.clear()
    call('Network.setBlockedURLs', {'urls':['*workers.dev*','*brandenburg-gate-*.webp*']})
    call('Page.reload')
    for _ in range(100):
        if js('document.body?.dataset.state') == 'start': break
        time.sleep(.1)
    click('#start .tap')
    for _ in range(100):
        if js('document.body.dataset.state') == 'intro': break
        time.sleep(.1)
    assert js('document.body.dataset.state') == 'intro'
    assert js('rollDown.game().theme') == 'volkspark'
    assert not any('brandenburg-gate-' in url and '.webp' in url for url in requests)
    report = {'viewport':[390,844], 'dpr':1, 'errors':errors,
              'checks':['default Volkspark','theme click stays on start','Berlin intro/play','left/right/small/double/widen fixtures',
                        'gate asset failure keeps start and re-enables choices','asset retry succeeds',
                        'pass scoring','helmet absorbs one crash','game over','Berlin UI retry','return to Volkspark',
                        'fresh Volkspark round starts without any gate WebP request'],
              'productionRequests':'blocked', 'realDevice':False}
    (OUT / 'checks.json').write_text(json.dumps(report, indent=2)+'\n')
    assert not errors, errors
    print(json.dumps(report, indent=2))
    call('Browser.close')
finally:
    chrome.terminate()
    chrome.wait(timeout=10)
    profile.cleanup()
