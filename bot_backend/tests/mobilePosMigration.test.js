const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const Database = require('better-sqlite3')

test('existing SQLite sale history survives old NOT NULL product_id migration', () => {
  const db = new Database(':memory:')
  db.pragma('foreign_keys = ON')
  const sql = fs.readFileSync(path.resolve(__dirname, '../db/init.sql'), 'utf8')
  db.exec(sql)
  db.exec(`
    INSERT INTO shops (id, name) VALUES ('shop-a','A');
    INSERT INTO products (id,shop_id,barcode,name) VALUES ('prod-a','shop-a','BAR-A','Item A');
    INSERT INTO sales (id,shop_id,code,total_amount) VALUES ('sale-old','shop-a','HD-OLD',1000);
    DROP TABLE sale_items;
    CREATE TABLE sale_items (
      id TEXT PRIMARY KEY, sale_id TEXT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL REFERENCES products(id), quantity INTEGER NOT NULL,
      price REAL NOT NULL, product_name TEXT NOT NULL
    );
    INSERT INTO sale_items (id,sale_id,product_id,quantity,price,product_name)
      VALUES ('line-old','sale-old','prod-a',1,1000,'Item A');
  `)
  assert.equal(db.prepare("PRAGMA table_info(sale_items)").all().find(c => c.name === 'product_id').notnull, 1)
  const schemaFile = fs.readFileSync(path.resolve(__dirname, '../db/schema.js'), 'utf8')
  const mod = { exports: {} }
  new Function('require', 'module', 'exports', '__dirname', schemaFile)(
    (request) => request === './connection' ? db
      : request === 'fs' ? fs : request === 'path' ? path
      : require(request), mod, mod.exports, path.resolve(__dirname, '../db')
  )
  mod.exports.initSchema({ seedDefaults: false })
  assert.equal(db.prepare("PRAGMA table_info(sale_items)").all().find(c => c.name === 'product_id').notnull, 0)
  assert.equal(db.prepare("SELECT product_id FROM sale_items WHERE id='line-old'").get().product_id, 'prod-a')
  assert.equal(db.prepare("SELECT total_amount FROM sales WHERE id='sale-old'").get().total_amount, 1000)
  assert.equal(db.prepare('PRAGMA foreign_key_check').all().length, 0)
  mod.exports.initSchema({ seedDefaults: false })
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM sale_items').get().n, 1)
  db.close()
})
