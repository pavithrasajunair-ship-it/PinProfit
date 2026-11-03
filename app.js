document.documentElement.classList.add('js');
'use strict';
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const KEY = 'pinprofit.v1';
let DB = {prefs: {amazon: '', flipkart: '', disclosure: 'on', discText: 'general', autoTag: 'auto', setup: '', perDay: 2}, pins: []};
function load() { try { const r = JSON.parse(localStorage.getItem(KEY) || 'null'); if (r && Array.isArray(r.pins)) DB = {prefs: Object.assign(DB.prefs, r.prefs || {}), pins: r.pins}; } catch (e) { /* storage unavailable: run in memory */ } }
function save() { try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch (e) { /* ignore */ } updateBadge(); }
function updateBadge() { const b = $('#savedCount'); if (b) { b.textContent = DB.pins.length; b.hidden = !DB.pins.length; } }

/* ---------- toast + copy ---------- */
let toastT; function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 1800); }
async function copyText(text) {
  try { if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); return true; } } catch (e) { /* fall back */ }
  const ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;left:-9999px;top:0'; document.body.appendChild(ta); ta.select();
  let ok = false; try { ok = document.execCommand('copy'); } catch (e) { ok = false; } ta.remove(); return ok;
}
async function doCopy(btn, text, label) {
  const ok = await copyText(text); const old = btn.dataset.l || btn.textContent; btn.dataset.l = old;
  btn.textContent = ok ? 'Copied ✓' : 'Press Ctrl+C'; btn.classList.toggle('done', ok); toast(ok ? `${label || 'Text'} copied` : 'Copy was blocked by the browser. Select the text and press Ctrl+C.');
  setTimeout(() => { btn.textContent = old; btn.classList.remove('done'); }, 1600);
}

/* ---------- state ---------- */
const S = {form: {url: '', title: '', category: 'other', colour: '', price: '', details: '', touched: {}}, link: null, results: null, counter: 0, studio: {img: null, imgName: '', template: 'band', theme: 'rose', headline: '', small: '', cta: 'Shop the look'}};
const disclosureText = (l = S.link) => { if (DB.prefs.disclosure !== 'on') return ''; const amz = l && l.store === 'amazon'; return DB.prefs.discText === 'amazon' && amz ? PP.DISCLOSURES.amazon : DB.prefs.discText === 'amazon' ? PP.DISCLOSURES.general : PP.DISCLOSURES.general; };

