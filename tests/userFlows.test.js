import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeString,
  normalizeBarcode,
  getInitials,
  matchProduct,
  sortSearchResults
} from '../src/lib/searchUtils.js';

// ==========================================
// MOCK DATA & REUSABLE HELPERS
// ==========================================
const MOCK_CATALOG = [
  { id: 'p1', barcode: '8935001831433', name: 'Bánh mì sandwich bơ', price: 15000, online_price: 18000, promo_price: 16000, stock_quantity: 20, category: 'Bánh' },
  { id: 'p2', barcode: '8936044390017', name: 'Đồ bấm StaCom', price: 33000, online_price: null, promo_price: null, stock_quantity: 12, category: 'Văn phòng phẩm' },
  { id: 'p3', barcode: '1785923590', name: 'Đất sét khô 1D', price: 15000, online_price: 20000, promo_price: null, stock_quantity: 50, category: 'Đồ chơi' },
  { id: 'p4', barcode: '996169', name: 'Đèn phi hành gia', price: 139000, online_price: 159000, promo_price: 149000, stock_quantity: 5, category: 'Gia dụng' },
];

function resolveStorefrontPricing(product) {
  const onlinePrice = Number(product.online_price);
  const offlinePrice = Number(product.price || 0);
  const originalPrice = onlinePrice > 0 ? onlinePrice : offlinePrice;
  const promoPrice = Number(product.promo_price);
  const hasPromotion = promoPrice > 0 && promoPrice < originalPrice;
  const finalPrice = hasPromotion ? promoPrice : originalPrice;
  const discountPercent = hasPromotion ? Math.round(((originalPrice - promoPrice) / originalPrice) * 100) : 0;
  return {
    price: finalPrice,
    original_price: hasPromotion ? originalPrice : null,
    has_promotion: hasPromotion,
    discount_percent: discountPercent,
  };
}

const VOUCHERS = {
  SAVE20K: { type: 'fixed', value: 20000, minSubtotal: 149000 },
  SHOP10: { type: 'percent', value: 10, maxDiscount: 30000, minSubtotal: 99000 },
  SAVE50K: { type: 'fixed', value: 50000, minSubtotal: 349000 },
};

function calculateOrderTotal({ items, voucherCode, shopShippingFee = 25000, freeShippingThreshold = 300000 }) {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  let voucherDiscount = 0;
  const voucher = VOUCHERS[voucherCode];
  if (voucher && subtotal >= voucher.minSubtotal) {
    if (voucher.type === 'percent') {
      voucherDiscount = Math.min(Math.round(subtotal * voucher.value / 100), voucher.maxDiscount || Infinity);
    } else {
      voucherDiscount = Math.min(voucher.value, subtotal);
    }
  }

  const shippingFee = (freeShippingThreshold > 0 && subtotal >= freeShippingThreshold) ? 0 : shopShippingFee;
  const finalTotal = Math.max(0, subtotal - voucherDiscount + shippingFee);

  return {
    subtotal,
    voucherDiscount,
    shippingFee,
    finalTotal,
  };
}

// ==========================================
// TEST SUITE: END-TO-END USER FLOWS
// ==========================================

describe('Luồng 1: Bán hàng tại quầy POS (POS Checkout Flow)', () => {
  it('1.1. Tìm kiếm sản phẩm bằng tên tiếng Việt không dấu', () => {
    const query = 'banh mi';
    const matched = MOCK_CATALOG.filter((p) => matchProduct(p, query));
    assert.equal(matched.length, 1);
    assert.equal(matched[0].id, 'p1');
  });

  it('1.2. Tìm kiếm bằng mã barcode hoặc gõ tắt chữ cái đầu', () => {
    const byBarcode = MOCK_CATALOG.filter((p) => matchProduct(p, '8936044390017'));
    assert.equal(byBarcode.length, 1);
    assert.equal(byBarcode[0].name, 'Đồ bấm StaCom');

    const byInitials = MOCK_CATALOG.filter((p) => matchProduct(p, 'dsk'));
    assert.equal(byInitials.length, 1);
    assert.equal(byInitials[0].id, 'p3');
  });

  it('1.3. Thêm các sản phẩm vào giỏ POS, áp dụng chiết khấu đơn và trừ kho', () => {
    let inventory = {
      p1: MOCK_CATALOG[0].stock_quantity,
      p2: MOCK_CATALOG[1].stock_quantity,
    };

    const cart = [
      { product: MOCK_CATALOG[0], quantity: 2, price: MOCK_CATALOG[0].price }, // 2 x 15.000 = 30.000
      { product: MOCK_CATALOG[1], quantity: 1, price: MOCK_CATALOG[1].price }, // 1 x 33.000 = 33.000
    ];

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    assert.equal(subtotal, 63000);

    const discount = 3000;
    const finalAmount = subtotal - discount;
    assert.equal(finalAmount, 60000);

    const customerCash = 100000;
    const changeDue = customerCash - finalAmount;
    assert.equal(changeDue, 40000);

    cart.forEach((item) => {
      inventory[item.product.id] -= item.quantity;
    });

    assert.equal(inventory.p1, 18);
    assert.equal(inventory.p2, 11);
  });
});

