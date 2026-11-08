"""E2E for the Season selector (create flow, many links, image studio). Run: python3 tests/seasons_e2e.py  (needs Playwright + Pillow)"""
import json, os, sys, threading, http.server, functools, io
from playwright.sync_api import sync_playwright
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HS = {h['key']: h['value'] for h in json.load(open(ROOT + '/vercel.json'))['headers'][0]['headers']}
class S(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        for k, v in HS.items(): self.send_header(k, v)
        super().end_headers()
    def log_message(self, *a): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 8783), functools.partial(S, directory=ROOT)); threading.Thread(target=srv.serve_forever, daemon=True).start()
U = 'http://127.0.0.1:8783/index.html'
ok, bad = 0, []
def chk(n, c, extra=''):
    global ok
    if c: ok += 1
    else: bad.append(n + ' ' + str(extra))
PHOTO = io.BytesIO(); Image.new('RGB', (800, 1000), (200, 200, 200)).save(PHOTO, 'JPEG'); open('/tmp/pp_season_photo.jpg', 'wb').write(PHOTO.getvalue())
def pix(pg, x, y): return pg.evaluate("([x,y])=>Array.from(document.querySelector('#cv').getContext('2d').getImageData(x,y,1,1).data).slice(0,3)", [x, y])
with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(viewport={'width': 1200, 'height': 900}, permissions=['clipboard-read', 'clipboard-write'], accept_downloads=True)
    pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.goto(U + '#/create'); pg.fill('#url', 'https://www.amazon.in/Women-Pink-Cotton-Printed-Straight-Kurti/dp/B09XYZ1234?tag=mytag-21'); pg.wait_for_timeout(300)
    chk('season defaults to none', pg.input_value('#season') == '')
    names = pg.eval_on_selector_all('#season option', 'o => o.map(x => x.textContent)')
    chk('seven seasons + none', len(names) == 8 and names[0].startswith('None'), names)
    pg.click('#gf button[type=submit]'); pg.wait_for_timeout(400)
    none_text = pg.inner_text('#results')
    chk('none: normal board names', 'Festive Outfit Ideas' in none_text and 'Diwali' not in none_text)
    for sid, word, tag in [('diwali', 'Diwali', '#diwalioutfit'), ('wedding', 'Wedding', '#weddingguestoutfit'), ('rakhi', 'Raksha Bandhan', '#rakshabandhan'), ('navratri', 'Navratri', '#navratrioutfit'), ('eid', 'Eid', '#eidoutfit'), ('xmas', 'Christmas', '#christmasoutfit'), ('sale', 'Sale Day', '#saledayfinds')]:
        pg.select_option('#season', sid); pg.click('#gf button[type=submit]'); pg.wait_for_timeout(300)
        t = pg.inner_text('#results')
        chk(sid + ': five pins mention season', pg.locator('.pin').count() == 5 and t.count(word) >= 10, t.count(word))
        chk(sid + ': hashtag shown', tag in t)
        chk(sid + ': no price, no urgency', '₹' not in t and not any(w in t.lower() for w in ['limited', 'hurry', 'left', 'off ', 'discount']))
        pg.locator('.pin').first.get_by_role('button', name='Copy everything').click()
        clip = pg.evaluate('navigator.clipboard.readText()'); chk(sid + ': copied text has board + alt', 'BOARD' in clip and 'ALT TEXT' in clip and word in clip)
    # studio from a season pin
    pg.select_option('#season', 'diwali'); pg.fill('#price', '649'); pg.click('#gf button[type=submit]'); pg.wait_for_timeout(300)
    pg.locator('.pin').nth(0).get_by_role('button', name='Make the pin image').click(); pg.wait_for_timeout(500)
    chk('studio season preselected', pg.input_value('#ssn') == 'diwali')
    chk('season swatch selected', pg.locator('#thm .sw[aria-pressed="true"]').get_attribute('data-k') == 'diwali' and pg.locator('#thm .sw').count() == 6)
    chk('season cta prefilled', pg.input_value('#ct') in ['See the details'])
    chk('badge suggestions shown', pg.locator('#sug [data-fill="small"]').count() >= 3 and pg.locator('#sug [data-fill="cta"]').count() >= 3)
    pg.locator('#sug [data-fill="small"]').first.click(); pg.wait_for_timeout(200)
    chk('suggestion fills badge', pg.input_value('#sm') == 'Diwali outfit idea')
    pg.select_option('#ssn', 'eid'); pg.wait_for_timeout(200)
    chk('switching season changes theme', pg.locator('#thm .sw[aria-pressed="true"]').get_attribute('data-k') == 'eid')
    pg.select_option('#ssn', 'diwali'); pg.wait_for_timeout(300)
    chk('badge pill uses season accent (#c2410c)', pix(pg, 90, 90) == [0xc2, 0x41, 0x0c], pix(pg, 90, 90))
    pg.set_input_files('#photo', '/tmp/pp_season_photo.jpg'); pg.wait_for_timeout(400)
    with pg.expect_download() as d: pg.click('#dl')
    chk('png 1000x1500', Image.open(d.value.path()).size == (1000, 1500))
    pg.select_option('#ssn', ''); pg.wait_for_timeout(300)
    chk('none restores base colours', pg.locator('#thm .sw').count() == 5 and pg.locator('#thm .sw[aria-pressed="true"]').get_attribute('data-k') == 'rose' and pg.inner_text('#sug').strip() == '')
    # studio from none: unchanged defaults
    pg.goto(U + '#/create'); pg.reload(); pg.fill('#url', 'https://www.amazon.in/Women-Pink-Cotton-Printed-Straight-Kurti/dp/B09XYZ1234'); pg.wait_for_timeout(300)
    pg.click('#gf button[type=submit]'); pg.wait_for_timeout(300); pg.locator('.pin').nth(0).get_by_role('button', name='Make the pin image').click(); pg.wait_for_timeout(400)
    chk('none: studio defaults unchanged', pg.input_value('#ssn') == '' and pg.input_value('#ct') == 'Shop the look' and pg.locator('#thm .sw').count() == 5)
    # bulk
    pg.goto(U + '#/bulk'); pg.wait_for_timeout(300)
    pg.fill('#bt', 'https://www.amazon.in/Women-Pink-Cotton-Printed-Straight-Kurti/dp/B09XYZ1234\nhttps://www.flipkart.com/women-printed-pure-cotton-anarkali-kurta/p/itm123abc'); pg.click('#bf button[type=submit]'); pg.wait_for_timeout(300)
    chk('bulk none: no season words', 'Diwali' not in pg.inner_text('#bout'))
    pg.select_option('#bseason', 'navratri'); pg.wait_for_timeout(300)
    chk('bulk season applied to every row', pg.inner_text('#bout').count('Navratri') >= 4, pg.inner_text('#bout').count('Navratri'))
    pg.select_option('#bseason', ''); pg.wait_for_timeout(300); chk('bulk back to none', 'Navratri' not in pg.inner_text('#bout'))
    # mobile layout
    m = ctx.new_page(); m.set_viewport_size({'width': 375, 'height': 800})
    for h in ['#/create', '#/bulk', '#/image']:
        m.goto(U + h); m.wait_for_timeout(250); chk('no hscroll ' + h, m.evaluate('document.documentElement.scrollWidth<=window.innerWidth'))
    chk('no console errors', not errs, errs)
    b.close()
print(ok, 'passed; failed:', bad); sys.exit(1 if bad else 0)
