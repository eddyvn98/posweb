const db = require('./bot_backend/db/connection');
const { v4: uuidv4 } = require('uuid');

async function seedData() {
    try {
        const email = 'eddyvn98@gmail.com';
        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

        if (!user) {
            console.error('User not found');
            return;
        }

        const shopId = user.shop_id;
        console.log(`Setting up data for Shop ID: ${shopId}`);

        // Sample products
        const products = [
            { id: uuidv4(), barcode: 'SP001', name: 'Nước suối Aquafina 500ml', price: 5000, cost_price: 3000, stock_quantity: 100 },
            { id: uuidv4(), barcode: 'SP002', name: 'Mì Hảo Hảo Tôm Chua Cay', price: 4500, cost_price: 3500, stock_quantity: 50 },
            { id: uuidv4(), barcode: 'SP003', name: 'Sữa tươi Vinamilk 180ml', price: 7000, cost_price: 5500, stock_quantity: 40 },
            { id: uuidv4(), barcode: 'SP004', name: 'Bánh mì Sài Gòn', price: 15000, cost_price: 10000, stock_quantity: 20 },
            { id: uuidv4(), barcode: 'SP005', name: 'Bia Heineken Lon 330ml', price: 22000, cost_price: 18000, stock_quantity: 24 }
        ];

        const insertProduct = db.prepare(`
            INSERT OR IGNORE INTO products (id, shop_id, barcode, name, price, cost_price, stock_quantity, unit)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'Cái')
        `);

        for (const p of products) {
            insertProduct.run(p.id, shopId, p.barcode, p.name, p.price, p.cost_price, p.stock_quantity);
        }

        console.log('Sample products seeded successfully');

    } catch (err) {
        console.error('Error seeding data:', err.message);
    }
}

seedData();
