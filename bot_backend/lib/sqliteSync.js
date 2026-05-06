const db = require('../db/connection');
const { getAuthRepo } = require('../repositories/auth.repo');

async function ensureShopInSqlite(shopId) {
    if (!shopId) return false;
    
    // Check if it exists in SQLite
    const sqliteShop = db.prepare('SELECT id FROM shops WHERE id = ?').get(shopId);
    if (sqliteShop) return true;

    // If not, fetch from Auth Repo (which might be Mongo) and sync
    try {
        const authRepo = getAuthRepo();
        const shop = await authRepo.getShopById(shopId);
        
        if (shop) {
            console.log('Syncing shop to SQLite:', shopId);
            db.prepare('INSERT INTO shops (id, name, feature_flags) VALUES (?, ?, ?)').run(
                shop.id, 
                shop.name || 'Unknown Shop',
                typeof shop.feature_flags === 'string' ? shop.feature_flags : JSON.stringify(shop.feature_flags || {})
            );
            return true;
        }
    } catch (error) {
        console.error('Error syncing shop to SQLite:', error);
    }
    
    return false;
}

module.exports = { ensureShopInSqlite };