/* ---------- create view ---------- */
const STORE_NAME = {amazon: 'Amazon', flipkart: 'Flipkart', meesho: 'Meesho', myntra: 'Myntra', other: 'Other shop'};
const myIds = () => ({amazon: DB.prefs.amazon.trim(), flipkart: DB.prefs.flipkart.trim()});
function finalLink(l) { if (!l || !l.ok) return null; return DB.prefs.autoTag === 'auto' ? PP.applyTag(l, myIds()) : {url: l.url, added: false}; }
function linkNotes() {
  const l = S.link; if (!l) return '';
  const fl = finalLink(l);
  const items = l.issues.slice();
  if (fl && fl.added) items.push({level: 'ok', msg: `Your ID (${fl.id}) was added to this link automatically. Click "Copy link", open it once and check it in your affiliate reports before posting many pins. If it does not count, switch to "I paste my own official link" in My setup.`});
  else items.push(...PP.checkAffiliate(l, myIds()));
  if (l.ok && (l.store === 'amazon' || l.store === 'flipkart') && !l.short && !l.tag && !(fl && fl.added)) items.push({level: 'info', msg: DB.prefs.autoTag === 'auto' ? 'Save your ID in My setup and PinProfit will add it for you.' : 'Automatic adding is off. Paste your official affiliate link.'});
  const head = l.ok ? `<span class="chip">${esc(STORE_NAME[l.store])}</span>` : '';
  return head + items.map(i => `<p class="note ${i.level}" role="${i.level === 'error' ? 'alert' : 'status'}">${i.level === 'ok' ? '✓' : i.level === 'warn' ? '⚠' : i.level === 'error' ? '✕' : 'ℹ'} ${esc(i.msg)}</p>`).join('');
}
function setupCard() {
  if (DB.prefs.amazon.trim() || DB.prefs.setup === 'done') return '';
  if (DB.prefs.setup === 'no') return `<div class="card" id="setup"><h2>Get your Amazon affiliate ID first</h2><ol><li>Sign up free at <a href="https://affiliate-program.amazon.in/" target="_blank" rel="noopener noreferrer">affiliate-program.amazon.in</a> and wait for approval.</li><li>After approval, your <b>Store ID</b> (like <span class="mono">yourname-21</span>) shows at the top of the Associates page.</li><li>Come back, type it under <b>My setup</b>, and PinProfit adds it to your links.</li></ol><p class="small mute">PinProfit cannot check whether you have an account. It only checks the ID looks right.</p><div class="row"><button class="btn" data-setup="yes" type="button">I have my ID now</button><button class="btn" data-setup="skip" type="button">Skip for now</button></div></div>`;
  return `<div class="card" id="setup"><h2>Quick setup (once)</h2><p>Do you have an Amazon Associates account?</p><div class="row"><button class="btn pri" data-setup="yes" type="button">Yes, I have one</button><button class="btn" data-setup="no" type="button">No, help me create one</button><button class="btn" data-setup="skip" type="button">Skip</button></div></div>`;
}
function renderCreate() {
  const f = S.form;
  $('#app').innerHTML = `<section class="hero"><h1>Paste a product link. Get pins ready to post.</h1><p class="mute">Five different pin versions with titles, descriptions, hashtags and alt text. One click copies each part.</p></section>
  ${setupCard()}
  <form id="gf" class="card" novalidate>
    <h2><span class="step">1</span> The product</h2>
    <label for="url">Product link (Amazon or Flipkart) <span class="mute">optional but recommended</span></label>
    <input id="url" type="text" inputmode="url" autocomplete="off" placeholder="https://www.amazon.in/..." value="${esc(f.url)}">
    <div id="linkInfo" aria-live="polite">${linkNotes()}</div>
    <div class="grid2">
      <div><label for="title">Product name</label><input id="title" type="text" maxlength="160" placeholder="e.g. Women Pink Cotton Printed Kurti" value="${esc(f.title)}"><div class="err" id="titleErr" role="alert"></div></div>
      <div><label for="cat">Type</label><select id="cat">${PP.CATS.map(c => `<option value="${c.id}" ${c.id === f.category ? 'selected' : ''}>${esc(c.id === 'other' ? 'Other / not sure' : c.noun[0].toUpperCase() + c.noun.slice(1))}</option>`).join('')}</select></div>
      <div><label for="colour">Colour</label><input id="colour" type="text" maxlength="30" placeholder="e.g. pink" value="${esc(f.colour)}"></div>
      <div><label for="price">Price in ₹ <span class="mute">optional</span></label><input id="price" type="text" inputmode="numeric" maxlength="7" placeholder="e.g. 649" value="${esc(f.price)}"></div>
    </div>
    <label for="details">Details you know are true <span class="mute">optional: fabric, sleeves, set contents</span></label>
    <input id="details" type="text" maxlength="140" placeholder="cotton, 3/4 sleeves, with dupatta" value="${esc(f.details)}">
    <details class="set" id="mysetup"><summary>My setup: affiliate IDs and disclosure line</summary>
      <div class="grid2"><div><label for="atag">My Amazon tag</label><input id="atag" type="text" maxlength="40" placeholder="yourname-21" value="${esc(DB.prefs.amazon)}"></div>
      <div><label for="fid">My Flipkart affiliate ID</label><input id="fid" type="text" maxlength="40" placeholder="yourid" value="${esc(DB.prefs.flipkart)}"></div></div>
      <label for="atm">When I paste a plain product link</label><select id="atm"><option value="auto" ${DB.prefs.autoTag === 'auto' ? 'selected' : ''}>Add my ID to it automatically</option><option value="own" ${DB.prefs.autoTag === 'own' ? 'selected' : ''}>I paste my own official affiliate link</option></select>
      <label class="chk"><input type="checkbox" id="disc" ${DB.prefs.disclosure === 'on' ? 'checked' : ''}> Add an affiliate disclosure line to every description</label>
      <label for="dtext">Disclosure wording</label><select id="dtext"><option value="general" ${DB.prefs.discText === 'general' ? 'selected' : ''}>${esc(PP.DISCLOSURES.general)}</option><option value="amazon" ${DB.prefs.discText === 'amazon' ? 'selected' : ''}>Amazon links: ${esc(PP.DISCLOSURES.amazon)}</option></select>
      <p class="small mute">Pinterest and affiliate programmes expect you to say when a link earns you money. Check your programme's current rules; PinProfit only suggests wording.</p></details>
    <p><button class="btn pri" type="submit">Generate 5 pins</button></p>
  </form>
  <div id="results" aria-live="polite"></div>`;
  bindCreate(); if (S.results) renderResults();
}
function readForm() { const f = S.form; f.url = $('#url').value; f.title = $('#title').value; f.category = $('#cat').value; f.colour = $('#colour').value; f.price = $('#price').value; f.details = $('#details').value; }
function bindCreate() {
  const info = () => { $('#linkInfo').innerHTML = linkNotes(); };
  const apply = () => {
    S.link = PP.parseLink($('#url').value); info();
    if (S.link.slugTitle && !S.form.touched.title) { $('#title').value = S.link.slugTitle; }
    const t = $('#title').value;
    if (t && !S.form.touched.category) $('#cat').value = PP.detectCategory(t);
    if (t && !S.form.touched.colour) $('#colour').value = PP.detectColour(t);
    readForm();
  };
  $('#url').addEventListener('input', apply); $('#url').addEventListener('paste', () => setTimeout(apply, 0));
  $('#title').addEventListener('input', () => { S.form.touched.title = true; const t = $('#title').value; if (!S.form.touched.category) $('#cat').value = PP.detectCategory(t); if (!S.form.touched.colour) $('#colour').value = PP.detectColour(t); readForm(); });
  $('#cat').addEventListener('change', () => { S.form.touched.category = true; readForm(); });
  $('#colour').addEventListener('input', () => { S.form.touched.colour = true; readForm(); });
  ['price', 'details'].forEach(id => $('#' + id).addEventListener('input', readForm));
  $('#atag').addEventListener('input', e => { DB.prefs.amazon = e.target.value; save(); info(); const s = $('#setup'); if (s && e.target.value.trim()) s.remove(); });
  $('#fid').addEventListener('input', e => { DB.prefs.flipkart = e.target.value; save(); info(); });
  $('#atm').addEventListener('change', e => { DB.prefs.autoTag = e.target.value; save(); info(); });
  const su = $('#setup'); if (su) su.addEventListener('click', e => { const b = e.target.closest('[data-setup]'); if (!b) return; const v = b.dataset.setup;
    if (v === 'yes') { $('#mysetup').open = true; DB.prefs.setup = ''; save(); su.innerHTML = '<p>Type your Store ID under <b>My setup</b> below. You only do this once.</p>'; $('#atag').focus(); }
    else { DB.prefs.setup = v === 'no' ? 'no' : 'done'; save(); renderCreate(); } });
  $('#disc').addEventListener('change', e => { DB.prefs.disclosure = e.target.checked ? 'on' : 'off'; save(); });
  $('#dtext').addEventListener('change', e => { DB.prefs.discText = e.target.value; save(); });
  $('#gf').addEventListener('submit', e => { e.preventDefault(); readForm(); if (!S.form.title.trim()) { $('#titleErr').textContent = S.link && S.link.short ? 'This is a short link, so please type the product name.' : 'Type the product name so the pins can be written.'; $('#title').focus(); return; } $('#titleErr').textContent = ''; S.counter = 0; generate(); $('#results').scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start'}); });
}
function generate() {
  const f = S.form;
  S.results = PP.generate({title: f.title, category: f.category, colour: f.colour, details: f.details, price: f.price, disclosure: disclosureText(), counter: S.counter});
  S.snapshot = {url: S.link && S.link.ok ? finalLink(S.link).url : f.url.trim(), store: S.link ? S.link.store : 'other', price: f.price};
  renderResults();
}
const meter = (n, soft, hard) => `<span class="cnt ${n > hard ? 'bad' : n > soft ? 'warn' : ''}">${n}/${soft}</span>`;
function renderResults() {
  const r = S.results; if (!r) return;
  const link = S.snapshot.url;
  $('#results').innerHTML = `<div class="row sp rh"><h2><span class="step">2</span> Your 5 pins</h2><button class="btn" id="regen">↻ Write them differently</button></div>
  ${link ? `<div class="card linkcard row sp"><span class="small"><b>Destination link</b> <span class="mono">${esc(link.length > 70 ? link.slice(0, 70) + '…' : link)}</span></span><button class="btn sm" data-copy="link">Copy link</button></div>` : '<p class="note info">ℹ No product link added, so there is no link to copy. Add your affiliate link to the pin on Pinterest.</p>'}
  <div class="pins">${r.map((v, i) => `<article class="card pin" data-i="${i}"><div class="row sp"><span class="chip alt">${esc(v.label)}</span><span class="small mute">Board: ${esc(v.board)}</span></div>
    <h3>Title ${meter(v.title.length, 100, 100)}</h3><p class="val" data-f="title">${esc(v.title)}</p>
    <h3>Description ${meter(v.description.length, 500, 800)}</h3><p class="val desc" data-f="description">${esc(v.description)}</p>
    <h3>Alt text</h3><p class="val small" data-f="alt">${esc(v.alt)}</p>
    <h3>Search keywords</h3><p class="val small">${esc(v.keywords.join(', '))}</p>
    <div class="actions"><button class="btn sm" data-copy="title">Copy title</button><button class="btn sm" data-copy="description">Copy description</button><button class="btn sm" data-copy="alt">Copy alt text</button><button class="btn sm pri" data-copy="all">Copy everything</button></div>
    <div class="actions"><button class="btn sm" data-act="image">Make the pin image →</button><button class="btn sm" data-act="save">Save to my pins</button></div></article>`).join('')}</div>
  <p class="small mute">Pinterest shows roughly the first 50 to 60 characters of a title, so the key words come first. Descriptions work best under 500 characters (the limit is 800). Post each version on a different day rather than all at once.</p>`;
  $('#regen').addEventListener('click', () => { S.counter++; generate(); toast('Written differently'); });
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-copy],[data-act]'); if (!b) return;
  if (b.dataset.copy === 'link') return doCopy(b, S.snapshot.url, 'Link');
  const card = b.closest('.pin'); if (!card) return; const v = S.results[+card.dataset.i];
  if (b.dataset.copy) { const map = {title: v.title, description: v.description, alt: v.alt, all: v.text + (S.snapshot.url ? '\n\nLINK\n' + S.snapshot.url : '')}; return doCopy(b, map[b.dataset.copy], b.dataset.copy === 'all' ? 'Everything' : b.dataset.copy[0].toUpperCase() + b.dataset.copy.slice(1)); }
  if (b.dataset.act === 'image') { const bk = PP.priceBucket(S.snapshot.price); Object.assign(S.studio, {headline: v.title, small: bk ? `Under ₹${bk.toLocaleString('en-IN')}` : '', cta: 'Shop the look'}); location.hash = '#/image'; }
  if (b.dataset.act === 'save') { DB.pins.unshift({id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5), t: Date.now(), title: v.title, store: S.snapshot.store, url: S.snapshot.url, angle: v.angle, label: v.label, board: v.board, desc: v.description, alt: v.alt, status: 'drafted', clicks: '', earn: '', note: ''}); save(); toast('Saved to My pins'); b.textContent = 'Saved ✓'; b.disabled = true; }
});

