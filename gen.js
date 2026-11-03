'use strict';
/* PinProfit generator: pure functions, no network. Everything is built from what the user types or what is visible in the link itself.
   Nothing here claims facts about a product (fabric, price, quality) unless the user supplied them. */
const PP = (() => {
  const COLOURS = ['sky blue', 'black', 'white', 'red', 'maroon', 'pink', 'peach', 'coral', 'orange', 'yellow', 'mustard', 'green', 'olive', 'mint', 'teal', 'blue', 'navy', 'purple', 'lavender', 'beige', 'cream', 'brown', 'grey', 'gold', 'silver', 'multicolor'];
  const DESCRIPTORS = ['anarkali', 'straight', 'a-line', 'printed', 'floral', 'embroidered', 'cotton', 'linen', 'silk', 'rayon', 'georgette', 'chiffon', 'striped', 'solid', 'checked', 'oversized', 'flared', 'pleated', 'ruffle', 'denim', 'velvet', 'knit'];
  const CATS = [
    {id: 'coord', noun: 'co-ord set', re: /co-?ord/i, tag: 'coordset', kw: ['co-ord set for women', 'coord set outfit', 'matching set outfit']},
    {id: 'kurti', noun: 'kurti', re: /\bkurt(i|a)s?\b/i, tag: 'kurti', ethnic: true, kw: ['kurti for women', 'kurti designs', 'indian ethnic wear']},
    {id: 'lehenga', noun: 'lehenga', re: /\b(lehenga|ghagra)s?\b/i, tag: 'lehenga', ethnic: true, kw: ['lehenga for women', 'lehenga outfit ideas', 'indian ethnic wear']},
    {id: 'saree', noun: 'saree', re: /\b(saree|sari|saris|sarees)\b/i, tag: 'saree', ethnic: true, kw: ['saree for women', 'saree styling ideas', 'indian ethnic wear']},
    {id: 'dress', noun: 'dress', re: /\b(dress|dresses|gown|maxi)\b/i, tag: 'dress', kw: ['dress for women', 'dress outfit ideas', 'casual dress']},
    {id: 'jumpsuit', noun: 'jumpsuit', re: /\b(jumpsuit|playsuit)s?\b/i, tag: 'jumpsuit', kw: ['jumpsuit for women', 'jumpsuit outfit ideas', 'casual outfit']},
    {id: 'jeans', noun: 'jeans', re: /\b(jeans|denim)\b/i, tag: 'jeans', kw: ['jeans for women', 'jeans outfit ideas', 'casual outfit']},
    {id: 'skirt', noun: 'skirt', re: /\bskirts?\b/i, tag: 'skirt', kw: ['skirt for women', 'skirt outfit ideas', 'casual outfit']},
    {id: 'jacket', noun: 'jacket', re: /\b(jacket|shrug|hoodie|sweatshirt|cardigan)s?\b/i, tag: 'jacket', kw: ['jacket for women', 'layering outfit ideas', 'casual outfit']},
    {id: 'pants', noun: 'pants', re: /\b(palazzo|pants?|trousers?)\b/i, tag: 'pants', kw: ['pants for women', 'trousers outfit ideas', 'casual outfit']},
    {id: 'top', noun: 'top', re: /\b(tops?|shirt|blouse|tunic|tee|t-shirt)s?\b/i, tag: 'topsforwomen', kw: ['tops for women', 'top outfit ideas', 'casual outfit']},
    {id: 'other', noun: 'outfit', re: /$^/, tag: 'womensfashion', kw: ['outfit ideas for women', 'women fashion', 'casual outfit']},
  ];
  const ANGLES = [
    {id: 'festive', label: 'Festive and occasion', board: 'Festive Outfit Ideas', tag: 'festiveoutfit', kw: ['festive outfit ideas', 'festival wear for women'],
      titles: {e: ['{Short} for Festive Outfit Ideas', 'Festive {Short} Look You Can Style Easily', '{Short}: Elegant Festive Outfit Inspiration'], w: ['{Short} for Festive Party Outfit Ideas', 'Festive {Short} Look: Easy Styling Inspiration', '{Short}: Festive Season Outfit Inspiration']},
      hooks: ['Looking for a festive outfit that feels dressed up without being heavy? This {short} is an easy pick.', 'A {short} like this makes festive dressing simple.', 'Festive season outfit idea: a {short} that is easy to style.'],
      styling: {e: ['Pair it with jhumkas and a neat bun for a polished look.', 'Add gold jewellery and juttis to finish the outfit.', 'Keep makeup soft and let the outfit stand out.'], w: ['Add statement earrings and block heels for an evening-ready look.', 'Layer simple gold jewellery and carry a small bag.', 'Keep everything else neutral so the {short} is the focus.']}},
    {id: 'college', label: 'College and everyday', board: 'College Outfits', tag: 'collegeoutfit', kw: ['college outfit ideas', 'everyday outfit ideas'],
      titles: {e: ['{Short} for College Outfit Ideas', 'Easy College Look with a {Short}', '{Short}: Everyday Ethnic Outfit Inspiration'], w: ['{Short} for College Outfit Ideas', 'Easy College Look with a {Short}', '{Short}: Everyday Outfit Inspiration for College']},
      hooks: ['Need an outfit for college that is easy to wear and still looks put together? Try a {short}.', 'College outfit idea: a {short} you can wear on repeat.', 'An easy {short} look for classes, cafes and everything in between.'],
      styling: {e: ['Pair it with flats and a tote bag for class.', 'Add a sling bag and small earrings for a quick, easy look.', 'Easy to style with minimal accessories.'], w: ['Pair it with sneakers and a tote bag.', 'Add a sling bag and simple earrings for a quick look.', 'Easy to style with minimal accessories.']}},
    {id: 'minimal', label: 'Minimal and clean', board: 'Minimal Fashion', tag: 'minimalfashion', kw: ['minimal fashion', 'simple outfit ideas for women'],
      titles: {e: ['Minimal {Short} Outfit Idea', 'Clean and Simple {Short} Styling', '{Short}: Minimal Indian Fashion'], w: ['Minimal {Short} Outfit Idea', 'Clean and Simple {Short} Styling', '{Short}: Minimal Everyday Fashion']},
      hooks: ['Minimal outfits are easy to repeat and easy to style, and this {short} fits right in.', 'Simple, clean and easy: a {short} for a minimal wardrobe.', 'If you like a clean, understated look, a {short} is a good place to start.'],
      styling: {e: ['Keep accessories small and colours matching.', 'Stick to one or two neutral colours for a clean finish.', 'Small earrings and a simple watch are enough.'], w: ['Keep accessories small and colours matching.', 'Stick to one or two neutral colours for a clean finish.', 'Small earrings and a simple watch are enough.']}},
    {id: 'budget', label: 'Budget find', board: 'Budget Fashion Finds', tag: 'budgetfashion', kw: ['budget fashion', 'affordable outfits'],
      titles: {e: ['Affordable {Short} Outfit Idea', 'Budget-Friendly {Short} Find', '{Short}: Outfit Idea Without Spending Much'], w: ['Affordable {Short} Outfit Idea', 'Budget-Friendly {Short} Find', '{Short}: Outfit Idea Without Spending Much']},
      hooks: ['Good outfits do not have to cost a lot, and this {short} is a find worth a look.', 'Budget fashion find: a {short} to check out.', 'Looking for an affordable {short}? Here is one to consider.'],
      styling: {e: ['Mix it with pieces you already own to make more looks.', 'One {noun} can be styled in several ways.', 'Pair it with basics from your wardrobe.'], w: ['Mix it with pieces you already own to make more looks.', 'One {noun} can be styled in several ways.', 'Pair it with basics from your wardrobe.']}},
    {id: 'party', label: 'Party and date night', board: 'Party Wear Ideas', tag: 'partyoutfit', kw: ['party wear for women', 'date night outfit ideas'],
      titles: {e: ['{Short} for Wedding Guest Outfit Ideas', 'Evening-Ready {Short} Look', '{Short}: Dressy Outfit Inspiration'], w: ['{Short} for Party and Date Night Ideas', 'Date Night {Short} Look', '{Short}: Going-Out Outfit Inspiration']},
      hooks: ['Dressing up for an event? This {short} is a good starting point.', 'Evening outfit idea: a {short} that suits dressy occasions.', 'A {short} can go from day to dinner with a few changes.'],
      styling: {e: ['Add a clutch and statement earrings for an evening finish.', 'Style it with heels or embellished flats and sleek hair.', 'Let the {short} do the talking and keep accessories graceful.'], w: ['Pair it with heels and a small clutch.', 'Add bold earrings and sleek hair for date night.', 'A bold lip and simple jewellery complete the look.']}},
  ];
  const CTA = ['Tap to see details and the current price.', 'Open the link to see sizes, colours and the latest price.', 'Check the link for details and the current price.'];

  const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const rng = seed => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const pick = (arr, r) => arr[Math.floor(r() * arr.length)];
  const titleCase = s => s.replace(/\b([a-z])([a-z']*)/gi, (_, a, b) => a.toUpperCase() + b.toLowerCase());
  const clean = s => String(s || '').replace(/\s+/g, ' ').trim();
  const trimTo = (s, n) => { if (s.length <= n) return s; const cut = s.slice(0, n - 1); return cut.replace(/\s+\S*$/, '') + '…'; };

  /* ---------- link reading (no network: only what is visible in the URL) ---------- */
  function titleFromSlug(seg) {
    if (!seg) return '';
    let t; try { t = decodeURIComponent(seg); } catch (e) { t = seg; }
    t = t.replace(/[-_+]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (!/[a-z]{3}/i.test(t) || /^[A-Z0-9]{10}$/.test(t)) return '';
    return trimTo(titleCase(t), 90);
  }
  function parseLink(raw) {
    const out = {ok: false, store: 'other', host: '', slugTitle: '', tag: '', issues: []};
    let s = clean(raw); if (!s) return out;
    if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) s = 'https://' + s;
    let u; try { u = new URL(s); } catch (e) { out.issues.push({level: 'error', msg: 'This does not look like a valid link. Copy the full address from the shop page.'}); return out; }
    if (!/^https?:$/.test(u.protocol)) { out.issues.push({level: 'error', msg: 'Only http and https links are supported.'}); return out; }
    const host = u.hostname.replace(/^www\./, '').toLowerCase(); out.host = host; out.ok = true; out.url = u.toString();
    const parts = u.pathname.split('/').filter(Boolean), q = u.searchParams;
    const short = /^(amzn\.(to|in|eu)|a\.co|fkrt\.(cc|it)|dl\.flipkart\.com|ajiio\.in|myntr\.in|msho\.in)$/.test(host);
    if (/(^|\.)amazon\.[a-z.]+$/.test(host) || /^amzn\./.test(host) || host === 'a.co') {
      out.store = 'amazon';
      const i = parts.findIndex(p => p === 'dp' || p === 'product');
      if (i > 0 && !/^(gp|dp|product)$/.test(parts[i - 1])) out.slugTitle = titleFromSlug(parts[i - 1]);
      out.tag = q.get('tag') || '';
    } else if (/flipkart\.com$/.test(host) || host === 'fkrt.cc' || host === 'fkrt.it') {
      out.store = 'flipkart';
      const i = parts.findIndex(p => p === 'p'); if (i > 0) out.slugTitle = titleFromSlug(parts[i - 1]);
      out.tag = q.get('affid') || '';
    } else if (/meesho\.com$/.test(host) || host === 'msho.in') {
      out.store = 'meesho'; const i = parts.findIndex(p => p === 'p'); if (i > 0) out.slugTitle = titleFromSlug(parts[i - 1]);
    } else if (/myntra\.com$/.test(host) || host === 'myntr.in') {
      out.store = 'myntra'; const i = parts.findIndex(p => /^\d{5,}$/.test(p)); if (i > 0) out.slugTitle = titleFromSlug(parts[i - 1]);
    } else {
      out.issues.push({level: 'info', msg: 'This shop is not recognised. You can still generate pins, but the affiliate link cannot be checked.'});
    }
    out.short = short;
    if (short) out.issues.push({level: 'info', msg: 'This is a short link, so the product name cannot be read from it. Type the product name below.'});
    return out;
  }
  /* Affiliate tag check. myIds = {amazon, flipkart}. Never claims a link is "verified": only that a tag is present or missing. */
  function checkAffiliate(link, myIds) {
    const r = [], my = myIds || {};
    if (!link.ok) return r;
    if (link.store === 'amazon' && !link.short) {
      if (!link.tag) r.push({level: 'warn', msg: 'No affiliate tag found in this Amazon link (it should contain tag=your-id). If you post it as is, you may not be paid.'});
      else if (my.amazon && link.tag !== my.amazon) r.push({level: 'warn', msg: `This link has the tag "${link.tag}", which is different from the tag you saved ("${my.amazon}").`});
      else r.push({level: 'ok', msg: `An affiliate tag (${link.tag}) is present. PinProfit cannot confirm it is active; check it in your Associates account.`});
    } else if (link.store === 'flipkart' && !link.short) {
      if (!link.tag) r.push({level: 'warn', msg: 'No affiliate ID found in this Flipkart link (it should contain affid=your-id). You may not be paid for sales from it.'});
      else if (my.flipkart && link.tag !== my.flipkart) r.push({level: 'warn', msg: `This link has the affiliate ID "${link.tag}", which is different from the one you saved ("${my.flipkart}").`});
      else r.push({level: 'ok', msg: `An affiliate ID (${link.tag}) is present. PinProfit cannot confirm it is active.`});
    } else if (link.short) {
      r.push({level: 'warn', msg: 'Short links hide the affiliate ID, so it cannot be checked here. Make sure it is your own affiliate short link.'});
    }
    return r;
  }

  /* ---------- reading the product name ---------- */
  function detectCategory(title) { return (CATS.find(c => c.id !== 'other' && c.re.test(title)) || CATS[CATS.length - 1]).id; }
  function detectColour(title) { const t = ' ' + title.toLowerCase().replace(/[-_]/g, ' ') + ' '; return COLOURS.find(c => t.includes(' ' + c + ' ')) || ''; }
  function detectDescriptors(title) { const t = ' ' + title.toLowerCase() + ' '; return DESCRIPTORS.map(d => [t.indexOf(' ' + d + ' '), d]).filter(x => x[0] >= 0).sort((a, b) => a[0] - b[0]).slice(0, 2).map(x => x[1]); }
  function shortName(title, catId, colour) {
    const cat = CATS.find(c => c.id === catId) || CATS[CATS.length - 1];
    const ds = detectDescriptors(title).filter(d => d !== colour);
    const parts = [colour, ...ds, cat.noun].filter(Boolean);
    return parts.join(' ');
  }
  const priceBucket = p => { const n = Math.round(Number(p)); if (!(n > 0)) return 0; return [299, 399, 499, 599, 699, 799, 999, 1299, 1499, 1999, 2499, 2999, 3999, 4999].find(b => b >= n) || 0; };

  /* ---------- generating pins ---------- */
  function generate(inp) {
    const title = clean(inp.title), catId = inp.category || detectCategory(title), cat = CATS.find(c => c.id === catId) || CATS[CATS.length - 1];
    const colour = clean(inp.colour).toLowerCase(), details = clean(inp.details).replace(/[.\s]+$/, ''), counter = inp.counter || 0;
    const e = cat.ethnic ? 'e' : 'w', short = shortName(title, cat.id, colour), Short = titleCase(short);
    const bucket = priceBucket(inp.price);
    const disclosure = inp.disclosure ? clean(inp.disclosure) : '';
    const fill = s => s.replace(/\{Short\}/g, Short).replace(/\{short\}/g, short).replace(/\{noun\}/g, cat.noun);
    const seedBase = hash(title + '|' + catId + '|' + colour);
    return ANGLES.map(a => {
      const r = rng(seedBase ^ hash(a.id + counter));
      const ttl = trimTo(fill(pick(a.titles[e], r)), 100);
      const hook = fill(pick(a.hooks, r));
      const styles = a.styling[e].map(fill); const s1 = pick(styles, r);
      const detailLine = details ? `Details: ${details}.` : '';
      const priceLine = bucket && (a.id === 'budget' || inp.alwaysPrice) ? `Under ₹${bucket.toLocaleString('en-IN')} at the time of posting.` : '';
      const cta = pick(CTA, r);
      const tags = Array.from(new Set(['#' + cat.tag, cat.ethnic ? '#indianfashion' : '#outfitideas', '#' + a.tag, colour ? '#' + colour.replace(/\s+/g, '') + 'outfit' : '#' + (cat.ethnic ? 'ethnicwear' : 'fashioninspo')])).slice(0, 5);
      const body = [hook, detailLine, s1, priceLine, cta].filter(Boolean);
      let desc = body.join(' ');
      const tail = (disclosure ? '\n\n' + disclosure : '') + '\n\n' + tags.join(' ');
      if ((desc + tail).length > 500) desc = body.filter(x => x !== s1).join(' ');       // drop the styling line first
      if ((desc + tail).length > 800) desc = trimTo(desc, 800 - tail.length);
      const description = desc + tail;
      const alt = trimTo(`${Short} outfit idea. ${a.label} styling inspiration.`, 500);
      const keywords = Array.from(new Set([(colour ? colour + ' ' : '') + cat.noun + ' for women', ...cat.kw, ...a.kw])).slice(0, 6);
      const text = `TITLE\n${ttl}\n\nDESCRIPTION\n${description}\n\nALT TEXT\n${alt}\n\nBOARD\n${a.board}\n\nKEYWORDS\n${keywords.join(', ')}`;
      return {angle: a.id, label: a.label, title: ttl, description, hashtags: tags, alt, board: a.board, keywords, text};
    });
  }
  const DISCLOSURES = {
    general: 'Affiliate link: I may earn a small commission if you buy, at no extra cost to you.',
    amazon: 'As an Amazon Associate I earn from qualifying purchases.',
  };
  return {generate, parseLink, checkAffiliate, detectCategory, detectColour, shortName, priceBucket, titleFromSlug, CATS, ANGLES, DISCLOSURES, COLOURS};
})();
if (typeof module !== 'undefined' && module.exports) module.exports = PP;
