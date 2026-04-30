import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, 'bot_backend/pos.db');
const db = new Database(dbPath);

console.log('🚀 Đang khởi tạo dữ liệu mock...');
console.log('Sử dụng DB tại:', dbPath);

try {
    // 1. Tạo Shop và User mock
    const shopId = uuidv4();
    const userId = uuidv4();
    const email = 'admin@posweb.com';
    const passwordHash = bcrypt.hashSync('123456', 10);

    // Xóa dữ liệu cũ nếu trùng tên cửa hàng mẫu để tránh lỗi UNIQUE nếu có
    db.prepare('DELETE FROM shops WHERE name = ?').run('Cửa hàng Mockup');
    db.prepare('DELETE FROM users WHERE email = ?').run(email);

    db.prepare('INSERT INTO shops (id, name) VALUES (?, ?)').run(shopId, 'Cửa hàng Mockup');
    db.prepare(`
        INSERT INTO users (id, shop_id, email, password, role) 
        VALUES (?, ?, ?, ?, 'owner')
    `).run(userId, shopId, email, passwordHash);

    console.log(`✅ Đã tạo tài khoản: ${email} / 123456`);

    // 2. Tạo Sản phẩm mock
    const products = [
        { id: uuidv4(), barcode: '89300001', name: 'Coca Cola 330ml', price: 10000, cost: 7000, stock: 50 },
        { id: uuidv4(), barcode: '89300002', name: 'Bánh mì Sài Gòn', price: 15000, cost: 5000, stock: 30 },
        { id: uuidv4(), barcode: '89300003', name: 'Sữa tươi Vinamilk', price: 8000, cost: 6500, stock: 100 },
        { id: uuidv4(), barcode: '89300004', name: 'Mì tôm Hảo Hảo', price: 5000, cost: 3800, stock: 200 },
    ];

    const insertProduct = db.prepare(`
        INSERT INTO products (id, shop_id, barcode, name, price, cost_price, stock_quantity)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const p of products) {
        insertProduct.run(p.id, shopId, p.barcode, p.name, p.price, p.cost, p.stock);
    }
    console.log('✅ Đã thêm 4 sản phẩm mẫu');

    // 3. Tạo một vài đơn hàng (Sales) mẫu
    const saleId = uuidv4();
    db.prepare(`
        INSERT INTO sales (id, shop_id, code, total_amount, payment_method, created_by)
        VALUES (?, ?, ?, ?, ?, ?)
    `).run(saleId, shopId, 'HD001', 25000, 'cash', userId);

    db.prepare(`
        INSERT INTO sale_items (id, sale_id, product_id, quantity, price, product_name)
        VALUES (?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), saleId, products[0].id, 1, 10000, products[0].name);

    db.prepare(`
        INSERT INTO sale_items (id, sale_id, product_id, quantity, price, product_name)
        VALUES (?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), saleId, products[1].id, 1, 15000, products[1].name);

    console.log('✅ Đã tạo 1 hóa đơn mẫu');
    console.log('\n✨ Xong! Bây giờ bạn có thể đăng nhập bằng admin@posweb.com / 123456');

} catch (error) {
    console.error('❌ Lỗi khi tạo dữ liệu:', error.message);
} finally {
    db.close();
}
