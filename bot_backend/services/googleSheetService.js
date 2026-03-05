const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const fs = require('fs');
const path = require('path');

const VI = {
    banHang: '\u0042\u00e1\u006e\u0020\u0068\u00e0\u006e\u0067',
    sanPham: '\u0053\u1ea3\u006e\u0020\u0070\u0068\u1ea9\u006d',
    nhapKho: '\u004e\u0068\u1ead\u0070\u0020\u006b\u0068\u006f',
    soQuy: '\u0053\u1ed5\u0020\u0071\u0169\u0079',
    donDaHuy: '\u0110\u01a1\u006e\u0020\u0111\u00e3\u0020\u0068\u1ee7\u0079',
    headers: {
        sales: ['\u004e\u0067\u00e0\u0079\u0020\u0067\u0068\u0069\u0020\u0073\u1ed5', '\u0053\u1ed1\u0020\u0068\u0069\u1ec7\u0075\u0020\u0063\u0068\u1ee9\u006e\u0067\u0020\u0074\u1eeb', '\u0044\u0069\u1ec5\u006e\u0020\u0067\u0069\u1ea3\u0069', 'Doanh thu (+)', '\u0048\u00ec\u006e\u0068\u0020\u0074\u0068\u1ee9\u0063\u0020\u0074\u0068\u0061\u006e\u0068\u0020\u0074\u006f\u00e1\u006e', '\u0043\u0068\u0069\u0020\u0074\u0069\u1ebf\u0074'],
        products: ['\u004e\u0067\u00e0\u0079\u0020\u0043\u1ead\u0070\u0020\u004e\u0068\u1ead\u0074', 'Barcode', '\u004d\u00e3\u0020\u0053\u1ea3\u006e\u0020\u0050\u0068\u1ea9\u006d', '\u0054\u00ea\u006e\u0020\u0053\u1ea3\u006e\u0020\u0050\u0068\u1ea9\u006d', '\u0110\u01a1\u006e\u0020\u0076\u1ecb', '\u0044\u0061\u006e\u0068\u0020\u006d\u1ee5\u0063', '\u0047\u0069\u00e1\u0020\u0042\u00e1\u006e', '\u0047\u0069\u00e1\u0020\u0056\u1ed1\u006e', '\u0054\u1ed3\u006e\u0020\u004b\u0068\u006f', '\u0054\u0072\u1ea1\u006e\u0067\u0020\u0054\u0068\u00e1\u0069'],
        imports: ['\u004e\u0067\u00e0\u0079\u0020\u0067\u0068\u0069\u0020\u0073\u1ed5', '\u0053\u1ed1\u0020\u0068\u0069\u1ec7\u0075\u0020\u0063\u0068\u1ee9\u006e\u0067\u0020\u0074\u1eeb', '\u004e\u0068\u00e0\u0020\u0063\u0075\u006e\u0067\u0020\u0063\u1ea5\u0070', '\u0047\u0069\u00e1\u0020\u0074\u0072\u1ecb\u0020\u006e\u0068\u1ead\u0070\u0020\u0028\u002b\u0029', '\u0047\u0068\u0069\u0020\u0063\u0068\u00fa'],
        cashbook: ['\u004e\u0067\u00e0\u0079', '\u0048\u1ea1\u006e\u0067\u0020\u006d\u1ee5\u0063', '\u0044\u0069\u1ec5\u006e\u0020\u0067\u0069\u1ea3\u0069', '\u0054\u0068\u0075\u0020\u0028\u002b\u0029', '\u0043\u0068\u0069\u0020\u0028\u002d\u0029', '\u004d\u00e3\u0020\u0063\u0068\u1ee9\u006e\u0067\u0020\u0074\u1eeb'],
        voids: ['\u004e\u0067\u00e0\u0079\u0020\u0048\u1ee7\u0079', '\u0053\u1ed1\u0020\u0068\u0069\u1ec7\u0075\u0020\u0111\u01a1\u006e', '\u004c\u00fd\u0020\u0064\u006f\u0020\u0068\u1ee7\u0079', 'Shop']
    }
};

const logFile = path.resolve(__dirname, '../sheets_sync.log');
const log = (msg) => {
    const entry = `[${new Date().toISOString()}] ${msg}\n`;
    fs.appendFileSync(logFile, entry);
    console.log(msg);
};

