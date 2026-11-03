# PinProfit

Paste an Amazon or Flipkart product link and get 5 ready-to-post Pinterest pin versions (title, description, hashtags, alt text, board, keywords) with one-click copy. Then make the pin image from your own photo, and track what each pin earns.

![Create pins](docs/create.png)
![Pin image maker](docs/image.png)
![My pins](docs/saved.png)

## Honest by design
- No AI and no scraping: the product name comes from the link text; you add colour, details and price.
- Price appears only if you type it, as "Under ₹X at the time of posting".
- The link checker only says an affiliate tag is **present**, never "verified".
- Affiliate disclosure is added to each description (you can edit it).
- Everything is stored in your browser (localStorage). Nothing is uploaded.

Pinterest limits: title up to 100 characters, description up to 800 (about 500 reads best), alt text up to 500.

## Run / test
Static site, no build. `node tests/unit.js` (27) and `python3 tests/e2e.py` (17, needs Playwright).
Deploy on Vercel: Framework "Other", no build command.
