const axios = require('axios');
const fs = require('fs');
const path = require('path');

const MOCK_PRODUCTS = [
    { id: 'm1', name: 'Áo Thun Cotton Premium', image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=400&q=80' },
    { id: 'm2', name: 'Quần Jeans Slim Fit', image_url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=400&q=80' },
    { id: 'm3', name: 'Giày Sneaker Streetwear', image_url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=400&q=80' },
    { id: 'm4', name: 'Mũ Lưỡi Trai Unisex', image_url: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=400&q=80' },
    { id: 'm5', name: 'Balo Laptop Chống Nước', image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=400&q=80' },
    { id: 'm6', name: 'Tai Nghe Bluetooth Pro', image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80' },
    { id: 'm7', name: 'Ốp Lưng Silicone iPhone', image_url: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=400&q=80' },
    { id: 'm8', name: 'Cáp Sạc Nhanh 20W', image_url: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=400&q=80' },
    { id: 'm9', name: 'Bình Nước Giữ Nhiệt 500ml', image_url: 'https://images.unsplash.com/photo-1544200175-ca6e80a7b323?auto=format&fit=crop&w=400&q=80' },
    { id: 'm10', name: 'Ví Da Nam Cầm Tay', image_url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=400&q=80' },
    { id: 'm11', name: 'Áo Khoác Gió Bomber', image_url: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=400&q=80' },
    { id: 'm12', name: 'Túi Đeo Chéo Canvas', image_url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=400&q=80' },
];

const downloadImage = async (url, filepath) => {
    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
    });
    return new Promise((resolve, reject) => {
        response.data.pipe(fs.createWriteStream(filepath))
            .on('error', reject)
            .once('close', () => resolve(filepath));
    });
};

const main = async () => {
    const targetDir = path.join(__dirname, '..', 'public', 'mock_images');
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }

    console.log(`🚀 Starting download of ${MOCK_PRODUCTS.length} images to ${targetDir}...`);

    for (const product of MOCK_PRODUCTS) {
        const filename = `${product.id}.jpg`;
        const filepath = path.join(targetDir, filename);
        try {
            await downloadImage(product.image_url, filepath);
            console.log(`✅ Downloaded: ${product.name} -> ${filename}`);
        } catch (err) {
            console.error(`❌ Failed to download ${product.name}:`, err.message);
        }
    }

    console.log('✨ All downloads complete.');
};

main();
