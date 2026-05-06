const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const fs = require('fs');
const path = require('path');

const VI = {
    banHang: 'Bán hàng',
    sanPham: 'Sản phẩm',
    nhapKho: 'Nhập hàng',
    chiTietNhapKho: 'Chi tiết nhập kho',
    soQuy: 'Sổ quỹ',
    donDaHuy: 'Đơn đã hủy',
    headers: {
        sales: ['Ngày ghi sổ', 'Số hiệu chứng từ', 'Diễn giải', 'Doanh thu (+)', 'Hình thức thanh toán', 'Chi tiết'],
        products: ['Ngày Cập Nhật', 'Barcode', 'Mã Sản Phẩm', 'Tên Sản Phẩm', 'Đơn vị', 'Danh mục', 'Giá Bán', 'Giá Vốn', 'Tồn Kho', 'Trạng Thái'],
        imports: [
            'Mã phiếu nhập',
            'Ngày nhập',
            'Số chứng từ',
            'Ngày chứng từ',
            'Nhà cung cấp',
            'Mã số thuế NCC',
            'Số hóa đơn',
            'Loại hóa đơn',
            'Phương thức thanh toán',
            'Ngày thanh toán',
            'Số tiền đã thanh toán',
            'Tổng tiền hàng',
            'Tổng VAT',
            'Tổng cộng',
            'Còn nợ',
            'Số lượng mặt hàng',
            'Số file đính kèm',
            'Trạng thái',
            'Ghi chú'
        ],
        importItems: [
            'Mã phiếu nhập',
            'Ngày nhập',
            'Nhà cung cấp',
            'Số hóa đơn',
            'Mã sản phẩm',
            'Tên hàng',
            'Đơn vị tính',
            'Số lượng nhập',
            'Đơn giá nhập',
            'VAT',
            'Thành tiền',
            'Trạng thái',
            'Ghi chú'
        ],
        cashbook: ['Ngày', 'Hạng mục', 'Diễn giải', 'Thu (+)', 'Chi (-)', 'Mã chứng từ'],
        voids: ['Ngày Hủy', 'Số hiệu đơn', 'Lý do hủy', 'Shop']
    }
};

const logFile = path.resolve(__dirname, '../sheets_sync.log');
const log = (msg) => {
    const entry = `[${new Date().toISOString()}] ${msg}\n`;
    fs.appendFileSync(logFile, entry);
    console.log(msg);
};

function getSheetConfig() {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!spreadsheetId || !clientEmail || !privateKey) {
        return null;
    }

    return { spreadsheetId, clientEmail, privateKey };
}

