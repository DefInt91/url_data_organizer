---
name: url-wishlist-organizer
description: Use this skill whenever the user provides shopping, product, Reel, Instagram, Facebook, YouTube, TikTok, or other URL sources to organize into a Google Sheet WishList; whenever the user says there are newly added unanalyzed URLs; or whenever product usage, purchase location, multi-product ranking, confidence, notes, or URL-to-shopping-list cleanup is needed. This skill analyzes one or many URLs, extracts product names, stores, usage, zh-TW summaries, confidence, source URLs, and writes or updates rows in the WishList sheet.
---

# URL WishList Organizer

Use this skill to turn one or more URL sources into structured shopping-list rows in the user's Google Sheet dashboard.

The current project uses:

- Spreadsheet ID: `14SOy9cYWMA9u0F-f2co5nEEDJvF94CAuXNx9ETLR3no`
- Sheet name: `WishList`
- Apps Script Web App endpoint: use the endpoint configured in the project dashboard `API_URL`
- Frontend project: `url_data_organizer_web`

## Core Goal

When the user gives URLs or says there are newly added unanalyzed URLs:

1. Find the pending URLs.
2. Analyze each URL for products.
3. Split multi-product URLs into separate rows.
4. Write zh-TW purchase-list data back to Google Sheet.
5. Preserve uncertainty through `confidence` and `notes`.
6. Read back the updated rows to verify.

## Trigger Phrases

Use this skill when the user says anything similar to:

- `有新增 URL`
- `有新增未分析 URL`
- `分析這些 URL`
- `整理這個 Reel 的商品`
- `這個 URL 內有哪些商品`
- `把這些商品加入清單`
- `補用途不明的商品`
- `找出相同商品並補資料`
- `加入購物清單`

## Sheet Schema

Write rows using these fields:

```text
item_id
status
store
product_name
product_name_zh
price
currency
product_code
usage_zh
summary_zh
source_url
platform
creator
confidence
notes
created_at
updated_at
```

Do not invent new column names unless the user approves a schema change.

## Status Rules

Use:

```text
to_review  = newly added or still needs review
want       = user wants to buy
compare    = useful but needs comparison or product-page confirmation
bought     = purchased
skipped    = should not be purchased
deleted    = soft-deleted, hidden by default in dashboard
```

Never physically delete Google Sheet rows unless the user explicitly asks and confirms deletion. Prefer soft delete with `status = deleted`.

## Confidence Rules

Use `high` when:

- Product name is clear, and
- Usage is clear, and
- Store, official page, seller page, JAN/product code, or description supports the conclusion.

Use `medium` when:

- Product direction is clear, but exact model, seller page, price, or variant still needs confirmation.

Use `low` when:

- Product name or usage is only partial,
- The item is inferred,
- Product page cannot be found,
- Video/metadata lacks enough detail.

Do not overstate confidence. If unsure, write the uncertainty into `summary_zh` or `notes`.

## Analysis Workflow

Follow this order:

1. **Read pending rows**
   - Fetch Sheet rows through Apps Script.
   - Pending rows usually have `notes = pending_url_review`, `product_name_zh = 待分析`, or placeholder product fields.

2. **Check duplicate source URLs before writing**
   - Group all rows by `source_url`.
   - If any pending URL already appears in another row, stop before writing changes for that URL.
   - Report the duplicate group to the user with `source_url`, `item_id`, `status`, `product_name_zh`, and `notes`.
   - Do not overwrite rows with user-managed statuses such as `want`, `bought`, `skipped`, or `deleted`.
   - Do not clean duplicate pending rows automatically. Ask the user what to do.
   - The dashboard may show duplicate warnings without changing Sheet data; treat that as the preferred first step.

3. **Extract public metadata**
   - Prefer `yt-dlp --skip-download --dump-json --no-playlist URL`.
   - This should not download the video.
   - Use title, description, uploader, channel, duration, webpage URL, hashtags, JAN/product codes.

4. **Use subtitles when available**
   - Use subtitles/transcripts only if available.
   - Facebook and Instagram often do not provide useful subtitles.

