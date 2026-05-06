const { JWT } = require('google-auth-library');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { getShopsRepo } = require('../repositories/shops.repo');
const { getProductsRepo } = require('../repositories/products.repo');
const { v4: uuidv4 } = require('uuid');

function getGoogleAuth() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (!clientEmail || !privateKey) throw new Error('Google service account is not configured');
  return new JWT({
    email: clientEmail,
    key: privateKey,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive'
    ],
  });
}

async function createImportsSpreadsheet(shop) {
  const auth = getGoogleAuth();
  const accessToken = await auth.getAccessToken();
  const token = typeof accessToken === 'string' ? accessToken : accessToken?.token;
  const title = `POSweb Imports - ${shop.name || shop.id}`;
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ properties: { title } }),
  });
  if (!createRes.ok) throw new Error(`Create sheet failed: ${await createRes.text()}`);
  const created = await createRes.json();
  const spreadsheetId = created.spreadsheetId;
  const spreadsheetUrl = created.spreadsheetUrl;

  await fetch(`https://www.googleapis.com/drive/v3/files/${spreadsheetId}/permissions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'writer', type: 'anyone' }),
  });

  const doc = new GoogleSpreadsheet(spreadsheetId, auth);
  await doc.loadInfo();
  let inputSheet = doc.sheetsByTitle['imports_input'];
  if (!inputSheet) {
    inputSheet = await doc.addSheet({
      title: 'imports_input',
      headerValues: ['barcode', 'product_name', 'quantity', 'total'],
    });
  } else {
    await inputSheet.setHeaderRow(['barcode', 'product_name', 'quantity', 'total']);
  }
  return { spreadsheetId, spreadsheetUrl };
}

async function ensureShopImportsSheet(shopId) {
  const shop = await getShopsRepo().getById(shopId);
  if (!shop) throw new Error('Shop not found');
  if (shop.imports_sheet_id && shop.imports_sheet_url) {
    return { spreadsheetId: shop.imports_sheet_id, spreadsheetUrl: shop.imports_sheet_url, created: false };
  }
  const created = await createImportsSpreadsheet(shop);
  await getShopsRepo().updateImportsSheet(shopId, created.spreadsheetId, created.spreadsheetUrl);
  return { ...created, created: true };
}

async function syncFromShopSheet(shopId) {
  const shop = await getShopsRepo().getById(shopId);
  if (!shop?.imports_sheet_id) throw new Error('Shop has no imports sheet yet');
  const auth = getGoogleAuth();
  const doc = new GoogleSpreadsheet(shop.imports_sheet_id, auth);
  await doc.loadInfo();
  const sheet = doc.sheetsByTitle['imports_input'] || doc.sheetsByIndex[0];
  const rows = await sheet.getRows();
  const items = rows.map((row) => {
    const barcode = String(row.get('barcode') || '').trim();
    const name = String(row.get('product_name') || row.get('name') || '').trim();
    const qty = Number(String(row.get('quantity') || row.get('qty') || '').replace(/[^\d.-]/g, ''));
    const total = Number(String(row.get('total') || row.get('amount') || '').replace(/[^\d.-]/g, ''));
    return { barcode, name, qty, total };
  }).filter((x) => x.barcode && x.name && x.qty > 0 && x.total > 0);

  if (!items.length) return { count: 0 };

  const productsRepo = getProductsRepo();
  const existing = await productsRepo.getProducts(shopId);
  const byBarcode = new Map(existing.map((p) => [p.barcode, p]));
  const payload = items.map((row) => {
    const old = byBarcode.get(row.barcode);
    return {
      id: old?.id || uuidv4(),
      barcode: row.barcode,
      name: row.name || old?.name || `SP ${row.barcode}`,
      unit: old?.unit || 'Cai',
      category: old?.category || '',
      price: Math.round(row.total / row.qty),
      cost_price: old?.cost_price || Math.round(row.total / row.qty),
      stock_quantity: Number(old?.stock_quantity || 0) + row.qty,
      image_url: old?.image_url || null,
      is_active: true,
      created_at: old?.created_at || new Date().toISOString(),
    };
  });

  await productsRepo.bulkUpsert(shopId, payload);
  return { count: payload.length };
}

module.exports = { ensureShopImportsSheet, syncFromShopSheet };