async function createDocClient() {
    const config = getSheetConfig();
    if (!config) return null;

    const auth = new JWT({
        email: config.clientEmail,
        key: config.privateKey,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const doc = new GoogleSpreadsheet(config.spreadsheetId, auth);
    await doc.loadInfo();
    return doc;
}

async function ensureSheet(doc, tabName, headers) {
    let sheet = doc.sheetsByTitle[tabName];
    if (!sheet) {
        sheet = await doc.addSheet({ title: tabName, headerValues: headers });
    } else {
        await sheet.setHeaderRow(headers);
    }
    return sheet;
}

async function appendToSheet(tabName, rowData, headers) {
    const config = getSheetConfig();
    if (!config) return;

    try {
        const doc = await createDocClient();
        const sheet = await ensureSheet(doc, tabName, headers);
        await sheet.addRow(rowData);
    } catch (error) {
        log(`Sync error ${tabName}: ${error.message}`);
        console.error(`[Sync Detail] ${tabName} Error:`, error);
    }
}

async function upsertSheetRow(tabName, headers, keyHeader, keyValue, rowData) {
    const config = getSheetConfig();
    if (!config) return;

    try {
        const doc = await createDocClient();
        const sheet = await ensureSheet(doc, tabName, headers);
        const rows = await sheet.getRows();
        const existingRow = rows.find((row) => String(row.get(keyHeader) || '') === String(keyValue));

        if (existingRow) {
            headers.forEach((header) => existingRow.set(header, rowData[header] ?? ''));
            await existingRow.save();
            return;
        }

        await sheet.addRow(rowData);
    } catch (error) {
        log(`Upsert error ${tabName}: ${error.message}`);
        console.error(`[Sync Detail] ${tabName} Upsert Error:`, error);
    }
}

async function replaceSheetRows(tabName, headers, keyHeader, keyValue, rowsData) {
    const config = getSheetConfig();
    if (!config) return;

    try {
        const doc = await createDocClient();
        const sheet = await ensureSheet(doc, tabName, headers);
        const rows = await sheet.getRows();

        const matchedRows = rows.filter((row) => String(row.get(keyHeader) || '') === String(keyValue));
        await Promise.all(matchedRows.map((row) => row.delete()));

        if (rowsData.length > 0) {
            await sheet.addRows(rowsData);
        }
    } catch (error) {
        log(`Replace rows error ${tabName}: ${error.message}`);
        console.error(`[Sync Detail] ${tabName} Replace Rows Error:`, error);
    }
}

function formatDateTime(value) {
    if (!value) return '';
    return new Date(value).toLocaleString('vi-VN');
}

function formatDateOnly(value) {
    if (!value) return '';
    return new Date(`${value}T00:00:00`).toLocaleDateString('vi-VN');
}

function getInvoiceTypeLabel(type) {
    switch (type) {
        case 'vat_invoice': return 'Hóa đơn VAT';
        case 'retail_invoice': return 'Hóa đơn bán lẻ';
        default: return 'Không có hóa đơn';
    }
}

function getPaymentMethodLabel(method) {
    switch (method) {
        case 'cash': return 'Tiền mặt';
        case 'transfer': return 'Chuyển khoản';
        case 'mixed': return 'Kết hợp';
        default: return 'Chưa thanh toán';
    }
}

async function syncSale(sale, shopName) {
    const headers = VI.headers.sales;
    log(`[Sync] Starting sync for sale ${sale.code}...`);
    try {
        const itemsStr = sale.items ? sale.items.map((i) => `${i.product_name} (x${i.quantity})`).join(', ') : '';
        const rowData = {
            [headers[0]]: formatDateTime(sale.sale_date || Date.now()),
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
    const rowData = {
        [headers[0]]: formatDateTime(new Date()),
        [headers[1]]: product.barcode,
        [headers[2]]: product.id,
        [headers[3]]: product.name,
        [headers[4]]: product.unit || 'Cái',
        [headers[5]]: product.category || '',
        [headers[6]]: Number(product.price),
        [headers[7]]: Number(product.cost_price || 0),
        [headers[8]]: Number(product.stock_quantity || 0),
        [headers[9]]: product.is_active ? 'Đang bán' : 'Ngừng bán'
    };
    const result = await appendToSheet(VI.sanPham, rowData, headers);
    log(`[Sync] Finished product sync for: ${product.name}`);
    return result;
}

async function syncImport(importData) {
    const importHeaders = VI.headers.imports;
    const itemHeaders = VI.headers.importItems;
    const debtAmount = Math.max(0, Number(importData.total_cost || 0) - Number(importData.paid_amount || 0));
    const items = Array.isArray(importData.items) ? importData.items : [];
    const attachmentCount = Array.isArray(importData.attachment_files) ? importData.attachment_files.length : 0;

    const importRow = {
        [importHeaders[0]]: importData.id,
        [importHeaders[1]]: formatDateOnly(importData.import_date),
        [importHeaders[2]]: importData.id,
        [importHeaders[3]]: formatDateOnly(importData.invoice_date),
        [importHeaders[4]]: importData.supplier_name || '',
        [importHeaders[5]]: importData.supplier_tax_code || '',
        [importHeaders[6]]: importData.invoice_number || '',
        [importHeaders[7]]: getInvoiceTypeLabel(importData.invoice_type),
        [importHeaders[8]]: getPaymentMethodLabel(importData.payment_method),
        [importHeaders[9]]: formatDateOnly(importData.payment_date),
        [importHeaders[10]]: Number(importData.paid_amount || 0),
        [importHeaders[11]]: Number(importData.total_goods_amount || 0),
        [importHeaders[12]]: Number(importData.total_vat_amount || 0),
        [importHeaders[13]]: Number(importData.total_cost || 0),
        [importHeaders[14]]: debtAmount,
        [importHeaders[15]]: items.length,
        [importHeaders[16]]: attachmentCount,
        [importHeaders[17]]: String(importData.status || 'draft').toUpperCase(),
        [importHeaders[18]]: importData.note || ''
    };

    const itemRows = items.map((item) => ({
        [itemHeaders[0]]: importData.id,
        [itemHeaders[1]]: formatDateOnly(importData.import_date),
        [itemHeaders[2]]: importData.supplier_name || '',
        [itemHeaders[3]]: importData.invoice_number || '',
        [itemHeaders[4]]: item.product_id || '',
        [itemHeaders[5]]: item.product_name || '',
        [itemHeaders[6]]: item.unit || '',
        [itemHeaders[7]]: Number(item.quantity || 0),
        [itemHeaders[8]]: Number(item.unit_price || 0),
        [itemHeaders[9]]: Number(item.vat_amount || 0),
        [itemHeaders[10]]: Number(item.total_amount || 0),
        [itemHeaders[11]]: String(importData.status || 'draft').toUpperCase(),
        [itemHeaders[12]]: importData.note || ''
    }));

    await upsertSheetRow(VI.nhapKho, importHeaders, importHeaders[0], importData.id, importRow);
    await replaceSheetRows(VI.chiTietNhapKho, itemHeaders, itemHeaders[0], importData.id, itemRows);
}

async function syncCashFlow(cashFlow) {
    const headers = VI.headers.cashbook;
    const rowData = {
        [headers[0]]: formatDateTime(cashFlow.created_at || Date.now()),
        [headers[1]]: cashFlow.category || 'Khác',
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
        [headers[0]]: formatDateTime(new Date()),
        [headers[1]]: saleId,
        [headers[2]]: reason,
        [headers[3]]: shopName
    };
    return appendToSheet(VI.donDaHuy, rowData, headers);
}

async function pullProductsFromSheet(spreadsheetId) {
    try {
        const auth = new JWT({
            email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
        });

        const doc = new GoogleSpreadsheet(spreadsheetId, auth);
        await doc.loadInfo();

        const sheet = doc.sheetsByTitle[VI.sanPham] || doc.sheetsByIndex[0];
        const rows = await sheet.getRows();

        return rows.map(row => ({
            barcode: row.get('Barcode') || row.get('Mã vạch') || '',
            name: row.get('Tên Sản Phẩm') || row.get('Tên') || '',
            unit: row.get('Đơn vị') || '',
            category: row.get('Danh mục') || '',
            price: Number(row.get('Giá Bán') || row.get('Giá') || 0),
            cost_price: Number(row.get('Giá Vốn') || 0),
            stock_quantity: Number(row.get('Tồn Kho') || 0),
        })).filter(p => p.barcode && p.name);
    } catch (error) {
        console.error('Pull Products Error:', error);
        throw error;
    }
}

module.exports = { syncSale, syncProduct, syncImport, syncCashFlow, syncVoidSale, pullProductsFromSheet };