/* ---------- pin image view ---------- */
let raf = 0; const redraw = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { const c = $('#cv'); if (c) Studio.draw(c, S.studio); }); };
function renderImage() {
  const s = S.studio;
  $('#app').innerHTML = `<section class="hero"><h1>Make the pin image</h1><p class="mute">Upload your own photo, pick a layout, and download a 1000 × 1500 pin (the 2:3 shape Pinterest likes).</p></section>
  <div class="studio"><div class="card canvasbox"><canvas id="cv" width="1000" height="1500" role="img" aria-label="Pin preview"></canvas></div>
  <div class="card ctl">
    <label for="photo">Your photo</label><input id="photo" type="file" accept="image/png,image/jpeg,image/webp"><div class="err" id="photoErr" role="alert"></div>
    <p class="small mute">Use photos you took or have permission to use. Product photos copied from shopping sites may not be allowed by the shop or your affiliate programme. The photo stays on your device.</p>
    <label>Layout</label><div class="seg" id="tpl" role="group" aria-label="Layout">${Object.entries(Studio.TEMPLATES).map(([k, n]) => `<button type="button" class="tab" data-k="${k}" aria-pressed="${k === s.template}">${esc(n)}</button>`).join('')}</div>
    <label>Colours</label><div class="seg" id="thm" role="group" aria-label="Colours">${Object.entries(Studio.THEMES).map(([k, t]) => `<button type="button" class="sw" data-k="${k}" aria-pressed="${k === s.theme}" aria-label="${esc(t.name)}" title="${esc(t.name)}" style="background:linear-gradient(135deg,${t.bg} 50%,${t.accent} 50%)"></button>`).join('')}</div>
    <label for="hd">Headline</label><textarea id="hd" rows="3" maxlength="120">${esc(s.headline)}</textarea>
    <div class="grid2"><div><label for="sm">Badge text</label><input id="sm" type="text" maxlength="24" placeholder="Under ₹699" value="${esc(s.small)}"></div><div><label for="ct">Call to action</label><input id="ct" type="text" maxlength="30" value="${esc(s.cta)}"></div></div>
    <div class="actions"><button class="btn pri" id="dl">Download pin (PNG)</button><button class="btn" id="cpimg">Copy image</button></div>
    <p class="small mute" id="imgNote"></p></div></div>`;
  $('#photo').addEventListener('change', async e => { const f = e.target.files[0]; if (!f) return; try { s.img = await Studio.loadImage(f); s.imgName = f.name; $('#photoErr').textContent = ''; redraw(); } catch (err) { $('#photoErr').textContent = err.message; e.target.value = ''; } });
  $('#tpl').addEventListener('click', e => { const b = e.target.closest('[data-k]'); if (!b) return; s.template = b.dataset.k; $$('#tpl .tab').forEach(x => x.setAttribute('aria-pressed', x === b)); redraw(); });
  $('#thm').addEventListener('click', e => { const b = e.target.closest('[data-k]'); if (!b) return; s.theme = b.dataset.k; $$('#thm .sw').forEach(x => x.setAttribute('aria-pressed', x === b)); redraw(); });
  [['hd', 'headline'], ['sm', 'small'], ['ct', 'cta']].forEach(([id, k]) => $('#' + id).addEventListener('input', e => { s[k] = e.target.value; redraw(); }));
  const blob = () => new Promise(res => $('#cv').toBlob(res, 'image/png'));
  $('#dl').addEventListener('click', async () => { Studio.draw($('#cv'), s); const b = await blob(); if (!b) { $('#imgNote').textContent = 'The image could not be created. Try a smaller photo.'; return; } const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'pinprofit-pin.png'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); toast('Pin downloaded'); });
  $('#cpimg').addEventListener('click', async () => { try { const b = await blob(); await navigator.clipboard.write([new ClipboardItem({'image/png': b})]); toast('Image copied'); $('#imgNote').textContent = ''; } catch (e) { $('#imgNote').textContent = 'Your browser did not allow copying the image. Use Download instead.'; } });
  redraw();
}

