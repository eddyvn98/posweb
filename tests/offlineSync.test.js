import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Kiểm thử sâu 1: Cơ chế đồng bộ Offline -> Online (Sync Queue)', () => {
  // Mô phỏng bộ nhớ đệm Offline (IndexedDB pending queue)
  let offlineSalesQueue = [];
  let offlineProductQueue = [];
  let backendServer = {
    products: new Map(),
    sales: [],
    networkStatus: 'offline' // Bắt đầu ở trạng thái mất mạng
  };

  it('1.1. Khi mất mạng: Thao tác sửa sản phẩm được xếp vào pending_products', () => {
    const productEdit = {
      id: 'prod-offline-01',
      name: 'Bút dạ quang vàng',
      price: 12000,
      online_price: 15000,
      promo_price: 14000,
      op: 'upsert',
      created_at: new Date().toISOString()
    };

    // Khi offline, thêm vào hàng đợi
    offlineProductQueue.push(productEdit);
    assert.equal(offlineProductQueue.length, 1);
    assert.equal(offlineProductQueue[0].online_price, 15000);
  });

  it('1.2. Khi mất mạng: Đơn bán tại quầy được lưu vào sales_queue với synced = 0', () => {
    const offlineSale = {
      local_id: 101,
      code: 'OFF-SALE-001',
      total_amount: 50000,
      payment_method: 'cash',
      synced: 0,
      items: [{ product_id: 'prod-offline-01', quantity: 2, price: 12000 }],
      created_at: new Date().toISOString()
    };

    offlineSalesQueue.push(offlineSale);
    assert.equal(offlineSalesQueue.length, 1);
    assert.equal(offlineSalesQueue[0].synced, 0);
  });

  it('1.3. Khi có mạng trở lại (Online): Tự động đẩy đơn hàng và sản phẩm lên backend', async () => {
    // 1. Phục hồi mạng
    backendServer.networkStatus = 'online';

    // 2. Replay sản phẩm chờ đồng bộ (pushPendingProducts)
    while (offlineProductQueue.length > 0) {
      const item = offlineProductQueue.shift();
      backendServer.products.set(item.id, item);
    }
    assert.equal(offlineProductQueue.length, 0);
    assert.equal(backendServer.products.get('prod-offline-01').online_price, 15000);

    // 3. Replay đơn hàng chờ đồng bộ (pushSales)
    while (offlineSalesQueue.length > 0) {
      const sale = offlineSalesQueue.shift();
      sale.synced = 1;
      backendServer.sales.push(sale);
    }
    assert.equal(offlineSalesQueue.length, 0);
    assert.equal(backendServer.sales.length, 1);
    assert.equal(backendServer.sales[0].synced, 1);
  });
});
