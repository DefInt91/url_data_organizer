# WishList Sheet Schema

Google Sheet:

- Sheet ID: `14SOy9cYWMA9u0F-f2co5nEEDJvF94CAuXNx9ETLR3no`
- Sheet name: `WishList`

## Columns

| Column | Purpose |
| --- | --- |
| `item_id` | Stable unique item id. |
| `status` | Board status: `to_review`, `want`, `compare`, `bought`, `skipped`. |
| `store` | Store grouping key, such as `DAISO` or `Amazon`. |
| `product_name` | Original product name. |
| `product_name_zh` | Traditional Chinese product name when useful. |
| `price` | Display price, such as `¥330`. |
| `currency` | Currency code, such as `JPY`, `TWD`, `USD`. |
| `product_code` | JAN, SKU, ASIN, model number, or product code. |
| `usage_zh` | Short Traditional Chinese usage description. |
| `summary_zh` | Short Traditional Chinese source summary. |
| `source_url` | Original URL. |
| `platform` | Source platform, such as `Facebook`, `Instagram`, `YouTube`. |
| `creator` | Creator, uploader, or account name. |
| `confidence` | Extraction confidence: `high`, `medium`, `low`. |
| `notes` | User notes. |
| `created_at` | ISO timestamp. |
| `updated_at` | ISO timestamp. |

## Apps Script Actions

### GET

Returns:

```json
{
  "ok": true,
  "sheet_name": "WishList",
  "count": 0,
  "items": []
}
```

### POST `upsert_item`

Recommended action for Codex URL extraction.

```json
{
  "action": "upsert_item",
  "item": {
    "status": "to_review",
    "store": "DAISO",
    "product_name": "2IN1車載ドリンクホルダー",
    "product_name_zh": "2 合 1 車用飲料架",
    "price": "¥330",
    "currency": "JPY",
    "product_code": "4550480785073",
    "usage_zh": "把車上單一杯架擴充成兩個，可放飲料與手機。",
    "summary_zh": "短影音介紹大創車用杯架擴充配件。",
    "source_url": "https://www.facebook.com/reel/1016337091337261",
    "platform": "Facebook",
    "creator": "100均チャンネル",
    "confidence": "high"
  }
}
```
