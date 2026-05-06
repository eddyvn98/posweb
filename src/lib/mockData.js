export const MOCK_CATEGORIES = [
    { id: 'c1', name: 'Thời Trang' },
    { id: 'c2', name: 'Điện Tử' },
    { id: 'c3', name: 'Phụ Kiện' }
];

export const MOCK_PRODUCTS = [
    { id: 'm1', name: 'Áo Thun Cotton Premium', barcode: '893000001', price: 250000, stock_quantity: 45, image_url: '/static/mock_images/m1.jpg', category: 'Thời Trang' },
    { id: 'm2', name: 'Quần Jeans Slim Fit', barcode: '893000002', price: 450000, stock_quantity: 20, image_url: '/static/mock_images/m2.jpg', category: 'Thời Trang' },
    { id: 'm3', name: 'Giày Sneaker Streetwear', barcode: '893000003', price: 850000, stock_quantity: 12, image_url: '/static/mock_images/m3.jpg', category: 'Thời Trang' },
    { id: 'm4', name: 'Mũ Lưỡi Trai Unisex', barcode: '893000004', price: 120000, stock_quantity: 50, image_url: '/static/mock_images/m4.jpg', category: 'Phụ Kiện' },
    { id: 'm5', name: 'Balo Laptop Chống Nước', barcode: '893000005', price: 650000, stock_quantity: 8, image_url: '/static/mock_images/m5.jpg', category: 'Phụ Kiện' },
    { id: 'm6', name: 'Tai Nghe Bluetooth Pro', barcode: '893000006', price: 1250000, stock_quantity: 15, image_url: '/static/mock_images/m6.jpg', category: 'Điện Tử' },
    { id: 'm8', name: 'Cáp Sạc Nhanh 20W', barcode: '893000008', price: 150000, stock_quantity: 60, image_url: '/static/mock_images/m8.jpg', category: 'Điện Tử' },
    { id: 'm10', name: 'Ví Da Nam Cầm Tay', barcode: '893000010', price: 320000, stock_quantity: 18, image_url: '/static/mock_images/m10.jpg', category: 'Phụ Kiện' },
    { id: 'm11', name: 'Áo Khoác Gió Bomber', barcode: '893000011', price: 550000, stock_quantity: 5, image_url: '/static/mock_images/m11.jpg', category: 'Thời Trang' },
    { id: 'm12', name: 'Túi Đeo Chéo Canvas', barcode: '893000012', price: 180000, stock_quantity: 30, image_url: '/static/mock_images/m12.jpg', category: 'Phụ Kiện' },
];

const generateSales = () => {
    const sales = [];
    const now = new Date();
    
    // Generate 30 sales spread over the last 3 days
    for (let i = 0; i < 30; i++) {
        const saleDate = new Date(now);
        saleDate.setHours(now.getHours() - Math.floor(Math.random() * 72)); // within 72 hours
        
        const itemCount = Math.floor(Math.random() * 3) + 1;
        const items = [];
        let total = 0;
        
        for (let j = 0; j < itemCount; j++) {
            const p = MOCK_PRODUCTS[Math.floor(Math.random() * MOCK_PRODUCTS.length)];
            const qty = Math.floor(Math.random() * 2) + 1;
            items.push({
                product_id: p.id,
                name: p.name,
                price: p.price,
                quantity: qty,
                subtotal: p.price * qty
            });
            total += p.price * qty;
        }
        
        sales.push({
            code: `HD${1000 + i}`,
            total_amount: total,
            payment_method: Math.random() > 0.5 ? 'cash' : 'transfer',
            items: items,
            created_at: saleDate.toISOString(),
            synced: 1 // mock as synced so it shows up in history properly
        });
    }
    return sales;
};

export const MOCK_SALES = generateSales();

export const MOCK_CASHFLOWS = [
    { type: 'out', category: 'Chi phí mặt bằng', description: 'Thanh toán tiền thuê mặt bằng tháng này', amount: 5000000, created_at: new Date().toISOString() },
    { type: 'out', category: 'Tiền điện nước', description: 'Thanh toán hóa đơn điện nước', amount: 1250000, created_at: new Date().toISOString() },
    { type: 'out', category: 'Nhập hàng', description: 'Nhập thêm 50 áo thun premium', amount: 7500000, created_at: new Date().toISOString() },
    { type: 'in', category: 'Thu khác', description: 'Tiền thưởng từ nhà cung cấp', amount: 1000000, created_at: new Date().toISOString() },
];
