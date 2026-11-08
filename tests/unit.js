'use strict';
const assert = require('assert'), PP = require('../gen.js');
let n = 0; const t = (name, f) => { try { f(); n++; } catch (e) { console.log('FAIL', name, '\n  ', e.message); process.exitCode = 1; } };
const AMZ = 'https://www.amazon.in/Women-Pink-Cotton-Printed-Straight-Kurti/dp/B09XYZ1234/ref=sr_1_1?tag=mytag-21';
const FK = 'https://www.flipkart.com/women-printed-pure-cotton-anarkali-kurta/p/itm123abc?pid=KTAXYZ&affid=myid';
t('amazon slug read from URL', () => { const l = PP.parseLink(AMZ); assert.strictEqual(l.store, 'amazon'); assert.strictEqual(l.slugTitle, 'Women Pink Cotton Printed Straight Kurti'); assert.strictEqual(l.tag, 'mytag-21'); });
t('flipkart slug read from URL', () => { const l = PP.parseLink(FK); assert.strictEqual(l.store, 'flipkart'); assert.strictEqual(l.slugTitle, 'Women Printed Pure Cotton Anarkali Kurta'); assert.strictEqual(l.tag, 'myid'); });
t('amazon link with no slug gives no title (nothing invented)', () => assert.strictEqual(PP.parseLink('https://www.amazon.in/dp/B09XYZ1234').slugTitle, ''));
t('short links are flagged, not guessed', () => { const l = PP.parseLink('https://amzn.to/3abcXYZ'); assert(l.short && l.slugTitle === ''); assert(PP.checkAffiliate(l, {}).some(i => /Short links/.test(i.msg))); });
t('missing amazon tag warns', () => assert(PP.checkAffiliate(PP.parseLink('https://www.amazon.in/Pink-Kurti/dp/B09XYZ1234'), {}).some(i => i.level === 'warn' && /may not be paid/.test(i.msg))));
t('tag mismatch with saved tag warns', () => assert(PP.checkAffiliate(PP.parseLink(AMZ), {amazon: 'other-21'}).some(i => i.level === 'warn' && /different/.test(i.msg))));
t('matching tag is OK but never "verified"', () => { const r = PP.checkAffiliate(PP.parseLink(AMZ), {amazon: 'mytag-21'}); assert(r[0].level === 'ok' && /cannot confirm/.test(r[0].msg) && !/verified/i.test(r[0].msg)); });
t('flipkart missing affid warns', () => assert(PP.checkAffiliate(PP.parseLink('https://www.flipkart.com/x-kurta/p/itm1'), {}).some(i => i.level === 'warn')));
t('invalid links rejected', () => { ['not a url at all', 'javascript:alert(1)', 'ftp://x.com/a'].forEach(x => assert(!PP.parseLink(x).ok, x)); });
t('link without scheme is accepted', () => assert(PP.parseLink('amazon.in/Pink-Kurti/dp/B09XYZ1234').ok));
t('category/colour/short name from title', () => { const ti = 'Women Pink Cotton Printed Straight Kurti'; assert.strictEqual(PP.detectCategory(ti), 'kurti'); assert.strictEqual(PP.detectColour(ti), 'pink'); assert.strictEqual(PP.shortName(ti, 'kurti', 'pink'), 'pink printed cotton kurti'.replace('printed cotton', 'cotton printed')); });
t('categories', () => { const m = {'Floral Maxi Dress': 'dress', 'Navy Blue Co-ord Set': 'coord', 'Silk Saree With Blouse': 'saree', 'Mom Fit Jeans': 'jeans', 'Crop Top': 'top', 'Something Else': 'other'}; Object.keys(m).forEach(k => assert.strictEqual(PP.detectCategory(k), m[k], k)); });
t('two-word colour', () => assert.strictEqual(PP.detectColour('Sky Blue Cotton Top'), 'sky blue'));
const base = {title: 'Women Pink Cotton Printed Straight Kurti', category: 'kurti', colour: 'pink', details: '', price: '', disclosure: PP.DISCLOSURES.general, counter: 0};
t('five different angles with different titles', () => { const v = PP.generate(base); assert.strictEqual(v.length, 5); assert.strictEqual(new Set(v.map(x => x.title)).size, 5); assert.strictEqual(new Set(v.map(x => x.description)).size, 5); });
t('Pinterest limits: title <=100, description <=800', () => { ['kurti', 'dress', 'saree'].forEach(c => PP.generate({...base, category: c, details: 'x '.repeat(120)}).forEach(v => { assert(v.title.length <= 100); assert(v.description.length <= 800, v.description.length); assert(v.alt.length <= 500); })); });
t('normal descriptions stay within the 500 sweet spot', () => PP.generate(base).forEach(v => assert(v.description.length <= 500, v.description.length + ' ' + v.angle)));
t('no price mentioned unless the user gave one', () => PP.generate(base).forEach(v => assert(!/₹|under \d/i.test(v.description), v.description)));
t('price appears as a rounded "Under" bucket on the budget pin, with a time caveat', () => { const b = PP.generate({...base, price: '649'}).find(v => v.angle === 'budget'); assert(/Under ₹699 at the time of posting/.test(b.description), b.description); });
t('details typed by the user are used; none invented', () => { assert(PP.generate({...base, details: 'cotton, 3/4 sleeves'}).every(v => v.description.includes('Details: cotton, 3/4 sleeves.'))); assert(PP.generate(base).every(v => !/Details:/.test(v.description))); });
t('no unverifiable superlatives', () => PP.generate({...base}).forEach(v => assert(!/\b(best|cheapest|guaranteed|#1|perfect fit|100%)\b/i.test(v.text), v.text)));
t('disclosure included when given and omitted when empty', () => { assert(PP.generate(base).every(v => v.description.includes('Affiliate link:'))); assert(PP.generate({...base, disclosure: ''}).every(v => !/Affiliate/.test(v.description))); });
t('hashtags: max 5, unique, start with #, no spaces', () => PP.generate(base).forEach(v => { assert(v.hashtags.length <= 5 && new Set(v.hashtags).size === v.hashtags.length); v.hashtags.forEach(h => assert(/^#[a-z0-9]+$/.test(h), h)); }));
t('same input gives same output; regenerate changes wording', () => { assert.deepStrictEqual(PP.generate(base), PP.generate(base)); const a = PP.generate(base).map(x => x.description).join(), b = PP.generate({...base, counter: 1}).map(x => x.description).join(); assert.notStrictEqual(a, b); });
t('ethnic vs western wording differs', () => { const k = PP.generate(base).map(x => x.description).join(' '), d = PP.generate({...base, title: 'Floral Maxi Dress', category: 'dress', colour: 'blue'}).map(x => x.description).join(' '); assert(!/jhumka|jutti/i.test(d)); assert(/\bdress\b/.test(d) && /kurti/.test(k)); });
t('copy-all text contains every field', () => { const v = PP.generate(base)[0]; ['TITLE', 'DESCRIPTION', 'ALT TEXT', 'BOARD', 'KEYWORDS'].forEach(h => assert(v.text.includes(h))); assert(v.text.includes(v.title) && v.text.includes(v.description)); });
t('price buckets', () => { assert.strictEqual(PP.priceBucket('649'), 699); assert.strictEqual(PP.priceBucket('999'), 999); assert.strictEqual(PP.priceBucket('1000'), 1299); assert.strictEqual(PP.priceBucket('abc'), 0); assert.strictEqual(PP.priceBucket('-5'), 0); });
t('hostile input does not break generation', () => { const v = PP.generate({...base, title: '<script>alert(1)</script> ' + 'A'.repeat(500), details: '"><img src=x>', colour: '"><b>'}); assert.strictEqual(v.length, 5); v.forEach(x => assert(x.title.length <= 100)); });
t('applyTag adds own ID to plain Amazon link', () => { const l = PP.parseLink('https://www.amazon.in/Women-Pink-Kurti/dp/B09XYZ1234'); const r = PP.applyTag(l, {amazon: 'me-21'}); assert(r.added && /[?&]tag=me-21/.test(r.url)); });
t('applyTag never overwrites an existing tag', () => { const l = PP.parseLink('https://www.amazon.in/x/dp/B09XYZ1234?tag=other-21'); const r = PP.applyTag(l, {amazon: 'me-21'}); assert(!r.added && r.url.includes('other-21') && !r.url.includes('me-21')); });
t('applyTag: Flipkart, short links, bad ids, no id', () => { const f = PP.parseLink('https://www.flipkart.com/some-kurti/p/itm123'); assert(/affid=fk1/.test(PP.applyTag(f, {flipkart: 'fk1'}).url)); assert(!PP.applyTag(PP.parseLink('https://amzn.to/abc123'), {amazon: 'me-21'}).added); const l = PP.parseLink('https://www.amazon.in/x/dp/B09XYZ1234'); assert(!PP.applyTag(l, {amazon: 'a"><b>'}).added); assert(!PP.applyTag(l, {}).added); });

/* ---------- seasons and festivals ---------- */
const Studio = require('../studio.js');
const SEASON_IDS = ['diwali', 'wedding', 'rakhi', 'navratri', 'eid', 'xmas', 'sale'];
const BAD_CLAIMS = /limited|hurry|last chance|only \d+ left|few left|selling fast|today only|ends (today|soon|tonight)|\d+ ?% ?off|flat \d|discount|deal|offer|sale price|lowest price|cheap|price drop|grab|don't miss|dont miss|running out|stock|before it'?s gone|best|guaranteed|#1|100%/i;
t('season list is exactly the seven requested', () => assert.deepStrictEqual([...PP.SEASON_IDS].sort(), [...SEASON_IDS].sort()));
t('no season (empty, missing, unknown) leaves output byte-for-byte unchanged', () => { const a = JSON.stringify(PP.generate(base)); ['', undefined, null, 'none', 'bogus', '__proto__'].forEach(x => assert.strictEqual(JSON.stringify(PP.generate({...base, season: x})), a, String(x))); });
t('golden: normal first pin did not change', () => { const v = PP.generate(base)[0]; assert.strictEqual(v.title, 'Pink Cotton Printed Kurti: Elegant Festive Outfit Inspiration'); assert.strictEqual(v.board, 'Festive Outfit Ideas'); assert(!('season' in v)); });
SEASON_IDS.forEach(id => {
  const se = PP.SEASONS[id];
  t(id + ': five pins, distinct titles, season board, limits respected', () => {
    [0, 1, 2, 3].forEach(counter => ['kurti', 'dress', 'saree', 'jeans', 'other'].forEach(cat => {
      const v = PP.generate({...base, category: cat, season: id, counter});
      assert.strictEqual(v.length, 5); assert.strictEqual(new Set(v.map(x => x.title)).size, 5, id + cat + counter);
      v.forEach(x => { assert.strictEqual(x.season, id); assert.strictEqual(x.board, se.board); assert(x.title.length <= 100 && x.description.length <= 500 && x.alt.length <= 500 && x.keywords.length <= 6, x.title);
        assert(x.text.includes(x.title) && x.text.includes(x.alt) && x.text.includes(se.board)); });
    }));
  });
  t(id + ': copy, hashtags and alt text mention the season', () => PP.generate({...base, season: id}).forEach(x => {
    assert(x.title.toLowerCase().includes(se.S.toLowerCase()) || x.title.toLowerCase().includes(se.EV.toLowerCase()), x.title);
    assert(x.alt.includes(se.S), x.alt); assert(se.tags.every(h => x.hashtags.includes(h)), x.hashtags.join());
    assert(x.hashtags.length <= 5 && new Set(x.hashtags).size === x.hashtags.length && x.hashtags.every(h => /^#[a-z0-9]+$/.test(h)), x.hashtags.join());
    assert(x.keywords.some(k => /\w/.test(k)));
  }));
  t(id + ': no invented discounts, urgency or superlatives in any output', () => {
    [0, 1, 2, 3, 4, 5].forEach(counter => ['kurti', 'dress', 'saree', 'coord', 'other'].forEach(cat => PP.generate({...base, category: cat, season: id, counter, details: 'cotton, 3/4 sleeves', price: '649'}).forEach(x => assert(!BAD_CLAIMS.test(x.text), id + ': ' + x.text))));
    [...se.badges, ...se.ctas, ...Object.values(se.styling).flat(), se.board, se.altTail].forEach(x => assert(!BAD_CLAIMS.test(x), x));
  });
  t(id + ': price only when the user typed one, still a rounded "Under" line', () => {
    assert(PP.generate({...base, season: id}).every(x => !/₹|under \d/i.test(x.text)));
    const b = PP.generate({...base, season: id, price: '649'}).find(x => x.angle === 'budget'); assert(/Under ₹699 at the time of posting\./.test(b.description));
  });
  t(id + ': deterministic, and regenerate changes the wording', () => { const a = PP.generate({...base, season: id}); assert.deepStrictEqual(a, PP.generate({...base, season: id})); assert.notDeepStrictEqual(a.map(x => x.title), PP.generate({...base, season: id, counter: 1}).map(x => x.title)); });
  t(id + ': disclosure kept, details kept, hostile input safe', () => {
    PP.generate({...base, season: id, details: 'cotton'}).forEach(x => assert(x.description.includes('Affiliate link:') && x.description.includes('Details: cotton.')));
    const v = PP.generate({...base, season: id, title: '<script>alert(1)</script> ' + 'A'.repeat(500), details: 'x '.repeat(200), colour: '"><b>'}); assert.strictEqual(v.length, 5); v.forEach(x => assert(x.title.length <= 100 && x.description.length <= 800));
  });
  t(id + ': studio colours, badge and CTA suggestions are usable', () => {
    const th = Studio.SEASON_THEMES[id]; assert(th, 'no studio theme'); 
    const lum = h => { const c = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(v => v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4)); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
    const cr = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
    assert(cr(th.accent, th.onAccent) >= 4.5, 'badge text contrast ' + cr(th.accent, th.onAccent)); assert(cr(th.bg, th.fg) >= 7, 'headline contrast ' + cr(th.bg, th.fg));
    assert(se.badges.length >= 3 && se.badges.every(x => x.length <= 24), 'badges (input maxlength 24)'); assert(se.ctas.length >= 3 && se.ctas.every(x => x.length <= 30), 'ctas (input maxlength 30)');
  });
});
t('studio: base colour list is unchanged and season colours are separate', () => { assert.deepStrictEqual(Object.keys(Studio.THEMES), ['rose', 'cream', 'forest', 'ink', 'lilac']); SEASON_IDS.forEach(id => assert(!Studio.THEMES[id])); });
t('season pins carry no leftover angle hashtag from another occasion', () => PP.generate({...base, season: 'diwali'}).forEach(x => assert(!/#(collegeoutfit|festiveoutfit|partyoutfit)/.test(x.hashtags.join(' ')))));
console.log('unit tests passed:', n);
