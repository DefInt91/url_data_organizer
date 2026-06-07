const SHEET_ID = '14SOy9cYWMA9u0F-f2co5nEEDJvF94CAuXNx9ETLR3no';
const SHEET_NAME = 'WishList';

const HEADERS = [
  'item_id',
  'status',
  'store',
  'product_name',
  'product_name_zh',
  'price',
  'currency',
  'product_code',
  'usage_zh',
  'summary_zh',
  'source_url',
  'platform',
  'creator',
  'confidence',
  'notes',
  'created_at',
  'updated_at'
];

function doGet() {
  const sheet = getSheet();
  const items = readItems(sheet);
  return jsonResponse({
    ok: true,
    sheet_name: SHEET_NAME,
    count: items.length,
    items: items
  });
}

function doPost(event) {
  const payload = parsePayload(event);
  const action = payload.action || 'upsert_item';
  const sheet = getSheet();

  if (action === 'add_item') {
    return jsonResponse(addItem(sheet, payload.item || {}));
  }

  if (action === 'update_item') {
    return jsonResponse(updateItem(sheet, payload.item || {}));
  }

  if (action === 'update_row') {
    return jsonResponse(updateRow(sheet, payload.item || {}));
  }

  if (action === 'upsert_item') {
    return jsonResponse(upsertItem(sheet, payload.item || {}));
  }

  return jsonResponse({
    ok: false,
    error: 'Unsupported action'
  });
}

function getSheet() {
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }

  ensureHeaders(sheet);
  return sheet;
}

function ensureHeaders(sheet) {
  const range = sheet.getRange(1, 1, 1, HEADERS.length);
  const values = range.getValues()[0];
  const missingHeaders = HEADERS.some((header, index) => values[index] !== header);

  if (missingHeaders) {
    range.setValues([HEADERS]);
    sheet.setFrozenRows(1);
  }
}

function readItems(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return [];
  }

  const values = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();
  return values
    .map((row, index) => rowToItem(row, index + 2))
    .filter(item => item.item_id || item.product_name || item.source_url);
}

function rowToItem(row, rowNumber) {
  const item = {};
  HEADERS.forEach((header, index) => {
    item[header] = normalizeValue(row[index]);
  });
  if (rowNumber) {
    item._row_number = rowNumber;
  }
  return item;
}

function itemToRow(item) {
  return HEADERS.map(header => item[header] || '');
}

function normalizeValue(value) {
  if (value instanceof Date) {
    return value.toISOString();
  }
  return value === null || value === undefined ? '' : String(value);
}

function addItem(sheet, item) {
  const now = new Date().toISOString();
  const normalizedItem = normalizeItem(item, now);
  sheet.appendRow(itemToRow(normalizedItem));
  return {
    ok: true,
    action: 'add_item',
    item: normalizedItem
  };
}

function updateItem(sheet, item) {
  if (!item.item_id) {
    return {
      ok: false,
      error: 'item_id is required'
    };
  }

  const rowIndex = findRowByItemId(sheet, item.item_id);
  if (rowIndex < 0) {
    return {
      ok: false,
      error: 'Item not found'
    };
  }

  const currentItem = rowToItem(sheet.getRange(rowIndex, 1, 1, HEADERS.length).getValues()[0]);
  const updatedItem = Object.assign({}, currentItem, item, {
    updated_at: item.updated_at || new Date().toISOString()
  });

  sheet.getRange(rowIndex, 1, 1, HEADERS.length).setValues([itemToRow(updatedItem)]);
  return {
    ok: true,
    action: 'update_item',
    item: updatedItem
  };
}

function updateRow(sheet, item) {
  const rowIndex = Number(item._row_number || item.row_number);
  if (!rowIndex || rowIndex < 2 || rowIndex > sheet.getLastRow()) {
    return {
      ok: false,
      error: 'Valid _row_number is required'
    };
  }

  const currentItem = rowToItem(sheet.getRange(rowIndex, 1, 1, HEADERS.length).getValues()[0], rowIndex);
  if (item.item_id && currentItem.item_id !== item.item_id) {
    return {
      ok: false,
      error: 'item_id mismatch'
    };
  }

  if (item.source_url && currentItem.source_url !== item.source_url) {
    return {
      ok: false,
      error: 'source_url mismatch'
    };
  }

  const updatedItem = Object.assign({}, currentItem, item, {
    updated_at: item.updated_at || new Date().toISOString()
  });
  delete updatedItem._row_number;

  sheet.getRange(rowIndex, 1, 1, HEADERS.length).setValues([itemToRow(updatedItem)]);
  updatedItem._row_number = rowIndex;

  return {
    ok: true,
    action: 'update_row',
    item: updatedItem
  };
}

function upsertItem(sheet, item) {
  const now = new Date().toISOString();
  const normalizedItem = normalizeItem(item, now);
  const rowIndex = findMatchingRow(sheet, normalizedItem);

  if (rowIndex < 0) {
    sheet.appendRow(itemToRow(normalizedItem));
    return {
      ok: true,
      action: 'inserted',
      item: normalizedItem
    };
  }

  const currentItem = rowToItem(sheet.getRange(rowIndex, 1, 1, HEADERS.length).getValues()[0]);
  const updatedItem = Object.assign({}, currentItem, normalizedItem, {
    item_id: currentItem.item_id || normalizedItem.item_id,
    created_at: currentItem.created_at || normalizedItem.created_at,
    updated_at: now
  });

  sheet.getRange(rowIndex, 1, 1, HEADERS.length).setValues([itemToRow(updatedItem)]);
  return {
    ok: true,
    action: 'updated',
    item: updatedItem
  };
}

function normalizeItem(item, now) {
  return {
    item_id: item.item_id || Utilities.getUuid(),
    status: item.status || 'to_review',
    store: item.store || 'Unknown Store',
    product_name: item.product_name || '',
    product_name_zh: item.product_name_zh || '',
    price: item.price || '',
    currency: item.currency || '',
    product_code: item.product_code || '',
    usage_zh: item.usage_zh || '',
    summary_zh: item.summary_zh || '',
    source_url: item.source_url || '',
    platform: item.platform || '',
    creator: item.creator || '',
    confidence: item.confidence || 'medium',
    notes: item.notes || '',
    created_at: item.created_at || now,
    updated_at: item.updated_at || now
  };
}

function findRowByItemId(sheet, itemId) {
  const items = readItems(sheet);
  for (let index = 0; index < items.length; index += 1) {
    if (items[index].item_id === itemId) {
      return index + 2;
    }
  }
  return -1;
}

function findMatchingRow(sheet, targetItem) {
  const items = readItems(sheet);
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const sameCode = targetItem.product_code && item.product_code === targetItem.product_code;
    const sameSource = targetItem.source_url && item.source_url === targetItem.source_url;
    const sameNameAndStore =
      targetItem.product_name &&
      item.product_name === targetItem.product_name &&
      item.store === targetItem.store;

    if ((sameSource && sameCode) || (sameSource && sameNameAndStore) || sameCode) {
      return index + 2;
    }
  }
  return -1;
}

function parsePayload(event) {
  if (!event || !event.postData || !event.postData.contents) {
    return {};
  }
  return JSON.parse(event.postData.contents);
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