/* ---------- saved pins ---------- */
const csvCell = v => { let s = String(v == null ? '' : v); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; };
function sumHtml() {
  const pins = DB.pins, total = pins.reduce((a, p) => a + (parseFloat(p.earn) || 0), 0), clicks = pins.reduce((a, p) => a + (parseInt(p.clicks, 10) || 0), 0);
  const by = {}; pins.forEach(p => { const e = parseFloat(p.earn) || 0; if (e > 0) { (by[p.label] = by[p.label] || {e: 0, n: 0}); by[p.label].e += e; by[p.label].n++; } });
  const best = Object.entries(by).sort((a, b) => b[1].e - a[1].e)[0];
  return `<div class="card"><h3>Pins saved</h3><p class="stat">${pins.length}</p><p class="small mute">${pins.filter(p => p.status === 'published').length} published</p></div><div class="card"><h3>Clicks you logged</h3><p class="stat">${clicks}</p></div><div class="card"><h3>Earnings you logged</h3><p class="stat">₹${total.toLocaleString('en-IN', {maximumFractionDigits: 2})}</p>${best ? `<p class="small mute">Top style so far: <b>${esc(best[0])}</b> (₹${best[1].e.toLocaleString('en-IN')} from ${best[1].n} pin${best[1].n > 1 ? 's' : ''})</p>` : '<p class="small mute">Add earnings to see which style works best.</p>'}</div>`;
}
/* ---------- weekly chart ---------- */
function weekly() {
  const mon = t => { const d = new Date(t); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.getTime(); };
  const now = mon(Date.now()), W = 8, out = [];
  for (let i = W - 1; i >= 0; i--) { const d = new Date(now); d.setDate(d.getDate() - 7 * i); out.push({t: d.getTime(), e: 0, n: 0}); }
  DB.pins.forEach(p => { const k = out.find(w => w.t === mon(p.t)); if (k) { k.n++; k.e += Number(p.earn) > 0 ? Number(p.earn) : 0; } });
  return out;
}
function chartHtml() {
  const w = weekly(), max = Math.max(...w.map(x => x.e), 1), tot = w.reduce((s, x) => s + x.e, 0);
  const lab = x => new Date(x.t).toLocaleDateString('en-IN', {day: 'numeric', month: 'short'});
  const bars = w.map((x, i) => { const h = Math.round(x.e / max * 120), X = 14 + i * 56; return `<g><rect x="${X}" y="${140 - h}" width="40" height="${h || 1}" rx="6" fill="${x.e ? 'var(--acc)' : 'var(--line)'}"/><text x="${X + 20}" y="${134 - h}" text-anchor="middle" font-size="11" fill="var(--ink)">${x.e ? '₹' + Math.round(x.e) : ''}</text><text x="${X + 20}" y="158" text-anchor="middle" font-size="10" fill="var(--mute)">${esc(lab(x))}</text></g>`; }).join('');
  return `<h2>Earnings by week</h2><p class="small mute">Grouped by the week you saved each pin (PinProfit does not know the date a sale happened). Last 8 weeks, only the earnings you typed in.</p>
  <svg viewBox="0 0 470 168" role="img" aria-label="Bar chart of earnings you logged, by week saved. Total in the last 8 weeks: ${Math.round(tot)} rupees." class="wkchart">${bars}</svg>
  <table class="sr"><caption>Earnings by week saved</caption><tr><th>Week starting</th><th>Pins</th><th>Earned ₹</th></tr>${w.map(x => `<tr><td>${esc(lab(x))}</td><td>${x.n}</td><td>${x.e}</td></tr>`).join('')}</table>`;
}
/* ---------- backup and restore ---------- */
const clip = (v, n) => String(v == null ? '' : v).slice(0, n);
function cleanDB(raw) {
  if (!raw || typeof raw !== 'object' || raw.app !== 'pinprofit' || !Array.isArray(raw.pins) || raw.pins.length > 5000) return null;
  const pr = raw.prefs && typeof raw.prefs === 'object' ? raw.prefs : {};
  const prefs = {amazon: clip(pr.amazon, 40), flipkart: clip(pr.flipkart, 40), disclosure: pr.disclosure === 'off' ? 'off' : 'on', discText: pr.discText === 'amazon' ? 'amazon' : 'general', autoTag: pr.autoTag === 'own' ? 'own' : 'auto', setup: ['no', 'done'].includes(pr.setup) ? pr.setup : '', perDay: [1, 2, 3, 4, 5].includes(+pr.perDay) ? +pr.perDay : 2};
  const pins = raw.pins.filter(p => p && typeof p === 'object').map(p => ({id: clip(p.id, 20).replace(/[^\w-]/g, '') || Date.now().toString(36) + Math.random().toString(36).slice(2, 5), t: Number.isFinite(+p.t) && +p.t > 0 ? +p.t : Date.now(), title: clip(p.title, 200), store: ['amazon', 'flipkart', 'meesho', 'myntra', 'other'].includes(p.store) ? p.store : 'other', url: /^https?:\/\//i.test(p.url) ? clip(p.url, 2000) : '', angle: clip(p.angle, 20), label: clip(p.label, 60), board: clip(p.board, 80), desc: clip(p.desc, 800), alt: clip(p.alt, 500), status: ['drafted', 'published', 'update'].includes(p.status) ? p.status : 'drafted', clicks: clip(p.clicks, 7), earn: clip(p.earn, 9), note: clip(p.note, 120)}));
  return {prefs, pins};
}
function backupCard() {
  return `<section class="card" id="bk"><h2>Back up and restore</h2><p class="small mute">Your pins live only in this browser. Download a backup file to keep them safe or move them to another phone or laptop.</p><div class="row"><button class="btn" id="bkOut" type="button">Download backup</button><label class="btn" for="bkIn" style="margin:0">Restore from backup<input id="bkIn" type="file" accept=".json,application/json" hidden></label></div><p id="bkMsg" class="small" role="status" aria-live="polite"></p></section>`;
}
function bindBackup() {
  const out = $('#bkOut'), inp = $('#bkIn'), msg = $('#bkMsg'); if (!out) return;
  out.addEventListener('click', () => { const data = JSON.stringify({app: 'pinprofit', version: 1, exported: new Date().toISOString(), prefs: DB.prefs, pins: DB.pins}, null, 1); const b = new Blob([data], {type: 'application/json'}); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'pinprofit-backup-' + new Date().toISOString().slice(0, 10) + '.json'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); msg.textContent = 'Backup downloaded.'; });
  inp.addEventListener('change', async () => { const f = inp.files[0]; inp.value = ''; if (!f) return;
    if (f.size > 3e6) { msg.textContent = 'That file is too big to be a PinProfit backup.'; return; }
    let clean = null; try { clean = cleanDB(JSON.parse(await f.text())); } catch (e) { /* invalid */ }
    if (!clean) { msg.textContent = 'That does not look like a PinProfit backup file.'; return; }
    const have = new Set(DB.pins.map(p => p.id)), fresh = clean.pins.filter(p => !have.has(p.id));
    const replace = confirm(`Backup has ${clean.pins.length} pins.\n\nOK = replace what is on this device with the backup.\nCancel = only add the ${fresh.length} pins that are not here yet.`);
    if (replace) { DB.prefs = clean.prefs; DB.pins = clean.pins; } else { DB.pins = DB.pins.concat(fresh); }
    save(); updateBadge(); renderSaved(); const m2 = $('#bkMsg'); if (m2) m2.textContent = replace ? 'Backup restored.' : `Added ${fresh.length} pins.`; });
}
function renderSaved() {
  const pins = DB.pins;
  $('#app').innerHTML = `<section class="hero"><h1>My pins</h1><p class="mute">Track what you posted and what it earned. Numbers are the ones you type in; PinProfit does not read your Pinterest or affiliate accounts.</p></section>
  ${pins.length ? `<div class="grid3" id="sum">${sumHtml()}</div>
  <section class="card" id="wk">${chartHtml()}</section>
  <div class="row sp" style="margin:1rem 0"><h2>All pins</h2><button class="btn" id="csv">Download as spreadsheet (CSV)</button></div>
  <div class="plist">${pins.map(p => `<article class="card sp-row" data-id="${esc(p.id)}"><div><b>${esc(p.title)}</b><p class="small mute">${esc(p.label)} · ${esc(STORE_NAME[p.store] || 'Shop')} · Board: ${esc(p.board)} · saved ${new Date(p.t).toLocaleDateString('en-IN')}</p></div>
    <div class="trk"><label>Status<select data-k="status"><option value="drafted" ${p.status === 'drafted' ? 'selected' : ''}>Drafted</option><option value="published" ${p.status === 'published' ? 'selected' : ''}>Published</option><option value="update" ${p.status === 'update' ? 'selected' : ''}>Needs update</option></select></label>
    <label>Clicks<input data-k="clicks" type="text" inputmode="numeric" maxlength="7" value="${esc(p.clicks)}"></label><label>Earned ₹<input data-k="earn" type="text" inputmode="decimal" maxlength="9" value="${esc(p.earn)}"></label>
    <label class="wide">Note<input data-k="note" type="text" maxlength="120" value="${esc(p.note)}"></label><button class="btn sm" data-del="1">Delete</button></div></article>`).join('')}</div>`
  : `<div class="empty"><p><b>No saved pins yet.</b></p><p>Generate pins and press “Save to my pins” on the ones you post.</p><a class="btn pri" href="#/create">Create pins</a></div>`}
  ${backupCard()}`;
  bindBackup();
  const csv = $('#csv'); if (csv) csv.addEventListener('click', () => { const rows = [['Saved', 'Title', 'Style', 'Shop', 'Board', 'Status', 'Clicks', 'Earned (INR)', 'Note', 'Link']].concat(DB.pins.map(p => [new Date(p.t).toISOString().slice(0, 10), p.title, p.label, p.store, p.board, p.status, p.clicks, p.earn, p.note, p.url])); const b = new Blob(['﻿' + rows.map(r => r.map(csvCell).join(',')).join('\r\n')], {type: 'text/csv'}); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'pinprofit-pins.csv'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); });
}
function onTrack(e) { const el = e.target.closest('[data-k]'); const card = el && el.closest('.sp-row'); if (!card) return; const p = DB.pins.find(x => x.id === card.dataset.id); if (!p) return; p[el.dataset.k] = el.value; save(); const sm = $('#sum'); if (sm) sm.innerHTML = sumHtml(); const wk = $('#wk'); if (wk) wk.innerHTML = chartHtml(); }
document.addEventListener('input', onTrack); document.addEventListener('change', onTrack);
document.addEventListener('click', e => { const d = e.target.closest('[data-del]'); if (!d) return; const card = d.closest('.sp-row'); if (!confirm('Delete this saved pin?')) return; DB.pins = DB.pins.filter(x => x.id !== card.dataset.id); save(); renderSaved(); });

/* ---------- many links at once ---------- */
const BULK_MAX = 20;
S.bulk = {text: '', rows: []};
function bulkPin(r) {
  if (!r.title.trim()) return null;
  return PP.generate({title: r.title, category: r.cat, colour: r.colour, details: '', price: '', disclosure: disclosureText(r.link), counter: r.counter})[r.style];
}
function bulkRowHtml(r, i) {
  const l = r.link, fl = r.fl, v = r.ok ? bulkPin(r) : null;
  const head = `<div class="row sp"><span><span class="chip">${esc(STORE_NAME[l.store] || 'Link')}</span> <span class="small mono">${esc(r.raw.length > 60 ? r.raw.slice(0, 60) + '…' : r.raw)}</span></span></div>`;
  if (!r.ok) return `<article class="card" data-r="${i}">${head}${l.issues.map(x => `<p class="note error">✕ ${esc(x.msg)}</p>`).join('') || '<p class="note error">✕ This does not look like a web link.</p>'}</article>`;
  const note = fl.added ? `<p class="note ok small">✓ Your ID (${esc(fl.id)}) was added to this link.</p>` : PP.checkAffiliate(l, myIds()).map(x => `<p class="note ${x.level} small">${x.level === 'ok' ? '✓' : '⚠'} ${esc(x.msg)}</p>`).join('');
  return `<article class="card bulkrow" data-r="${i}">${head}${note}
    <div class="grid2"><div><label for="bn${i}">Product name</label><input id="bn${i}" data-bname type="text" maxlength="120" value="${esc(r.title)}" placeholder="Type the product name"></div>
    <div><label for="bs${i}">Style</label><select id="bs${i}" data-bstyle>${PP.ANGLES.map((x, k) => `<option value="${k}" ${k === r.style ? 'selected' : ''}>${esc(x.label)}</option>`).join('')}</select></div></div>
    <div class="bpin" id="bp${i}">${bulkPinHtml(r, i, v)}</div></article>`;
}
function bulkPinHtml(r, i, v) {
  if (!v) return '<p class="note info">ℹ Type the product name to get the pin.</p>';
  return `<h3>Title <span class="cnt">${v.title.length}/100</span></h3><p class="val">${esc(v.title)}</p><h3>Description <span class="cnt">${v.description.length}/500</span></h3><p class="val desc">${esc(v.description)}</p>
  <div class="actions"><button class="btn sm" data-bc="title" data-i="${i}" type="button">Copy title</button><button class="btn sm" data-bc="desc" data-i="${i}" type="button">Copy description</button><button class="btn sm" data-bc="link" data-i="${i}" type="button">Copy link</button><button class="btn sm pri" data-bc="all" data-i="${i}" type="button">Copy everything</button><button class="btn sm" data-bsave data-i="${i}" type="button" ${r.saved ? 'disabled' : ''}>${r.saved ? 'Saved ✓' : 'Save to my pins'}</button></div>`;
}
const bulkText = (r, v) => v.text + (r.fl.url ? '\n\nLINK\n' + r.fl.url : '');
function renderBulk() {
  $('#app').innerHTML = `<section class="hero"><h1>Many links at once</h1><p class="mute">Paste up to ${BULK_MAX} Amazon or Flipkart links, one per line. You get a pin for each, with your affiliate ID added if you saved it.</p></section>
  <form id="bf" class="card" novalidate><label for="bt">Product links (one per line)</label><textarea id="bt" rows="7" maxlength="20000" placeholder="https://www.amazon.in/...&#10;https://www.flipkart.com/...">${esc(S.bulk.text)}</textarea><p id="bmsg" class="err" role="alert"></p><p><button class="btn pri" type="submit">Make my pins</button></p></form><div id="bout" aria-live="polite"></div>`;
  const out = () => {
    const rows = S.bulk.rows; if (!rows.length) { $('#bout').innerHTML = ''; return; }
    const okRows = rows.filter(r => r.ok && r.title.trim());
    $('#bout').innerHTML = `<div class="row sp rh"><h2>${rows.length} link${rows.length > 1 ? 's' : ''}</h2><span class="row"><button class="btn" id="bcopyall" type="button">Copy all</button><button class="btn" id="bsaveall" type="button">Save all to my pins</button></span></div><div class="plist">${rows.map(bulkRowHtml).join('')}</div>`;
  };
  $('#bf').addEventListener('submit', e => { e.preventDefault();
    const raw = $('#bt').value; S.bulk.text = raw;
    const seen = new Set(), lines = raw.split(/\r?\n/).map(x => x.trim()).filter(x => x && !seen.has(x) && seen.add(x));
    if (!lines.length) { $('#bmsg').textContent = 'Paste at least one link.'; return; }
    $('#bmsg').textContent = lines.length > BULK_MAX ? `Only the first ${BULK_MAX} links were used.` : '';
    S.bulk.rows = lines.slice(0, BULK_MAX).map(x => { const l = PP.parseLink(x); const t = l.ok ? l.slugTitle : ''; return {raw: x, link: l, ok: l.ok, fl: l.ok ? finalLink(l) : null, title: t, cat: PP.detectCategory(t), colour: PP.detectColour(t), style: 0, counter: 0, saved: false}; });
    out();
  });
  const bo = $('#bout');
  bo.addEventListener('input', e => { const el = e.target.closest('[data-bname]'); if (!el) return; const i = +el.closest('[data-r]').dataset.r, r = S.bulk.rows[i]; r.title = el.value; r.cat = PP.detectCategory(r.title); r.colour = PP.detectColour(r.title); r.saved = false; $('#bp' + i).innerHTML = bulkPinHtml(r, i, bulkPin(r)); });
  bo.addEventListener('change', e => { const el = e.target.closest('[data-bstyle]'); if (!el) return; const i = +el.closest('[data-r]').dataset.r, r = S.bulk.rows[i]; r.style = +el.value; r.saved = false; $('#bp' + i).innerHTML = bulkPinHtml(r, i, bulkPin(r)); });
  const savePin = (r, v) => { DB.pins.unshift({id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5), t: Date.now(), title: v.title, store: r.link.store, url: r.fl.url, angle: v.angle, label: v.label, board: v.board, desc: v.description, alt: v.alt, status: 'drafted', clicks: '', earn: '', note: ''}); r.saved = true; };
  bo.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return;
    if (b.id === 'bcopyall') { const t = S.bulk.rows.filter(r => r.ok && r.title.trim()).map(r => bulkText(r, bulkPin(r))).join('\n\n----------\n\n'); return doCopy(b, t, 'All pins'); }
    if (b.id === 'bsaveall') { let n = 0; S.bulk.rows.forEach(r => { const v = r.ok && !r.saved ? bulkPin(r) : null; if (v) { savePin(r, v); n++; } }); save(); updateBadge(); toast(n ? `Saved ${n} pin${n > 1 ? 's' : ''}` : 'Nothing new to save'); return out(); }
    const i = b.dataset.i; if (i === undefined) return; const r = S.bulk.rows[+i], v = r && bulkPin(r); if (!v) return;
    if (b.dataset.bsave !== undefined) { savePin(r, v); save(); updateBadge(); toast('Saved to My pins'); b.textContent = 'Saved ✓'; b.disabled = true; return; }
    const map = {title: v.title, desc: v.description, link: r.fl.url, all: bulkText(r, v)};
    doCopy(b, map[b.dataset.bc], b.dataset.bc === 'all' ? 'Everything' : b.dataset.bc === 'link' ? 'Link' : b.dataset.bc === 'title' ? 'Title' : 'Description'); });
  out();
}

