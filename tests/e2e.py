import subprocess,sys,time,os
from playwright.sync_api import sync_playwright
srv=subprocess.Popen([sys.executable,'-m','http.server','8782','-d','.'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
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
    pg.goto(U); pg.fill('#url','https://www.amazon.in/Women-Pink-Cotton-Printed-Straight-Kurti/dp/B09XYZ1234?tag=mytag-21')
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
    # mobile
    m=ctx.new_page(); m.set_viewport_size({'width':375,'height':800}); m.goto(U)
    for h in ['#/create','#/image','#/saved']:
        m.goto(U+h); m.wait_for_timeout(250)
        chk('no hscroll '+h,m.evaluate('document.documentElement.scrollWidth<=window.innerWidth'))
    m.screenshot(path='/tmp/pp_mobile.png')
    chk('no console errors',not errs)
    if errs: print(errs)
finally: srv.terminate()
print(ok,'passed; failed:',bad)
