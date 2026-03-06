require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const db = require('../db/connection');

const IMPORT_HEADERS = [
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
];

const ITEM_HEADERS = [
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
];

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

function parseJson(value, fallback) {
    try {
        return value ? JSON.parse(value) : fallback;
    } catch {
        return fallback;
    }
}

async function ensureSheet(doc, title, headers) {
    let sheet = doc.sheetsByTitle[title];
    if (!sheet) {
        sheet = await doc.addSheet({ title, headerValues: headers });
    } else {
        await sheet.setHeaderRow(headers);
    }
    return sheet;
}

async function resetSheet(sheet, headers) {
    if (sheet.rowCount > 1) {
        await sheet.resize({ rowCount: 1, columnCount: headers.length });
    } else {
        await sheet.resize({ rowCount: 1, columnCount: headers.length });
    }
    await sheet.setHeaderRow(headers);
}

async function main() {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!spreadsheetId || !clientEmail || !privateKey) {
        throw new Error('Thiếu biến môi trường Google Sheets');
    }

    const auth = new JWT({
        email: clientEmail,
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const doc = new GoogleSpreadsheet(spreadsheetId, auth);
    await doc.loadInfo();

    const importsSheet = await ensureSheet(doc, 'Nhập hàng', IMPORT_HEADERS);
    const itemsSheet = await ensureSheet(doc, 'Chi tiết nhập kho', ITEM_HEADERS);

    await resetSheet(importsSheet, IMPORT_HEADERS);
    await resetSheet(itemsSheet, ITEM_HEADERS);

    const imports = db.prepare(`
        SELECT *
        FROM imports
        ORDER BY import_date ASC, created_at ASC
    `).all();

    const importRows = [];
    const itemRows = [];

    for (const record of imports) {
        const items = db.prepare(`
            SELECT *
            FROM import_items
            WHERE import_id = ?
            ORDER BY rowid ASC
        `).all(record.id);

        const attachments = parseJson(record.attachment_files, []);
        const debtAmount = Math.max(0, Number(record.total_cost || 0) - Number(record.paid_amount || 0));

        importRows.push({
            [IMPORT_HEADERS[0]]: record.id,
            [IMPORT_HEADERS[1]]: formatDateOnly(record.import_date),
            [IMPORT_HEADERS[2]]: record.id,
            [IMPORT_HEADERS[3]]: formatDateOnly(record.invoice_date),
            [IMPORT_HEADERS[4]]: record.supplier_name || '',
            [IMPORT_HEADERS[5]]: record.supplier_tax_code || '',
            [IMPORT_HEADERS[6]]: record.invoice_number || '',
            [IMPORT_HEADERS[7]]: getInvoiceTypeLabel(record.invoice_type),
            [IMPORT_HEADERS[8]]: getPaymentMethodLabel(record.payment_method),
            [IMPORT_HEADERS[9]]: formatDateOnly(record.payment_date),
            [IMPORT_HEADERS[10]]: Number(record.paid_amount || 0),
            [IMPORT_HEADERS[11]]: Number(record.total_goods_amount || 0),
            [IMPORT_HEADERS[12]]: Number(record.total_vat_amount || 0),
            [IMPORT_HEADERS[13]]: Number(record.total_cost || 0),
            [IMPORT_HEADERS[14]]: debtAmount,
            [IMPORT_HEADERS[15]]: items.length,
            [IMPORT_HEADERS[16]]: attachments.length,
            [IMPORT_HEADERS[17]]: String(record.status || 'draft').toUpperCase(),
            [IMPORT_HEADERS[18]]: record.note || ''
        });

        items.forEach((item) => {
            itemRows.push({
                [ITEM_HEADERS[0]]: record.id,
                [ITEM_HEADERS[1]]: formatDateOnly(record.import_date),
                [ITEM_HEADERS[2]]: record.supplier_name || '',
                [ITEM_HEADERS[3]]: record.invoice_number || '',
                [ITEM_HEADERS[4]]: item.product_id || '',
                [ITEM_HEADERS[5]]: item.product_name || '',
                [ITEM_HEADERS[6]]: item.unit || '',
                [ITEM_HEADERS[7]]: Number(item.quantity || 0),
                [ITEM_HEADERS[8]]: Number(item.unit_price || 0),
                [ITEM_HEADERS[9]]: Number(item.vat_amount || 0),
                [ITEM_HEADERS[10]]: Number(item.total_amount || 0),
                [ITEM_HEADERS[11]]: String(record.status || 'draft').toUpperCase(),
                [ITEM_HEADERS[12]]: record.note || ''
            });
        });
    }

    if (importRows.length > 0) {
        await importsSheet.addRows(importRows);
    }

    if (itemRows.length > 0) {
        await itemsSheet.addRows(itemRows);
    }

    console.log(`Backfill hoàn tất: ${importRows.length} phiếu nhập, ${itemRows.length} dòng chi tiết.`);
}

main().catch((error) => {
    console.error('Backfill imports to sheets failed:', error);
    process.exit(1);
});
