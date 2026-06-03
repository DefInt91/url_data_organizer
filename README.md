# URL Data Organizer Web

A small static Web UI for organizing useful information from a URL or pasted page text.

## Scope

- Paste a URL and try to fetch readable page text.
- Paste page text directly when a site blocks browser fetch requests.
- Extract a short summary, locations, product-like lines, prices, uses, and source URL.
- Show a structured JSON result for copying into notes or task descriptions.

## Files

- `index.html`: App structure.
- `style.css`: Visual layout and responsive design.
- `script.js`: Fetch, extraction, rendering, and copy behavior.

## Run

Open `index.html` in a browser.

Many websites block direct browser fetches with CORS rules. When that happens, paste the page text into the text area and run the organizer again.