/* ---------- posting plan ---------- */
function renderPlan() {
  const per = DB.prefs.perDay || 2, drafts = DB.pins.filter(p => p.status === 'drafted').slice().reverse();
  const days = []; drafts.forEach((p, i) => { const d = Math.floor(i / per); (days[d] = days[d] || []).push(p); });
  const SHOW = 14, fmt = i => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + i); return d.toLocaleDateString('en-IN', {weekday: 'long', day: 'numeric', month: 'short'}); };
  const dayText = ps => ps.map(p => [p.title, p.desc, p.url ? 'LINK\n' + p.url : ''].filter(Boolean).join('\n\n')).join('\n\n----------\n\n');
  $('#app').innerHTML = `<section class="hero"><h1>Posting plan</h1><p class="mute">Steady posting works better than posting 20 pins in one day. PinProfit spreads your saved, not-yet-posted pins across the coming days, oldest first.</p></section>
  <div class="card row sp"><label for="perday" style="margin:0">Pins per day</label><select id="perday" style="width:auto">${[1, 2, 3, 4, 5].map(n => `<option ${n === per ? 'selected' : ''}>${n}</option>`).join('')}</select><span class="small mute">${drafts.length} pin${drafts.length === 1 ? '' : 's'} waiting · about ${Math.ceil(drafts.length / per)} day${Math.ceil(drafts.length / per) === 1 ? '' : 's'}</span></div>
  ${drafts.length ? days.slice(0, SHOW).map((ps, i) => `<section class="card" data-day="${i}"><div class="row sp"><h2 style="margin:0">${esc(i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : fmt(i))}</h2><button class="btn sm" data-dcopy="${i}" type="button">Copy this day</button></div>
    ${ps.map(p => `<div class="sp-row" data-id="${esc(p.id)}"><div><b>${esc(p.title)}</b><p class="small mute">${esc(p.label)} · Board: ${esc(p.board)}</p></div><div class="row"><button class="btn sm" data-pc="title" type="button">Copy title</button>${p.desc ? '<button class="btn sm" data-pc="desc" type="button">Copy description</button>' : ''}${p.url ? '<button class="btn sm" data-pc="link" type="button">Copy link</button>' : ''}<button class="btn sm pri" data-posted="1" type="button">Mark as posted</button></div></div>`).join('')}</section>`).join('') + (days.length > SHOW ? `<p class="small mute">…and ${drafts.length - SHOW * per} more pins after these ${SHOW} days.</p>` : '')
  : `<div class="empty"><p><b>Nothing waiting to post.</b></p><p>Save pins from Create pins or Many links, and they will show up here.</p><a class="btn pri" href="#/create">Create pins</a></div>`}`;
  $('#perday').addEventListener('change', e => { DB.prefs.perDay = +e.target.value; save(); renderPlan(); });
  $('#app').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.dcopy !== undefined) return doCopy(b, dayText(days[+b.dataset.dcopy]), 'Day plan');
    const row = b.closest('[data-id]'); const p = row && DB.pins.find(x => x.id === row.dataset.id); if (!p) return;
    if (b.dataset.posted) { p.status = 'published'; save(); toast('Marked as posted'); return renderPlan(); }
    const map = {title: p.title, desc: p.desc, link: p.url}; doCopy(b, map[b.dataset.pc], b.dataset.pc === 'desc' ? 'Description' : b.dataset.pc === 'link' ? 'Link' : 'Title'); });
}