async function appendToSheet(tabName, rowData, headers) {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n');
    if (!spreadsheetId || !clientEmail || !privateKey) return;

    try {
        const auth = new JWT({ email: clientEmail, key: privateKey, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
        const doc = new GoogleSpreadsheet(spreadsheetId, auth);
        await doc.loadInfo();

        let sheet = doc.sheetsByTitle[tabName];
        if (!sheet) {
            sheet = await doc.addSheet({ title: tabName, headerValues: headers });
        } else {
            await sheet.setHeaderRow(headers);
        }
        await sheet.addRow(rowData);
    } catch (error) {
        log(`Sync error ${tabName}: ${error.message}`);
        console.error(`[Sync Detail] ${tabName} Error:`, error);
    }
}

async function syncSale(sale, shopName) {
    const headers = VI.headers.sales;
    log(`[Sync] Starting sync for sale ${sale.code}...`);
    try {
        const itemsStr = sale.items ? sale.items.map((i) => `${i.product_name} (x${i.quantity})`).join(', ') : '';
        const rowData = {
            [headers[0]]: new Date(sale.sale_date || Date.now()).toLocaleString('vi-VN'),
            [headers[1]]: sale.code,
            [headers[2]]: `Doanh thu - ${shopName}${sale.note ? ' - ' + sale.note : ''}`,
            [headers[3]]: Number(sale.total_amount),
            [headers[4]]: sale.payment_method === 'cash' ? 'Tiền mặt' : 'Chuyển khoản',
            [headers[5]]: itemsStr
        };
        const result = await appendToSheet(VI.banHang, rowData, headers);
        log(`[Sync] Successfully synced sale ${sale.code}`);
        return result;
    } catch (err) {
        log(`[Sync] Error syncing sale ${sale.code}: ${err.message}`);
        throw err;
    }
}

async function syncProduct(product) {
    const headers = VI.headers.products;
    log(`[Sync] Starting product sync for: ${product.name} (Barcode: ${product.barcode})`);
    log(`[Sync] Headers count: ${headers.length}, Headers index 5: ${headers[5]}`);
    const rowData = {
        [headers[0]]: new Date().toLocaleString('vi-VN'),
        [headers[1]]: product.barcode,
        [headers[2]]: product.id,
        [headers[3]]: product.name,
        [headers[4]]: product.unit || '\u0043\u00e1\u0069',
        [headers[5]]: product.category || '',
        [headers[6]]: Number(product.price),
        [headers[7]]: Number(product.cost_price || 0),
        [headers[8]]: Number(product.stock_quantity || 0),
        [headers[9]]: product.is_active ? '\u0110\u0061\u006e\u0067\u0020\u0062\u00e1\u006e' : '\u004e\u0067\u1eeb\u006e\u0067\u0020\u0062\u00e1\u006e'
    };
    const result = await appendToSheet(VI.sanPham, rowData, headers);
    log(`[Sync] Finished product sync for: ${product.name}`);
    return result;
}

async function syncImport(importData) {
    const headers = VI.headers.imports;
    const rowData = {
        [headers[0]]: new Date(importData.import_date).toLocaleString('vi-VN'),
        [headers[1]]: importData.id || 'N/A',
        [headers[2]]: importData.supplier_name,
        [headers[3]]: Number(importData.total_cost),
        [headers[4]]: importData.note || ''
    };
    return appendToSheet(VI.nhapKho, rowData, headers);
}

async function syncCashFlow(cashFlow) {
    const headers = VI.headers.cashbook;
    const rowData = {
        [headers[0]]: new Date(cashFlow.created_at || Date.now()).toLocaleString('vi-VN'),
        [headers[1]]: cashFlow.category || '\u004b\u0068\u00e1\u0063',
        [headers[2]]: cashFlow.description,
        [headers[3]]: cashFlow.type === 'in' ? Number(cashFlow.amount) : 0,
        [headers[4]]: cashFlow.type === 'out' ? Number(cashFlow.amount) : 0,
        [headers[5]]: cashFlow.ref_id || ''
    };
    return appendToSheet(VI.soQuy, rowData, headers);
}

async function syncVoidSale(saleId, reason, shopName) {
    const headers = VI.headers.voids;
    const rowData = {
        [headers[0]]: new Date().toLocaleString('vi-VN'),
        [headers[1]]: saleId,
        [headers[2]]: reason,
        [headers[3]]: shopName
    };
    return appendToSheet(VI.donDaHuy, rowData, headers);
}

module.exports = { syncSale, syncProduct, syncImport, syncCashFlow, syncVoidSale };
