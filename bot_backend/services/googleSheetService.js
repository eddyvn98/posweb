const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const fs = require('fs');
const path = require('path');

const logFile = path.resolve(__dirname, '../sheets_sync.log');
const log = (msg) => {
    const entry = `[${new Date().toISOString()}] ${msg}\n`;
    fs.appendFileSync(logFile, entry);
    console.log(msg);
};

/**
 * Hàm chung để ghi dữ liệu vào một sheet cụ thể
 */
async function appendToSheet(tabName, rowData, headers) {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!spreadsheetId || !clientEmail || !privateKey) {
        log(`⚠️ Bỏ qua đồng bộ ${tabName}: Thiếu cấu hình .env`);
        return;
    }

    try {
        const auth = new JWT({
            email: clientEmail,
            key: privateKey,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const doc = new GoogleSpreadsheet(spreadsheetId, auth);
        await doc.loadInfo();

        // Tìm hoặc tạo sheet theo tên
        let sheet = doc.sheetsByTitle[tabName];
        if (!sheet) {
            log(`ℹ️ Đang tạo sheet mới: "${tabName}"`);
            sheet = await doc.addSheet({ title: tabName, headerValues: headers });
        } else {
            // Kiểm tra và cập nhật tiêu đề nếu có thay đổi (để chuẩn hóa theo luật 2026)
            try {
                await sheet.loadHeaderRow();
                const currentHeaders = sheet.headerValues;
                const isMatch = headers.every((h, i) => h === currentHeaders[i]) && headers.length === currentHeaders.length;

                if (!isMatch) {
                    log(`ℹ️ Cập nhật cấu trúc cột cho tab "${tabName}"...`);
                    await sheet.setHeaderRow(headers);
                }
            } catch (e) {
                await sheet.setHeaderRow(headers);
            }
        }

        // Mapping rowData to use the exact header keys to avoid mismatch
        await sheet.addRow(rowData);
        log(`✅ Thành công! Đã đồng bộ dữ liệu vào tab "${tabName}".`);
    } catch (error) {
        log(`❌ Lỗi đồng bộ tab "${tabName}": ${error.message}`);
    }
}

/**
 * Đồng bộ đơn hàng (Sổ doanh thu S1a-HKD)
 */
async function syncSale(sale, shopName) {
    const headers = ['Ngày ghi sổ', 'Số hiệu chứng từ', 'Diễn giải', 'Doanh thu (+)', 'Hình thức thanh toán', 'Chi Tiết'];
    const itemsStr = sale.items ? sale.items.map(i => `${i.product_name} (x${i.quantity})`).join(', ') : '';

    const rowData = {
        'Ngày ghi sổ': new Date(sale.sale_date || Date.now()).toLocaleString('vi-VN'),
        'Số hiệu chứng từ': sale.code,
        'Diễn giải': `Doanh thu bán hàng - Shop: ${shopName}`,
        'Doanh thu (+)': Number(sale.total_amount),
        'Hình thức thanh toán': sale.payment_method === 'cash' ? 'Tiền mặt' : 'Chuyển khoản',
        'Chi Tiết': itemsStr
    };

    return appendToSheet('Bán hàng', rowData, headers);
}

/**
 * Đồng bộ sản phẩm (khi thêm hoặc cập nhật)
 */
async function syncProduct(product, shopName) {
    const headers = ['Ngày Cập Nhật', 'Barcode', 'Mã Sản Phẩm', 'Tên Sản Phẩm', 'Giá Bán', 'Giá Vốn', 'Tồn Kho', 'Trạng Thái'];

    const rowData = {
        'Ngày Cập Nhật': new Date().toLocaleString('vi-VN'),
        'Barcode': product.barcode,
        'Mã Sản Phẩm': product.id,
        'Tên Sản Phẩm': product.name,
        'Giá Bán': Number(product.price),
        'Giá Vốn': Number(product.cost_price || 0),
        'Tồn Kho': Number(product.stock_quantity || 0),
        'Trạng Thái': product.is_active ? 'Đang bán' : 'Ngừng bán'
    };

    return appendToSheet('Sản phẩm', rowData, headers);
}

/**
 * Đồng bộ phiếu nhập kho (Sổ vật tư S2-HKD)
 */
async function syncImport(importData, shopName) {
    const headers = ['Ngày ghi sổ', 'Số hiệu chứng từ', 'Nhà cung cấp', 'Giá trị nhập (+)', 'Ghi chú'];

    const rowData = {
        'Ngày ghi sổ': new Date(importData.import_date).toLocaleString('vi-VN'),
        'Số hiệu chứng từ': importData.id || 'N/A',
        'Nhà cung cấp': importData.supplier_name,
        'Giá trị nhập (+)': Number(importData.total_cost),
        'Ghi chú': importData.note || ''
    };

    return appendToSheet('Nhập kho', rowData, headers);
}

/**
 * Đồng bộ dòng tiền (Sổ quỹ S6-HKD)
 */
async function syncCashFlow(cashFlow, shopName) {
    const headers = ['Ngày', 'Hạng mục', 'Diễn giải', 'Thu (+)', 'Chi (-)', 'Mã chứng từ'];

    const rowData = {
        'Ngày': new Date(cashFlow.created_at || Date.now()).toLocaleString('vi-VN'),
        'Hạng mục': cashFlow.category || 'Khác',
        'Diễn giải': cashFlow.description,
        'Thu (+)': cashFlow.type === 'in' ? Number(cashFlow.amount) : 0,
        'Chi (-)': cashFlow.type === 'out' ? Number(cashFlow.amount) : 0,
        'Mã chứng từ': cashFlow.ref_id || ''
    };

    return appendToSheet('Sổ quỹ', rowData, headers);
}

/**
 * Đồng bộ khi hủy đơn hàng (Đối soát)
 */
async function syncVoidSale(saleId, reason, shopName) {
    const headers = ['Ngày Hủy', 'Số hiệu đơn', 'Lý do hủy', 'Shop'];

    const rowData = {
        'Ngày Hủy': new Date().toLocaleString('vi-VN'),
        'Số hiệu đơn': saleId,
        'Lý do hủy': reason,
        'Shop': shopName
    };

    return appendToSheet('Đơn đã hủy', rowData, headers);
}

module.exports = {
    syncSale,
    syncProduct,
    syncImport,
    syncCashFlow,
    syncVoidSale
};