/* ---------- home view ---------- */
function renderHome() {
  const feat = [['🔗', 'Paste a link', 'Amazon or Flipkart. PinProfit reads the product name from the link text.'], ['✍️', '5 pin versions', 'Festive, college, minimal, budget and party styles, each with its own title and description.'], ['📋', 'One-click copy', 'Copy the title, description, alt text or everything at once.'], ['🖼️', 'Pin image maker', 'Use your own photo, pick a layout and download a 1000×1500 PNG.'], ['🏷️', 'Affiliate ID added for you', 'Save your ID once and it is added to plain product links.'], ['📈', 'Earnings tracker', 'Log clicks and earnings and see which style works best for you.']];
  const faq = [['Is it free?', 'Yes. It runs in your browser and there is nothing to pay.'], ['Does it use AI or read Amazon pages?', 'No. It builds the text from the product name in the link and what you type, so it never invents prices or product details.'], ['Where is my data stored?', 'Only in your browser on this device. Nothing you type or upload is sent to a server.'], ['Will I earn money?', 'PinProfit saves you time writing pins. It cannot promise clicks or sales, and you still need your own affiliate account.']];
  $('#app').innerHTML = `<section class="hero home"><div class="hcopy"><span class="chip alt">Free · no sign-up · runs in your browser</span><h1>Turn a product link into pins that are ready to post.</h1><p class="lead">Paste an Amazon or Flipkart link. Get five Pinterest pin versions, a pin image and a tracker, all in one place.</p><p class="row"><a class="btn pri big" href="#/create">Create my pins</a><a class="btn big" href="#how">See how it works</a></p></div>
    <div class="hvis" aria-hidden="true"><img class="logo float" src="logo.png" width="200" height="200" alt=""><div class="mock mk1"><b>Pink Cotton Kurti: Everyday Ethnic Outfit Inspiration</b><span>61/100</span></div><div class="mock mk2">Copied ✓</div></div></section>
  <section id="how" class="band rv"><h2>How it works</h2><ol class="steps3"><li><span class="step">1</span><b>Paste</b><span>your product link</span></li><li><span class="step">2</span><b>Copy</b><span>the pin you like best</span></li><li><span class="step">3</span><b>Post</b><span>on Pinterest and track it</span></li></ol></section>
  <section class="rv"><h2>Everything you need to post faster</h2><div class="fgrid">${feat.map((f, i) => `<article class="card feat rv" style="--d:${i * 70}ms"><span class="ico" aria-hidden="true">${f[0]}</span><h3>${esc(f[1])}</h3><p>${esc(f[2])}</p></article>`).join('')}</div></section>
  <section class="rv card honest"><h2>Honest by design</h2><ul><li>No fake AI and no scraping of shop pages.</li><li>A price appears only if you type it.</li><li>The link check says an ID is <b>present</b>, never "verified".</li><li>An affiliate disclosure line is added, as programmes expect.</li></ul></section>
  <section class="rv"><h2>Questions</h2>${faq.map(q => `<details class="faq"><summary>${esc(q[0])}</summary><p>${esc(q[1])}</p></details>`).join('')}</section>
  <section class="rv cta card"><h2>Ready to make your first pin?</h2><a class="btn pri big" href="#/create">Create my pins</a></section>`;
  revealInit();
}
function revealInit() {
  const els = $$('.rv'); const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), {threshold: 0.12});
  els.forEach(e => io.observe(e));
}
(function progress() { const bar = document.createElement('div'); bar.id = 'prog'; bar.setAttribute('aria-hidden', 'true'); document.body.prepend(bar); let t = false;
  const up = () => { t = false; const m = document.documentElement.scrollHeight - innerHeight; bar.style.transform = `scaleX(${m > 0 ? Math.min(1, scrollY / m) : 0})`; };
  addEventListener('scroll', () => { if (!t) { t = true; requestAnimationFrame(up); } }, {passive: true}); })();

