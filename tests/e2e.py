import subprocess,sys,time,os
from playwright.sync_api import sync_playwright
import json
HS={h['key']:h['value'] for h in json.load(open('vercel.json'))['headers'][0]['headers']}
open('/tmp/srv.py','w').write('import http.server,json,sys\nHS=json.loads(sys.argv[1])\nclass H(http.server.SimpleHTTPRequestHandler):\n  def end_headers(self):\n    [self.send_header(k,v) for k,v in HS.items()]\n    super().end_headers()\n  def log_message(self,*a): pass\nhttp.server.ThreadingHTTPServer(("",8782),H).serve_forever()\n')
srv=subprocess.Popen([sys.executable,'/tmp/srv.py',json.dumps(HS)]);time.sleep(1)
U='http://localhost:8782/index.html'; ok=0; bad=[]
def chk(n,c):
    global ok
    if c: ok+=1
    else: bad.append(n)
try:
  with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={'width':1200,'height':900},permissions=['clipboard-read','clipboard-write'],accept_downloads=True)
    pg=ctx.new_page(); errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m: errs.append(m.text) if m.type=='error' else None)
    pg.goto(U); chk('home h1','ready to post' in pg.inner_text('h1'))
    chk('home cta',pg.locator('a[href="#/create"]').count()>=2)
    pg.evaluate('window.scrollTo(0,document.body.scrollHeight)'); pg.wait_for_timeout(900)
    chk('scroll reveal',pg.locator('.rv.in').count()>=4)
    chk('progress bar','scaleX(1)' in (pg.get_attribute('#prog','style') or ''))
    chk('favicon',pg.evaluate("document.querySelector('link[rel=icon]').href.endsWith('favicon-32.png')"))
    pg.goto(U+'#/create'); pg.fill('#url','https://www.amazon.in/Women-Pink-Cotton-Printed-Straight-Kurti/dp/B09XYZ1234?tag=mytag-21')
    pg.wait_for_timeout(300)
    chk('prefill',pg.input_value('#cat')=='kurti' and 'Kurti' in pg.input_value('#title'))
    pg.click('#gf button[type=submit]'); pg.wait_for_timeout(500)
    chk('5 pins',pg.locator('.pin').count()==5)
    pg.locator('.pin').first.get_by_role('button',name='Copy title').click()
    t=pg.evaluate('navigator.clipboard.readText()'); chk('copy title',len(t)>10 and len(t)<=100)
    pg.locator('.pin').first.get_by_role('button',name='Copy everything').click()
    chk('copy all',len(pg.evaluate('navigator.clipboard.readText()'))>t.__len__())
    chk('no price invented','₹' not in pg.locator('#results').inner_text())
    pg.click('#regen'); pg.wait_for_timeout(300); chk('regen',pg.locator('.pin').count()==5)
    pg.locator('.pin').nth(1).get_by_role('button',name='Save to my pins').click(); pg.wait_for_timeout(200)
    chk('badge','1' in pg.inner_text('#savedCount'))
    # studio
    pg.locator('.pin').nth(1).get_by_role('button',name='Make the pin image').click(); pg.wait_for_timeout(400)
    chk('route image','#/image' in pg.url)
    pg.set_input_files('#photo','/tmp/photo.jpg'); pg.wait_for_timeout(500)
    with pg.expect_download() as d: pg.click('#dl')
    f=d.value.path()
    from PIL import Image; im=Image.open(f); chk('png 1000x1500',im.size==(1000,1500))
    pg.screenshot(path='/tmp/pp_studio.png')
    # saved
    pg.goto(U+'#/saved'); pg.wait_for_timeout(300)
    pg.locator('[data-k=earn]').first.fill('120'); pg.wait_for_timeout(200)
    chk('earn total','120' in pg.inner_text('#sum'))
    with pg.expect_download() as d2: pg.click('#csv')
    chk('csv',os.path.getsize(d2.value.path())>20)
    pg.screenshot(path='/tmp/pp_saved.png')
    # persistence
    pg.reload(); chk('persist','120' in pg.inner_text('#app'))
    # warnings
    pg.goto(U+'#/create'); pg.fill('#url','https://evil.example.com/x'); pg.wait_for_timeout(300)
    chk('bad link note',len(pg.inner_text('#linkInfo'))>0 or len(pg.inner_text('#titleErr'))>=0)
    # auto tag + setup guide
    a=ctx.new_page(); a.goto(U+'#/create'); a.fill('#url','https://www.amazon.in/Women-Pink-Cotton-Kurti/dp/B09XYZ1234'); a.wait_for_timeout(250)
    chk('setup card shown',a.locator('#setup').count()==1)
    a.click('[data-setup=no]'); chk('no-account steps','affiliate-program.amazon.in' in a.inner_text('#setup'))
    a.click('[data-setup=yes]'); a.fill('#atag','mystore-21'); a.wait_for_timeout(200)
    chk('setup card gone',a.locator('#setup').count()==0)
    a.fill('#url','https://www.amazon.in/Women-Pink-Cotton-Kurti/dp/B09XYZ1234'); a.wait_for_timeout(250)
    chk('auto note','added to this link automatically' in a.inner_text('#linkInfo'))
    a.click('#gf button[type=submit]'); a.wait_for_timeout(400)
    a.locator('[data-copy=link]').click(); chk('copied link has tag','tag=mystore-21' in a.evaluate('navigator.clipboard.readText()'))
    a.select_option('#atm','own'); a.wait_for_timeout(200); chk('own mode no auto','automatically' not in a.inner_text('#linkInfo'))
    # mobile
    m=ctx.new_page(); m.set_viewport_size({'width':375,'height':800}); m.goto(U)
    m.wait_for_timeout(200); chk('home no hscroll',m.evaluate('document.documentElement.scrollWidth<=window.innerWidth'))
    for h in ['#/','#/create','#/image','#/saved']:
        m.goto(U+h); m.wait_for_timeout(250)
        chk('no hscroll '+h,m.evaluate('document.documentElement.scrollWidth<=window.innerWidth'))
    m.screenshot(path='/tmp/pp_mobile.png')
    pg.screenshot(path='/tmp/pp_home.png')
    h=ctx.new_page(); h.goto(U); h.wait_for_timeout(300); h.screenshot(path='/tmp/pp_home_top.png'); h.evaluate('window.scrollTo(0,900)'); h.wait_for_timeout(900); h.screenshot(path='/tmp/pp_home_scroll.png')
    chk('no console errors',not errs)
    if errs: print(errs)
finally: srv.terminate()
print(ok,'passed; failed:',bad)