5. **Search suspected product names**
   - If there is a suspected product name but unclear usage, search the web for the exact product.
   - Prefer official product pages, manufacturer pages, reputable seller pages, or clear product listings.
   - Add found URLs into `notes`, for example:
     - `found_url: https://...`
     - `seller_url: https://...`

6. **Escalate to video/audio analysis only when needed**
   - If metadata, subtitles, and search are not enough, explain that video/audio/frame analysis may require downloading or temporary files.
   - Ask the user before producing local media files.

7. **Mark unresolved items**
   - If information is still insufficient, keep a row with low confidence:
     - `confidence = low`
     - `notes` includes `needs_manual_check`
     - `summary_zh` explains what is missing.

## Multi-Product URL Rules

If one URL contains multiple products:

1. Create one row per product.
2. Keep the same `source_url` for every product.
3. Use stable, unique `item_id` values.
4. Preserve the product sequence in `notes`:

```text
analyzed_by_codex; item_1_of_5; rank_1
analyzed_by_codex; item_2_of_5; rank_2
```

If the source has a ranking, keep `rank_x`. If it is only an appearance order, use `item_x_of_y`.

The dashboard reads `item_x_of_y` and `rank_x` from `notes` to show tags like `#1/5`.

## Notes Rules

The `notes` field may contain both system tags and user notes.

System tags include:

```text
analyzed_by_codex
pending_url_review
item_x_of_y
rank_x
usage_needs_product_page_check
exact_product_name_needs_room_check
needs_manual_check
found_url: ...
seller_url: ...
```

The dashboard hides common system tags from the editable Notes textarea but keeps them in the Sheet. When updating notes, preserve system tags unless the user explicitly asks to clean or remove them.

## Output Language

Write user-facing product information in zh-TW:

- `product_name`: keep the original product name when available.
- `product_name_zh`: use a zh-TW product label or description. Product names may remain untranslated when the brand/model is important.
- `usage_zh`: concise zh-TW usage description.
- `summary_zh`: concise zh-TW explanation of what the URL says and what was inferred.

## Safety and Permission Rules

Default behavior:

- Do not read browser cookies.
- Do not use `--cookies-from-browser` unless the user explicitly approves it for that URL or task.
- Do not download video/audio files by default.
- Do not physically delete Sheet rows by default.
- Do not guess aggressively. Mark uncertainty.

If content requires login:

1. Explain that using browser cookies reads the browser login state.
2. Ask for explicit approval before using cookies.
3. Prefer public metadata first.

If content requires video/audio/frame analysis:

1. Explain which temporary files may be created.
2. Ask before creating local media files.
3. After analysis, ask before deleting files if deletion is needed.

## Apps Script Write Pattern

Use `upsert_item` when adding or replacing analyzed product rows.

Use `update_item` when updating an existing row's status, notes, usage, summary, confidence, or product fields.

Example payload:

```json
{
  "action": "update_item",
  "item": {
    "item_id": "url-instagram-example-product",
    "product_name": "Example Product",
    "product_name_zh": "Example Product 用途描述",
    "usage_zh": "用於整理、清潔或戶外使用。",
    "summary_zh": "來源影片提到此商品，並補查到商品頁確認用途。",
    "confidence": "high",
    "notes": "analyzed_by_codex; item_1_of_3; found_url: https://example.com",
    "updated_at": "2026-06-07T00:00:00.000Z"
  }
}
```

Always read back after writing and report the rows updated.

## Completion Checklist

Before final response:

- Pending URLs were identified or user-provided URLs were listed.
- Duplicate `source_url` groups were checked before any writes.
- If duplicates existed, they were reported and not overwritten unless the user explicitly confirmed the action.
- Public metadata was attempted first.
- Product-page search was used when suspected names had unclear usage.
- Multi-product URLs were split into separate rows.
- `confidence` reflects the evidence.
- `notes` preserves system tags.
- Google Sheet writes were verified by reading back.
- Any blocked items are clearly marked with why they remain unresolved.