/* ---------- router ---------- */
function route() {
  const r = (location.hash.match(/^#\/(\w+)/) || [])[1]; const name = ['home', 'create', 'bulk', 'plan', 'image', 'saved'].includes(r) ? r : 'home';
  $$('.tabs a').forEach(a => a.setAttribute('aria-current', a.dataset.t === name ? 'page' : 'false'));
  const app = $('#app'); const fresh = app.cloneNode(false); app.replaceWith(fresh);   // drops old listeners
  ({home: renderHome, create: renderCreate, bulk: renderBulk, plan: renderPlan, image: renderImage, saved: renderSaved})[name](); window.scrollTo(0, 0);
  document.title = name === 'home' ? 'PinProfit – Turn a product link into ready-to-post Pinterest pins' : ({create: 'Create pins', bulk: 'Many links', plan: 'Posting plan', image: 'Pin image', saved: 'My pins'})[name] + ' – PinProfit';
}
load(); updateBadge(); window.addEventListener('hashchange', route); route();

if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));

(function themeBtn() { const b = $('#themeBtn'); if (!b || !window.PPTheme) return; const L = {auto: 'Auto', light: 'Light', dark: 'Dark'}, ICON = {auto: '◐', light: '☀', dark: '☾'};
  const show = () => { const v = PPTheme.get(); b.textContent = ICON[v] + ' ' + L[v]; b.setAttribute('aria-label', 'Colour mode: ' + L[v] + '. Press to change.'); };
  b.addEventListener('click', () => { const v = PPTheme.get(); PPTheme.set(v === 'auto' ? 'light' : v === 'light' ? 'dark' : 'auto'); show(); });
  show(); })();