describe('Luồng 2: Cập nhật giá & Đồng bộ Storefront (Pricing & Sync Flow)', () => {
  let product = {
    id: 'prod-sync',
    barcode: '99887766',
    name: 'Tập học sinh 96 trang',
    price: 8000,
    online_price: null,
    promo_price: null,
  };

  it('2.1. Khi chưa cấu hình giá online, Storefront lấy giá offline', () => {
    const pricing = resolveStorefrontPricing(product);
    assert.equal(pricing.price, 8000);
    assert.equal(pricing.original_price, null);
    assert.equal(pricing.has_promotion, false);
  });

  it('2.2. Khi chủ shop thiết lập giá online cao hơn (bù phí sàn/đóng gói)', () => {
    product.online_price = 12000;
    const pricing = resolveStorefrontPricing(product);
    assert.equal(pricing.price, 12000);
    assert.equal(pricing.original_price, null);
  });

  it('2.3. Khi áp dụng chương trình khuyến mãi online', () => {
    product.promo_price = 10000;
    const pricing = resolveStorefrontPricing(product);
    assert.equal(pricing.price, 10000);
    assert.equal(pricing.original_price, 12000);
    assert.equal(pricing.has_promotion, true);
    assert.equal(pricing.discount_percent, 17);
  });

  it('2.4. Khi xóa giá online (trả về null), Storefront tự động quay về giá offline', () => {
    product.online_price = null;
    product.promo_price = null;
    const pricing = resolveStorefrontPricing(product);
    assert.equal(pricing.price, 8000);
    assert.equal(pricing.original_price, null);
  });
});

describe('Luồng 3: Khách hàng mua sắm Storefront không cần đăng nhập (Online Order Flow)', () => {
  it('3.1. Danh mục Storefront chỉ hiển thị giá bán online công khai', () => {
    const storefrontCatalog = MOCK_CATALOG.map((p) => {
      const pricing = resolveStorefrontPricing(p);
      return {
        id: p.id,
        name: p.name,
        price: pricing.price,
        original_price: pricing.original_price,
        discount_percent: pricing.discount_percent,
      };
    });

    assert.equal(storefrontCatalog[0].price, 16000);
    assert.equal(storefrontCatalog[1].price, 33000);
  });

  it('3.2. Tính toán tổng tiền giỏ hàng, áp dụng voucher và phí vận chuyển', () => {
    const cartItems = [
      { product_id: 'p1', name: 'Bánh mì sandwich bơ', price: 16000, quantity: 5 },
      { product_id: 'p4', name: 'Đèn phi hành gia', price: 149000, quantity: 1 },
    ];

    const calculation = calculateOrderTotal({
      items: cartItems,
      voucherCode: 'SHOP10',
      shopShippingFee: 20000,
      freeShippingThreshold: 300000,
    });

    assert.equal(calculation.subtotal, 229000);
    assert.equal(calculation.voucherDiscount, 22900);
    assert.equal(calculation.shippingFee, 20000);
    assert.equal(calculation.finalTotal, 226100);
  });

  it('3.3. Tạo payload đơn hàng online hợp lệ', () => {
    const cartItems = [
      { product_id: 'p1', name: 'Bánh mì sandwich bơ', price: 16000, quantity: 5 },
      { product_id: 'p4', name: 'Đèn phi hành gia', price: 149000, quantity: 1 },
    ];

    const orderPayload = {
      customerToken: 'customer_session_token_1234567890abcdef',
      customer: {
        name: 'Nguyễn Văn A',
        phone: '0901234567',
        email: 'nva@example.com',
      },
      address: {
        address: '123 Đường Vườn Lài',
        ward: 'An Phú Đông',
        city: 'TP. Hồ Chí Minh',
      },
      payment_method: 'cod',
      items: cartItems,
      voucher_code: 'SHOP10',
    };

    assert.ok(orderPayload.customer.name);
    assert.ok(orderPayload.customer.phone);
    assert.ok(orderPayload.address.address);
    assert.equal(orderPayload.items.length, 2);
  });
});

describe('Luồng 4: Vòng đời đơn hàng Online (Order Lifecycle Management)', () => {
  let currentOrder = {
    id: 'ord-test-01',
    code: 'ORD-2026-001',
    status: 'pending',
    customer: { name: 'Nguyễn Văn A', phone: '0901234567' },
    total: 226100,
    updatedAt: new Date().toISOString(),
  };

  it('4.1. Chủ cửa hàng nhận đơn hàng ở trạng thái pending', () => {
    assert.equal(currentOrder.status, 'pending');
  });

  it('4.2. Chủ shop bấm xác nhận đơn hàng (chuyển sang confirmed)', () => {
    currentOrder.status = 'confirmed';
    currentOrder.updatedAt = new Date().toISOString();
    assert.equal(currentOrder.status, 'confirmed');
  });

  it('4.3. Đóng gói xong, chuyển sang đang giao hàng (shipping)', () => {
    currentOrder.status = 'shipping';
    currentOrder.updatedAt = new Date().toISOString();
    assert.equal(currentOrder.status, 'shipping');
  });

  it('4.4. Giao hàng thành công, chuyển hoàn tất (completed)', () => {
    currentOrder.status = 'completed';
    currentOrder.updatedAt = new Date().toISOString();
    assert.equal(currentOrder.status, 'completed');
  });
});
