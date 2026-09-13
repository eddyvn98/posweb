
export const MOCK_CATEGORIES = [
    {
        "id": "c1",
        "name": "Thời Trang"
    },
    {
        "id": "c2",
        "name": "Điện Tử"
    },
    {
        "id": "c3",
        "name": "Thực Phẩm"
    },
    {
        "id": "c4",
        "name": "Mỹ Phẩm"
    },
    {
        "id": "c5",
        "name": "Mẹ & Bé"
    },
    {
        "id": "c6",
        "name": "Gia Dụng"
    },
    {
        "id": "c7",
        "name": "Văn Phòng Phẩm"
    },
    {
        "id": "c8",
        "name": "Phụ Tùng Xe"
    },
    {
        "id": "c9",
        "name": "Hoa & Quà Tặng"
    },
    {
        "id": "c10",
        "name": "Thú Cưng"
    },
    {
        "id": "c11",
        "name": "Điện Nước & XD"
    },
    {
        "id": "c12",
        "name": "Đồ Thể Thao"
    },
    {
        "id": "c13",
        "name": "Vật Tư Nông Nghiệp"
    },
    {
        "id": "c14",
        "name": "TP Chức Năng"
    },
    {
        "id": "c15",
        "name": "Đồ Chơi & Mô Hình"
    },
    {
        "id": "c16",
        "name": "Nhạc Cụ"
    },
    {
        "id": "c17",
        "name": "Đồ Làm Bánh"
    },
    {
        "id": "c18",
        "name": "Nội Thất"
    }
];

export const MOCK_PRODUCTS = [
    {
        "id": "fashion_p1",
        "name": "Áo Sơ Mi Nam",
        "barcode": "FASHION1",
        "price": 200000,
        "stock_quantity": 21,
        "category": "Thời Trang",
        "classifications": "{\"Ngành\":\"Thời Trang\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=500"
    },
    {
        "id": "fashion_p1_v1",
        "parent_id": "fashion_p1",
        "name": "Áo Sơ Mi Nam",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 200000,
        "stock_quantity": 6,
        "category": "Thời Trang"
    ,
        "image_url": "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=500"},
    {
        "id": "fashion_p1_v2",
        "parent_id": "fashion_p1",
        "name": "Áo Sơ Mi Nam",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 200000,
        "stock_quantity": 7,
        "category": "Thời Trang"
    ,
        "image_url": "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=500"},
    {
        "id": "fashion_p1_v3",
        "parent_id": "fashion_p1",
        "name": "Áo Sơ Mi Nam",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 200000,
        "stock_quantity": 8,
        "category": "Thời Trang"
    ,
        "image_url": "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=500"},
    {
        "id": "fashion_p2",
        "name": "Váy Hoa Nữ",
        "barcode": "FASHION2",
        "price": 250000,
        "stock_quantity": 22,
        "category": "Thời Trang",
        "classifications": "{\"Ngành\":\"Thời Trang\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?q=80&w=500"
    },
    {
        "id": "fashion_p2_v1",
        "parent_id": "fashion_p2",
        "name": "Váy Hoa Nữ",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 250000,
        "stock_quantity": 6,
        "category": "Thời Trang"
    ,
        "image_url": "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?q=80&w=500"},
    {
        "id": "fashion_p2_v2",
        "parent_id": "fashion_p2",
        "name": "Váy Hoa Nữ",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 250000,
        "stock_quantity": 7,
        "category": "Thời Trang"
    ,
        "image_url": "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?q=80&w=500"},
    {
        "id": "fashion_p2_v3",
        "parent_id": "fashion_p2",
        "name": "Váy Hoa Nữ",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 250000,
        "stock_quantity": 8,
        "category": "Thời Trang"
    ,
        "image_url": "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?q=80&w=500"},
    {
        "id": "fashion_p3",
        "name": "Quần Jean Slimfit",
        "barcode": "FASHION3",
        "price": 300000,
        "stock_quantity": 23,
        "category": "Thời Trang",
        "classifications": "{\"Ngành\":\"Thời Trang\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=500"
    },
    {
        "id": "fashion_p4",
        "name": "Áo Khoác Bomber",
        "barcode": "FASHION4",
        "price": 350000,
        "stock_quantity": 24,
        "category": "Thời Trang",
        "classifications": "{\"Ngành\":\"Thời Trang\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1591047139829-d91aec06caea?q=80&w=500"
    },
    {
        "id": "fashion_p5",
        "name": "Chân Váy Công Sở",
        "barcode": "FASHION5",
        "price": 400000,
        "stock_quantity": 25,
        "category": "Thời Trang",
        "classifications": "{\"Ngành\":\"Thời Trang\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?q=80&w=500"
    },
    {
        "id": "fashion_p6",
        "name": "Áo Thun Polo",
        "barcode": "FASHION6",
        "price": 450000,
        "stock_quantity": 26,
        "category": "Thời Trang",
        "classifications": "{\"Ngành\":\"Thời Trang\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1581655353564-df123a1eb820?q=80&w=500"
    },
    {
        "id": "fashion_p7",
        "name": "Quần Tây Âu",
        "barcode": "FASHION7",
        "price": 500000,
        "stock_quantity": 27,
        "category": "Thời Trang",
        "classifications": "{\"Ngành\":\"Thời Trang\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1490481651871-ab68ff25d43d?q=80&w=500"
    },
    {
        "id": "fashion_p8",
        "name": "Áo Hoodie Unisex",
        "barcode": "FASHION8",
        "price": 550000,
        "stock_quantity": 28,
        "category": "Thời Trang",
        "classifications": "{\"Ngành\":\"Thời Trang\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1490481651871-ab68ff25d43d?q=80&w=500"
    },
    {
        "id": "fashion_p9",
        "name": "Đầm Dạ Hội",
        "barcode": "FASHION9",
        "price": 600000,
        "stock_quantity": 29,
        "category": "Thời Trang",
        "classifications": "{\"Ngành\":\"Thời Trang\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1490481651871-ab68ff25d43d?q=80&w=500"
    },
    {
        "id": "fashion_p10",
        "name": "Bộ Đồ Thể Thao",
        "barcode": "FASHION10",
        "price": 650000,
        "stock_quantity": 30,
        "category": "Thời Trang",
        "classifications": "{\"Ngành\":\"Thời Trang\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1490481651871-ab68ff25d43d?q=80&w=500"
    },
    {
        "id": "tech_p1",
        "name": "iPhone 15 Pro",
        "barcode": "TECH1",
        "price": 200000,
        "stock_quantity": 21,
        "category": "Điện Tử",
        "classifications": "{\"Ngành\":\"Điện Tử\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1616348436168-de43ad0db179?q=80&w=500"
    },
    {
        "id": "tech_p1_v1",
        "parent_id": "tech_p1",
        "name": "iPhone 15 Pro",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 200000,
        "stock_quantity": 6,
        "category": "Điện Tử"
    ,
        "image_url": "https://images.unsplash.com/photo-1616348436168-de43ad0db179?q=80&w=500"},
    {
        "id": "tech_p1_v2",
        "parent_id": "tech_p1",
        "name": "iPhone 15 Pro",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 200000,
        "stock_quantity": 7,
        "category": "Điện Tử"
    ,
        "image_url": "https://images.unsplash.com/photo-1616348436168-de43ad0db179?q=80&w=500"},
    {
        "id": "tech_p1_v3",
        "parent_id": "tech_p1",
        "name": "iPhone 15 Pro",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 200000,
        "stock_quantity": 8,
        "category": "Điện Tử"
    ,
        "image_url": "https://images.unsplash.com/photo-1616348436168-de43ad0db179?q=80&w=500"},
    {
        "id": "tech_p2",
        "name": "Laptop Dell XPS",
        "barcode": "TECH2",
        "price": 250000,
        "stock_quantity": 22,
        "category": "Điện Tử",
        "classifications": "{\"Ngành\":\"Điện Tử\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=500"
    },
    {
        "id": "tech_p2_v1",
        "parent_id": "tech_p2",
        "name": "Laptop Dell XPS",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 250000,
        "stock_quantity": 6,
        "category": "Điện Tử"
    ,
        "image_url": "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=500"},
    {
        "id": "tech_p2_v2",
        "parent_id": "tech_p2",
        "name": "Laptop Dell XPS",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 250000,
        "stock_quantity": 7,
        "category": "Điện Tử"
    ,
        "image_url": "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=500"},
    {
        "id": "tech_p2_v3",
        "parent_id": "tech_p2",
        "name": "Laptop Dell XPS",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 250000,
        "stock_quantity": 8,
        "category": "Điện Tử"
    ,
        "image_url": "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=500"},
    {
        "id": "tech_p3",
        "name": "Tai Nghe Sony",
        "barcode": "TECH3",
        "price": 300000,
        "stock_quantity": 23,
        "category": "Điện Tử",
        "classifications": "{\"Ngành\":\"Điện Tử\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=500"
    },
    {
        "id": "tech_p4",
        "name": "Chuột Logitech",
        "barcode": "TECH4",
        "price": 350000,
        "stock_quantity": 24,
        "category": "Điện Tử",
        "classifications": "{\"Ngành\":\"Điện Tử\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?q=80&w=500"
    },
    {
        "id": "tech_p5",
        "name": "Bàn Phím Cơ",
        "barcode": "TECH5",
        "price": 400000,
        "stock_quantity": 25,
        "category": "Điện Tử",
        "classifications": "{\"Ngành\":\"Điện Tử\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?q=80&w=500"
    },
    {
        "id": "tech_p6",
        "name": "Sạc Dự Phòng",
        "barcode": "TECH6",
        "price": 450000,
        "stock_quantity": 26,
        "category": "Điện Tử",
        "classifications": "{\"Ngành\":\"Điện Tử\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=500"
    },
    {
        "id": "tech_p7",
        "name": "Màn Hình 4K",
        "barcode": "TECH7",
        "price": 500000,
        "stock_quantity": 27,
        "category": "Điện Tử",
        "classifications": "{\"Ngành\":\"Điện Tử\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=500"
    },
    {
        "id": "tech_p8",
        "name": "Loa Bluetooth",
        "barcode": "TECH8",
        "price": 550000,
        "stock_quantity": 28,
        "category": "Điện Tử",
        "classifications": "{\"Ngành\":\"Điện Tử\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=500"
    },
    {
        "id": "tech_p9",
        "name": "Cáp Sạc Nhanh",
        "barcode": "TECH9",
        "price": 600000,
        "stock_quantity": 29,
        "category": "Điện Tử",
        "classifications": "{\"Ngành\":\"Điện Tử\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=500"
    },
    {
        "id": "tech_p10",
        "name": "Ổ Cứng SSD",
        "barcode": "TECH10",
        "price": 650000,
        "stock_quantity": 30,
        "category": "Điện Tử",
        "classifications": "{\"Ngành\":\"Điện Tử\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=500"
    },
    {
        "id": "food_p1",
        "name": "Bún Bò Huế",
        "barcode": "FOOD1",
        "price": 200000,
        "stock_quantity": 21,
        "category": "Thực Phẩm",
        "classifications": "{\"Ngành\":\"Thực Phẩm\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1624300629298-e9de39c13be5?q=80&w=500"
    },
    {
        "id": "food_p1_v1",
        "parent_id": "food_p1",
        "name": "Bún Bò Huế",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 200000,
        "stock_quantity": 6,
        "category": "Thực Phẩm"
    ,
        "image_url": "https://images.unsplash.com/photo-1624300629298-e9de39c13be5?q=80&w=500"},
    {
        "id": "food_p1_v2",
        "parent_id": "food_p1",
        "name": "Bún Bò Huế",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 200000,
        "stock_quantity": 7,
        "category": "Thực Phẩm"
    ,
        "image_url": "https://images.unsplash.com/photo-1624300629298-e9de39c13be5?q=80&w=500"},
    {
        "id": "food_p1_v3",
        "parent_id": "food_p1",
        "name": "Bún Bò Huế",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 200000,
        "stock_quantity": 8,
        "category": "Thực Phẩm"
    ,
        "image_url": "https://images.unsplash.com/photo-1624300629298-e9de39c13be5?q=80&w=500"},
    {
        "id": "food_p2",
        "name": "Cơm Tấm Sườn",
        "barcode": "FOOD2",
        "price": 250000,
        "stock_quantity": 22,
        "category": "Thực Phẩm",
        "classifications": "{\"Ngành\":\"Thực Phẩm\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?q=80&w=500"
    },
    {
        "id": "food_p2_v1",
        "parent_id": "food_p2",
        "name": "Cơm Tấm Sườn",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 250000,
        "stock_quantity": 6,
        "category": "Thực Phẩm"
    ,
        "image_url": "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?q=80&w=500"},
    {
        "id": "food_p2_v2",
        "parent_id": "food_p2",
        "name": "Cơm Tấm Sườn",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 250000,
        "stock_quantity": 7,
        "category": "Thực Phẩm"
    ,
        "image_url": "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?q=80&w=500"},
    {
        "id": "food_p2_v3",
        "parent_id": "food_p2",
        "name": "Cơm Tấm Sườn",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 250000,
        "stock_quantity": 8,
        "category": "Thực Phẩm"
    ,
        "image_url": "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?q=80&w=500"},
    {
        "id": "food_p3",
        "name": "Bánh Mì Đặc Biệt",
        "barcode": "FOOD3",
        "price": 300000,
        "stock_quantity": 23,
        "category": "Thực Phẩm",
        "classifications": "{\"Ngành\":\"Thực Phẩm\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1600454021970-351feb4a2747?q=80&w=500"
    },
    {
        "id": "food_p4",
        "name": "Trà Đào Cam Sả",
        "barcode": "FOOD4",
        "price": 350000,
        "stock_quantity": 24,
        "category": "Thực Phẩm",
        "classifications": "{\"Ngành\":\"Thực Phẩm\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1556679343-c7306c1976bc?q=80&w=500"
    },
    {
        "id": "food_p5",
        "name": "Cafe Muối",
        "barcode": "FOOD5",
        "price": 400000,
        "stock_quantity": 25,
        "category": "Thực Phẩm",
        "classifications": "{\"Ngành\":\"Thực Phẩm\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1541167760496-16295508e7f3?q=80&w=500"
    },
    {
        "id": "food_p6",
        "name": "Phở Thìn Hà Nội",
        "barcode": "FOOD6",
        "price": 450000,
        "stock_quantity": 26,
        "category": "Thực Phẩm",
        "classifications": "{\"Ngành\":\"Thực Phẩm\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?q=80&w=500"
    },
    {
        "id": "food_p7",
        "name": "Gà Rán Giòn",
        "barcode": "FOOD7",
        "price": 500000,
        "stock_quantity": 27,
        "category": "Thực Phẩm",
        "classifications": "{\"Ngành\":\"Thực Phẩm\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1562967914-608f82629710?q=80&w=500"
    },
    {
        "id": "food_p8",
        "name": "Pizza Hải Sản",
        "barcode": "FOOD8",
        "price": 550000,
        "stock_quantity": 28,
        "category": "Thực Phẩm",
        "classifications": "{\"Ngành\":\"Thực Phẩm\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=500"
    },
    {
        "id": "food_p9",
        "name": "Sushi Tổng Hợp",
        "barcode": "FOOD9",
        "price": 600000,
        "stock_quantity": 29,
        "category": "Thực Phẩm",
        "classifications": "{\"Ngành\":\"Thực Phẩm\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=500"
    },
    {
        "id": "food_p10",
        "name": "Lẩu Thái",
        "barcode": "FOOD10",
        "price": 650000,
        "stock_quantity": 30,
        "category": "Thực Phẩm",
        "classifications": "{\"Ngành\":\"Thực Phẩm\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1552611052-33e04de081de?q=80&w=500"
    },
    {
        "id": "food_p11",
        "name": "Coca Cola Lon",
        "barcode": "COCA1",
        "price": 15000,
        "stock_quantity": 100,
        "category": "Thực Phẩm",
        "classifications": "{\"Ngành\":\"Thực Phẩm\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=500"
    },
    {
        "id": "beauty_p1",
        "name": "Son MAC Matte",
        "barcode": "BEAUTY1",
        "price": 200000,
        "stock_quantity": 21,
        "category": "Mỹ Phẩm",
        "classifications": "{\"Ngành\":\"Mỹ Phẩm\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1586495764447-6f97a3d2bb8b?q=80&w=500"
    },
    {
        "id": "beauty_p1_v1",
        "parent_id": "beauty_p1",
        "name": "Son MAC Matte",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 200000,
        "stock_quantity": 6,
        "category": "Mỹ Phẩm"
    ,
        "image_url": "https://images.unsplash.com/photo-1586495764447-6f97a3d2bb8b?q=80&w=500"},
    {
        "id": "beauty_p1_v2",
        "parent_id": "beauty_p1",
        "name": "Son MAC Matte",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 200000,
        "stock_quantity": 7,
        "category": "Mỹ Phẩm"
    ,
        "image_url": "https://images.unsplash.com/photo-1586495764447-6f97a3d2bb8b?q=80&w=500"},
    {
        "id": "beauty_p1_v3",
        "parent_id": "beauty_p1",
        "name": "Son MAC Matte",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 200000,
        "stock_quantity": 8,
        "category": "Mỹ Phẩm"
    ,
        "image_url": "https://images.unsplash.com/photo-1586495764447-6f97a3d2bb8b?q=80&w=500"},
    {
        "id": "beauty_p2",
        "name": "Kem Chống Nắng",
        "barcode": "BEAUTY2",
        "price": 250000,
        "stock_quantity": 22,
        "category": "Mỹ Phẩm",
        "classifications": "{\"Ngành\":\"Mỹ Phẩm\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1612817288484-6f916006741a?q=80&w=500"
    },
    {
        "id": "beauty_p2_v1",
        "parent_id": "beauty_p2",
        "name": "Kem Chống Nắng",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 250000,
        "stock_quantity": 6,
        "category": "Mỹ Phẩm"
    ,
        "image_url": "https://images.unsplash.com/photo-1612817288484-6f916006741a?q=80&w=500"},
    {
        "id": "beauty_p2_v2",
        "parent_id": "beauty_p2",
        "name": "Kem Chống Nắng",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 250000,
        "stock_quantity": 7,
        "category": "Mỹ Phẩm"
    ,
        "image_url": "https://images.unsplash.com/photo-1612817288484-6f916006741a?q=80&w=500"},
    {
        "id": "beauty_p2_v3",
        "parent_id": "beauty_p2",
        "name": "Kem Chống Nắng",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 250000,
        "stock_quantity": 8,
        "category": "Mỹ Phẩm"
    ,
        "image_url": "https://images.unsplash.com/photo-1612817288484-6f916006741a?q=80&w=500"},
    {
        "id": "beauty_p3",
        "name": "Serum Vitamin C",
        "barcode": "BEAUTY3",
        "price": 300000,
        "stock_quantity": 23,
        "category": "Mỹ Phẩm",
        "classifications": "{\"Ngành\":\"Mỹ Phẩm\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=500"
    },
    {
        "id": "beauty_p4",
        "name": "Nước Hoa Chanel",
        "barcode": "BEAUTY4",
        "price": 350000,
        "stock_quantity": 24,
        "category": "Mỹ Phẩm",
        "classifications": "{\"Ngành\":\"Mỹ Phẩm\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=500"
    },
    {
        "id": "beauty_p5",
        "name": "Phấn Nền Dior",
        "barcode": "BEAUTY5",
        "price": 400000,
        "stock_quantity": 25,
        "category": "Mỹ Phẩm",
        "classifications": "{\"Ngành\":\"Mỹ Phẩm\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1586495764447-6f97a3d2bb8b?q=80&w=500"
    },
    {
        "id": "beauty_p6",
        "name": "Mặt Nạ Dưỡng Da",
        "barcode": "BEAUTY6",
        "price": 450000,
        "stock_quantity": 26,
        "category": "Mỹ Phẩm",
        "classifications": "{\"Ngành\":\"Mỹ Phẩm\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1586495764447-6f97a3d2bb8b?q=80&w=500"
    },
    {
        "id": "beauty_p7",
        "name": "Dầu Gội Biotin",
        "barcode": "BEAUTY7",
        "price": 500000,
        "stock_quantity": 27,
        "category": "Mỹ Phẩm",
        "classifications": "{\"Ngành\":\"Mỹ Phẩm\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1586495764447-6f97a3d2bb8b?q=80&w=500"
    },
    {
        "id": "beauty_p8",
        "name": "Sữa Rửa Mặt",
        "barcode": "BEAUTY8",
        "price": 550000,
        "stock_quantity": 28,
        "category": "Mỹ Phẩm",
        "classifications": "{\"Ngành\":\"Mỹ Phẩm\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1550583724-125581cc2556?q=80&w=500"
    },
    {
        "id": "beauty_p9",
        "name": "Kẻ Mắt Nước",
        "barcode": "BEAUTY9",
        "price": 600000,
        "stock_quantity": 29,
        "category": "Mỹ Phẩm",
        "classifications": "{\"Ngành\":\"Mỹ Phẩm\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1586495764447-6f97a3d2bb8b?q=80&w=500"
    },
    {
        "id": "beauty_p10",
        "name": "Tẩy Trang",
        "barcode": "BEAUTY10",
        "price": 650000,
        "stock_quantity": 30,
        "category": "Mỹ Phẩm",
        "classifications": "{\"Ngành\":\"Mỹ Phẩm\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1586495764447-6f97a3d2bb8b?q=80&w=500"
    },
    {
        "id": "baby_p1",
        "name": "Bỉm Merries",
        "barcode": "BABY1",
        "price": 200000,
        "stock_quantity": 21,
        "category": "Mẹ & Bé",
        "classifications": "{\"Ngành\":\"Mẹ & Bé\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1515488764276-beab7607c1e6?q=80&w=500"
    },
    {
        "id": "baby_p1_v1",
        "parent_id": "baby_p1",
        "name": "Bỉm Merries",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 200000,
        "stock_quantity": 6,
        "category": "Mẹ & Bé"
    ,
        "image_url": "https://images.unsplash.com/photo-1515488764276-beab7607c1e6?q=80&w=500"},
    {
        "id": "baby_p1_v2",
        "parent_id": "baby_p1",
        "name": "Bỉm Merries",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 200000,
        "stock_quantity": 7,
        "category": "Mẹ & Bé"
    ,
        "image_url": "https://images.unsplash.com/photo-1515488764276-beab7607c1e6?q=80&w=500"},
    {
        "id": "baby_p1_v3",
        "parent_id": "baby_p1",
        "name": "Bỉm Merries",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 200000,
        "stock_quantity": 8,
        "category": "Mẹ & Bé"
    ,
        "image_url": "https://images.unsplash.com/photo-1515488764276-beab7607c1e6?q=80&w=500"},
    {
        "id": "baby_p2",
        "name": "Sữa Abbott",
        "barcode": "BABY2",
        "price": 250000,
        "stock_quantity": 22,
        "category": "Mẹ & Bé",
        "classifications": "{\"Ngành\":\"Mẹ & Bé\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1550583724-125581cc2556?q=80&w=500"
    },
    {
        "id": "baby_p2_v1",
        "parent_id": "baby_p2",
        "name": "Sữa Abbott",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 250000,
        "stock_quantity": 6,
        "category": "Mẹ & Bé"
    ,
        "image_url": "https://images.unsplash.com/photo-1550583724-125581cc2556?q=80&w=500"},
    {
        "id": "baby_p2_v2",
        "parent_id": "baby_p2",
        "name": "Sữa Abbott",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 250000,
        "stock_quantity": 7,
        "category": "Mẹ & Bé"
    ,
        "image_url": "https://images.unsplash.com/photo-1550583724-125581cc2556?q=80&w=500"},
    {
        "id": "baby_p2_v3",
        "parent_id": "baby_p2",
        "name": "Sữa Abbott",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 250000,
        "stock_quantity": 8,
        "category": "Mẹ & Bé"
    ,
        "image_url": "https://images.unsplash.com/photo-1550583724-125581cc2556?q=80&w=500"},
    {
        "id": "baby_p3",
        "name": "Bình Sữa Avent",
        "barcode": "BABY3",
        "price": 300000,
        "stock_quantity": 23,
        "category": "Mẹ & Bé",
        "classifications": "{\"Ngành\":\"Mẹ & Bé\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1550583724-125581cc2556?q=80&w=500"
    },
    {
        "id": "baby_p4",
        "name": "Khăn Ướt Baby",
        "barcode": "BABY4",
        "price": 350000,
        "stock_quantity": 24,
        "category": "Mẹ & Bé",
        "classifications": "{\"Ngành\":\"Mẹ & Bé\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1515488764276-beab7607c1e6?q=80&w=500"
    },
    {
        "id": "baby_p5",
        "name": "Đồ Chơi Gỗ",
        "barcode": "BABY5",
        "price": 400000,
        "stock_quantity": 25,
        "category": "Mẹ & Bé",
        "classifications": "{\"Ngành\":\"Mẹ & Bé\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1515488764276-beab7607c1e6?q=80&w=500"
    },
    {
        "id": "baby_p6",
        "name": "Xe Đẩy Em Bé",
        "barcode": "BABY6",
        "price": 450000,
        "stock_quantity": 26,
        "category": "Mẹ & Bé",
        "classifications": "{\"Ngành\":\"Mẹ & Bé\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1515488764276-beab7607c1e6?q=80&w=500"
    },
    {
        "id": "baby_p7",
        "name": "Quần Áo Sơ Sinh",
        "barcode": "BABY7",
        "price": 500000,
        "stock_quantity": 27,
        "category": "Mẹ & Bé",
        "classifications": "{\"Ngành\":\"Mẹ & Bé\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1515488764276-beab7607c1e6?q=80&w=500"
    },
    {
        "id": "baby_p8",
        "name": "Ti Giả Silicon",
        "barcode": "BABY8",
        "price": 550000,
        "stock_quantity": 28,
        "category": "Mẹ & Bé",
        "classifications": "{\"Ngành\":\"Mẹ & Bé\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1515488764276-beab7607c1e6?q=80&w=500"
    },
    {
        "id": "baby_p9",
        "name": "Máy Hút Sữa",
        "barcode": "BABY9",
        "price": 600000,
        "stock_quantity": 29,
        "category": "Mẹ & Bé",
        "classifications": "{\"Ngành\":\"Mẹ & Bé\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1550583724-125581cc2556?q=80&w=500"
    },
    {
        "id": "baby_p10",
        "name": "Nôi Em Bé",
        "barcode": "BABY10",
        "price": 650000,
        "stock_quantity": 30,
        "category": "Mẹ & Bé",
        "classifications": "{\"Ngành\":\"Mẹ & Bé\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1515488764276-beab7607c1e6?q=80&w=500"
    },
    {
        "id": "home_p1",
        "name": "Nồi Chiên Không Dầu",
        "barcode": "HOME1",
        "price": 200000,
        "stock_quantity": 21,
        "category": "Gia Dụng",
        "classifications": "{\"Ngành\":\"Gia Dụng\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=500"
    },
    {
        "id": "home_p1_v1",
        "parent_id": "home_p1",
        "name": "Nồi Chiên Không Dầu",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 200000,
        "stock_quantity": 6,
        "category": "Gia Dụng"
    ,
        "image_url": "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=500"},
    {
        "id": "home_p1_v2",
        "parent_id": "home_p1",
        "name": "Nồi Chiên Không Dầu",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 200000,
        "stock_quantity": 7,
        "category": "Gia Dụng"
    ,
        "image_url": "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=500"},
    {
        "id": "home_p1_v3",
        "parent_id": "home_p1",
        "name": "Nồi Chiên Không Dầu",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 200000,
        "stock_quantity": 8,
        "category": "Gia Dụng"
    ,
        "image_url": "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=500"},
    {
        "id": "home_p2",
        "name": "Máy Hút Bụi",
        "barcode": "HOME2",
        "price": 250000,
        "stock_quantity": 22,
        "category": "Gia Dụng",
        "classifications": "{\"Ngành\":\"Gia Dụng\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=500"
    },
    {
        "id": "home_p2_v1",
        "parent_id": "home_p2",
        "name": "Máy Hút Bụi",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 250000,
        "stock_quantity": 6,
        "category": "Gia Dụng"
    ,
        "image_url": "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=500"},
    {
        "id": "home_p2_v2",
        "parent_id": "home_p2",
        "name": "Máy Hút Bụi",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 250000,
        "stock_quantity": 7,
        "category": "Gia Dụng"
    ,
        "image_url": "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=500"},
    {
        "id": "home_p2_v3",
        "parent_id": "home_p2",
        "name": "Máy Hút Bụi",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 250000,
        "stock_quantity": 8,
        "category": "Gia Dụng"
    ,
        "image_url": "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=500"},
    {
        "id": "home_p3",
        "name": "Bộ Nồi Inox",
        "barcode": "HOME3",
        "price": 300000,
        "stock_quantity": 23,
        "category": "Gia Dụng",
        "classifications": "{\"Ngành\":\"Gia Dụng\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=500"
    },
    {
        "id": "home_p4",
        "name": "Máy Lọc Nước",
        "barcode": "HOME4",
        "price": 350000,
        "stock_quantity": 24,
        "category": "Gia Dụng",
        "classifications": "{\"Ngành\":\"Gia Dụng\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=500"
    },
    {
        "id": "home_p5",
        "name": "Đèn Ngủ Decor",
        "barcode": "HOME5",
        "price": 400000,
        "stock_quantity": 25,
        "category": "Gia Dụng",
        "classifications": "{\"Ngành\":\"Gia Dụng\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=500"
    },
    {
        "id": "home_p6",
        "name": "Thảm Silicon",
        "barcode": "HOME6",
        "price": 450000,
        "stock_quantity": 26,
        "category": "Gia Dụng",
        "classifications": "{\"Ngành\":\"Gia Dụng\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=500"
    },
    {
        "id": "home_p7",
        "name": "Kệ Đựng Đồ",
        "barcode": "HOME7",
        "price": 500000,
        "stock_quantity": 27,
        "category": "Gia Dụng",
        "classifications": "{\"Ngành\":\"Gia Dụng\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=500"
    },
    {
        "id": "home_p8",
        "name": "Bàn Ủi Hơi Nước",
        "barcode": "HOME8",
        "price": 550000,
        "stock_quantity": 28,
        "category": "Gia Dụng",
        "classifications": "{\"Ngành\":\"Gia Dụng\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=500"
    },
    {
        "id": "home_p9",
        "name": "Máy Xay Sinh Tố",
        "barcode": "HOME9",
        "price": 600000,
        "stock_quantity": 29,
        "category": "Gia Dụng",
        "classifications": "{\"Ngành\":\"Gia Dụng\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=500"
    },
    {
        "id": "home_p10",
        "name": "Ấm Siêu Tốc",
        "barcode": "HOME10",
        "price": 650000,
        "stock_quantity": 30,
        "category": "Gia Dụng",
        "classifications": "{\"Ngành\":\"Gia Dụng\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=500"
    },
    {
        "id": "office_p1",
        "name": "Sổ Tay Planner",
        "barcode": "OFFICE1",
        "price": 200000,
        "stock_quantity": 21,
        "category": "Văn Phòng Phẩm",
        "classifications": "{\"Ngành\":\"Văn Phòng Phẩm\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1586075010473-c399c3098ca0?q=80&w=500"
    },
    {
        "id": "office_p1_v1",
        "parent_id": "office_p1",
        "name": "Sổ Tay Planner",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 200000,
        "stock_quantity": 6,
        "category": "Văn Phòng Phẩm"
    ,
        "image_url": "https://images.unsplash.com/photo-1586075010473-c399c3098ca0?q=80&w=500"},
    {
        "id": "office_p1_v2",
        "parent_id": "office_p1",
        "name": "Sổ Tay Planner",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 200000,
        "stock_quantity": 7,
        "category": "Văn Phòng Phẩm"
    ,
        "image_url": "https://images.unsplash.com/photo-1586075010473-c399c3098ca0?q=80&w=500"},
    {
        "id": "office_p1_v3",
        "parent_id": "office_p1",
        "name": "Sổ Tay Planner",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 200000,
        "stock_quantity": 8,
        "category": "Văn Phòng Phẩm"
    ,
        "image_url": "https://images.unsplash.com/photo-1586075010473-c399c3098ca0?q=80&w=500"},
    {
        "id": "office_p2",
        "name": "Bút Bi Thiên Long",
        "barcode": "OFFICE2",
        "price": 250000,
        "stock_quantity": 22,
        "category": "Văn Phòng Phẩm",
        "classifications": "{\"Ngành\":\"Văn Phòng Phẩm\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1586075010473-c399c3098ca0?q=80&w=500"
    },
    {
        "id": "office_p2_v1",
        "parent_id": "office_p2",
        "name": "Bút Bi Thiên Long",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 250000,
        "stock_quantity": 6,
        "category": "Văn Phòng Phẩm"
    ,
        "image_url": "https://images.unsplash.com/photo-1586075010473-c399c3098ca0?q=80&w=500"},
    {
        "id": "office_p2_v2",
        "parent_id": "office_p2",
        "name": "Bút Bi Thiên Long",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 250000,
        "stock_quantity": 7,
        "category": "Văn Phòng Phẩm"
    ,
        "image_url": "https://images.unsplash.com/photo-1586075010473-c399c3098ca0?q=80&w=500"},
    {
        "id": "office_p2_v3",
        "parent_id": "office_p2",
        "name": "Bút Bi Thiên Long",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 250000,
        "stock_quantity": 8,
        "category": "Văn Phòng Phẩm"
    ,
        "image_url": "https://images.unsplash.com/photo-1586075010473-c399c3098ca0?q=80&w=500"},
    {
        "id": "office_p3",
        "name": "Giấy A4 Double A",
        "barcode": "OFFICE3",
        "price": 300000,
        "stock_quantity": 23,
        "category": "Văn Phòng Phẩm",
        "classifications": "{\"Ngành\":\"Văn Phòng Phẩm\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1586075010473-c399c3098ca0?q=80&w=500"
    },
    {
        "id": "office_p4",
        "name": "Băng Keo 2 Mặt",
        "barcode": "OFFICE4",
        "price": 350000,
        "stock_quantity": 24,
        "category": "Văn Phòng Phẩm",
        "classifications": "{\"Ngành\":\"Văn Phòng Phẩm\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1586075010473-c399c3098ca0?q=80&w=500"
    },
    {
        "id": "office_p5",
        "name": "Kẹp Bướm",
        "barcode": "OFFICE5",
        "price": 400000,
        "stock_quantity": 25,
        "category": "Văn Phòng Phẩm",
        "classifications": "{\"Ngành\":\"Văn Phòng Phẩm\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1586075010473-c399c3098ca0?q=80&w=500"
    },
    {
        "id": "office_p6",
        "name": "Máy Tính Casio",
        "barcode": "OFFICE6",
        "price": 450000,
        "stock_quantity": 26,
        "category": "Văn Phòng Phẩm",
        "classifications": "{\"Ngành\":\"Văn Phòng Phẩm\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1586075010473-c399c3098ca0?q=80&w=500"
    },
    {
        "id": "office_p7",
        "name": "Bút Dạ Quang",
        "barcode": "OFFICE7",
        "price": 500000,
        "stock_quantity": 27,
        "category": "Văn Phòng Phẩm",
        "classifications": "{\"Ngành\":\"Văn Phòng Phẩm\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1586075010473-c399c3098ca0?q=80&w=500"
    },
    {
        "id": "office_p8",
        "name": "Ghim Bấm",
        "barcode": "OFFICE8",
        "price": 550000,
        "stock_quantity": 28,
        "category": "Văn Phòng Phẩm",
        "classifications": "{\"Ngành\":\"Văn Phòng Phẩm\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1586075010473-c399c3098ca0?q=80&w=500"
    },
    {
        "id": "office_p9",
        "name": "Bìa Hồ Sơ",
        "barcode": "OFFICE9",
        "price": 600000,
        "stock_quantity": 29,
        "category": "Văn Phòng Phẩm",
        "classifications": "{\"Ngành\":\"Văn Phòng Phẩm\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1586075010473-c399c3098ca0?q=80&w=500"
    },
    {
        "id": "office_p10",
        "name": "Thước Kẻ",
        "barcode": "OFFICE10",
        "price": 650000,
        "stock_quantity": 30,
        "category": "Văn Phòng Phẩm",
        "classifications": "{\"Ngành\":\"Văn Phòng Phẩm\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1586075010473-c399c3098ca0?q=80&w=500"
    },
    {
        "id": "auto_p1",
        "name": "Nhớt Motul 7100",
        "barcode": "AUTO1",
        "price": 200000,
        "stock_quantity": 21,
        "category": "Phụ Tùng Xe",
        "classifications": "{\"Ngành\":\"Phụ Tùng Xe\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1492144531280-a245329472e4?q=80&w=500"
    },
    {
        "id": "auto_p1_v1",
        "parent_id": "auto_p1",
        "name": "Nhớt Motul 7100",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 200000,
        "stock_quantity": 6,
        "category": "Phụ Tùng Xe"
    ,
        "image_url": "https://images.unsplash.com/photo-1492144531280-a245329472e4?q=80&w=500"},
    {
        "id": "auto_p1_v2",
        "parent_id": "auto_p1",
        "name": "Nhớt Motul 7100",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 200000,
        "stock_quantity": 7,
        "category": "Phụ Tùng Xe"
    ,
        "image_url": "https://images.unsplash.com/photo-1492144531280-a245329472e4?q=80&w=500"},
    {
        "id": "auto_p1_v3",
        "parent_id": "auto_p1",
        "name": "Nhớt Motul 7100",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 200000,
        "stock_quantity": 8,
        "category": "Phụ Tùng Xe"
    ,
        "image_url": "https://images.unsplash.com/photo-1492144531280-a245329472e4?q=80&w=500"},
    {
        "id": "auto_p2",
        "name": "Lốp Michelin",
        "barcode": "AUTO2",
        "price": 250000,
        "stock_quantity": 22,
        "category": "Phụ Tùng Xe",
        "classifications": "{\"Ngành\":\"Phụ Tùng Xe\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1492144531280-a245329472e4?q=80&w=500"
    },
    {
        "id": "auto_p2_v1",
        "parent_id": "auto_p2",
        "name": "Lốp Michelin",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 250000,
        "stock_quantity": 6,
        "category": "Phụ Tùng Xe"
    ,
        "image_url": "https://images.unsplash.com/photo-1492144531280-a245329472e4?q=80&w=500"},
    {
        "id": "auto_p2_v2",
        "parent_id": "auto_p2",
        "name": "Lốp Michelin",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 250000,
        "stock_quantity": 7,
        "category": "Phụ Tùng Xe"
    ,
        "image_url": "https://images.unsplash.com/photo-1492144531280-a245329472e4?q=80&w=500"},
    {
        "id": "auto_p2_v3",
        "parent_id": "auto_p2",
        "name": "Lốp Michelin",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 250000,
        "stock_quantity": 8,
        "category": "Phụ Tùng Xe"
    ,
        "image_url": "https://images.unsplash.com/photo-1492144531280-a245329472e4?q=80&w=500"},
    {
        "id": "auto_p3",
        "name": "Má Phanh Brembo",
        "barcode": "AUTO3",
        "price": 300000,
        "stock_quantity": 23,
        "category": "Phụ Tùng Xe",
        "classifications": "{\"Ngành\":\"Phụ Tùng Xe\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1492144531280-a245329472e4?q=80&w=500"
    },
    {
        "id": "auto_p4",
        "name": "Bugi Denso",
        "barcode": "AUTO4",
        "price": 350000,
        "stock_quantity": 24,
        "category": "Phụ Tùng Xe",
        "classifications": "{\"Ngành\":\"Phụ Tùng Xe\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1492144531280-a245329472e4?q=80&w=500"
    },
    {
        "id": "auto_p5",
        "name": "Dây Curoa Gates",
        "barcode": "AUTO5",
        "price": 400000,
        "stock_quantity": 25,
        "category": "Phụ Tùng Xe",
        "classifications": "{\"Ngành\":\"Phụ Tùng Xe\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1492144531280-a245329472e4?q=80&w=500"
    },
    {
        "id": "auto_p6",
        "name": "Ắc Quy GS",
        "barcode": "AUTO6",
        "price": 450000,
        "stock_quantity": 26,
        "category": "Phụ Tùng Xe",
        "classifications": "{\"Ngành\":\"Phụ Tùng Xe\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1492144531280-a245329472e4?q=80&w=500"
    },
    {
        "id": "auto_p7",
        "name": "Đèn Led Trợ Sáng",
        "barcode": "AUTO7",
        "price": 500000,
        "stock_quantity": 27,
        "category": "Phụ Tùng Xe",
        "classifications": "{\"Ngành\":\"Phụ Tùng Xe\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1492144531280-a245329472e4?q=80&w=500"
    },
    {
        "id": "auto_p8",
        "name": "Nón Bảo Hiểm Royal",
        "barcode": "AUTO8",
        "price": 550000,
        "stock_quantity": 28,
        "category": "Phụ Tùng Xe",
        "classifications": "{\"Ngành\":\"Phụ Tùng Xe\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1492144531280-a245329472e4?q=80&w=500"
    },
    {
        "id": "auto_p9",
        "name": "Gương Chiếu Hậu",
        "barcode": "AUTO9",
        "price": 600000,
        "stock_quantity": 29,
        "category": "Phụ Tùng Xe",
        "classifications": "{\"Ngành\":\"Phụ Tùng Xe\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1492144531280-a245329472e4?q=80&w=500"
    },
    {
        "id": "auto_p10",
        "name": "Nhông Sên Dĩa",
        "barcode": "AUTO10",
        "price": 650000,
        "stock_quantity": 30,
        "category": "Phụ Tùng Xe",
        "classifications": "{\"Ngành\":\"Phụ Tùng Xe\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1492144531280-a245329472e4?q=80&w=500"
    },
    {
        "id": "flower_p1",
        "name": "Bó Hoa Hồng Đỏ",
        "barcode": "FLOWER1",
        "price": 200000,
        "stock_quantity": 21,
        "category": "Hoa & Quà Tặng",
        "classifications": "{\"Ngành\":\"Hoa & Quà Tặng\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=500"
    },
    {
        "id": "flower_p1_v1",
        "parent_id": "flower_p1",
        "name": "Bó Hoa Hồng Đỏ",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 200000,
        "stock_quantity": 6,
        "category": "Hoa & Quà Tặng"
    ,
        "image_url": "https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=500"},
    {
        "id": "flower_p1_v2",
        "parent_id": "flower_p1",
        "name": "Bó Hoa Hồng Đỏ",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 200000,
        "stock_quantity": 7,
        "category": "Hoa & Quà Tặng"
    ,
        "image_url": "https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=500"},
    {
        "id": "flower_p1_v3",
        "parent_id": "flower_p1",
        "name": "Bó Hoa Hồng Đỏ",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 200000,
        "stock_quantity": 8,
        "category": "Hoa & Quà Tặng"
    ,
        "image_url": "https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=500"},
    {
        "id": "flower_p2",
        "name": "Lẵng Hoa Khai Trương",
        "barcode": "FLOWER2",
        "price": 250000,
        "stock_quantity": 22,
        "category": "Hoa & Quà Tặng",
        "classifications": "{\"Ngành\":\"Hoa & Quà Tặng\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=500"
    },
    {
        "id": "flower_p2_v1",
        "parent_id": "flower_p2",
        "name": "Lẵng Hoa Khai Trương",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 250000,
        "stock_quantity": 6,
        "category": "Hoa & Quà Tặng"
    ,
        "image_url": "https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=500"},
    {
        "id": "flower_p2_v2",
        "parent_id": "flower_p2",
        "name": "Lẵng Hoa Khai Trương",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 250000,
        "stock_quantity": 7,
        "category": "Hoa & Quà Tặng"
    ,
        "image_url": "https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=500"},
    {
        "id": "flower_p2_v3",
        "parent_id": "flower_p2",
        "name": "Lẵng Hoa Khai Trương",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 250000,
        "stock_quantity": 8,
        "category": "Hoa & Quà Tặng"
    ,
        "image_url": "https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=500"},
    {
        "id": "flower_p3",
        "name": "Gấu Bông Teddy",
        "barcode": "FLOWER3",
        "price": 300000,
        "stock_quantity": 23,
        "category": "Hoa & Quà Tặng",
        "classifications": "{\"Ngành\":\"Hoa & Quà Tặng\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=500"
    },
    {
        "id": "flower_p4",
        "name": "Nến Thơm Cao Cấp",
        "barcode": "FLOWER4",
        "price": 350000,
        "stock_quantity": 24,
        "category": "Hoa & Quà Tặng",
        "classifications": "{\"Ngành\":\"Hoa & Quà Tặng\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=500"
    },
    {
        "id": "flower_p5",
        "name": "Thiệp Chúc Mừng",
        "barcode": "FLOWER5",
        "price": 400000,
        "stock_quantity": 25,
        "category": "Hoa & Quà Tặng",
        "classifications": "{\"Ngành\":\"Hoa & Quà Tặng\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=500"
    },
    {
        "id": "flower_p6",
        "name": "Giỏ Quà Trái Cây",
        "barcode": "FLOWER6",
        "price": 450000,
        "stock_quantity": 26,
        "category": "Hoa & Quà Tặng",
        "classifications": "{\"Ngành\":\"Hoa & Quà Tặng\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=500"
    },
    {
        "id": "flower_p7",
        "name": "Hoa Lan Hồ Điệp",
        "barcode": "FLOWER7",
        "price": 500000,
        "stock_quantity": 27,
        "category": "Hoa & Quà Tặng",
        "classifications": "{\"Ngành\":\"Hoa & Quà Tặng\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=500"
    },
    {
        "id": "flower_p8",
        "name": "Hộp Quà Sang Trọng",
        "barcode": "FLOWER8",
        "price": 550000,
        "stock_quantity": 28,
        "category": "Hoa & Quà Tặng",
        "classifications": "{\"Ngành\":\"Hoa & Quà Tặng\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=500"
    },
    {
        "id": "flower_p9",
        "name": "Cây Sen Đá",
        "barcode": "FLOWER9",
        "price": 600000,
        "stock_quantity": 29,
        "category": "Hoa & Quà Tặng",
        "classifications": "{\"Ngành\":\"Hoa & Quà Tặng\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=500"
    },
    {
        "id": "flower_p10",
        "name": "Hoa Khô Decor",
        "barcode": "FLOWER10",
        "price": 650000,
        "stock_quantity": 30,
        "category": "Hoa & Quà Tặng",
        "classifications": "{\"Ngành\":\"Hoa & Quà Tặng\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=500"
    },
    {
        "id": "pet_p1",
        "name": "Hạt Cho Mèo",
        "barcode": "PET1",
        "price": 200000,
        "stock_quantity": 21,
        "category": "Thú Cưng",
        "classifications": "{\"Ngành\":\"Thú Cưng\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?q=80&w=500"
    },
    {
        "id": "pet_p1_v1",
        "parent_id": "pet_p1",
        "name": "Hạt Cho Mèo",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 200000,
        "stock_quantity": 6,
        "category": "Thú Cưng"
    ,
        "image_url": "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?q=80&w=500"},
    {
        "id": "pet_p1_v2",
        "parent_id": "pet_p1",
        "name": "Hạt Cho Mèo",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 200000,
        "stock_quantity": 7,
        "category": "Thú Cưng"
    ,
        "image_url": "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?q=80&w=500"},
    {
        "id": "pet_p1_v3",
        "parent_id": "pet_p1",
        "name": "Hạt Cho Mèo",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 200000,
        "stock_quantity": 8,
        "category": "Thú Cưng"
    ,
        "image_url": "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?q=80&w=500"},
    {
        "id": "pet_p2",
        "name": "Cát Vệ Sinh",
        "barcode": "PET2",
        "price": 250000,
        "stock_quantity": 22,
        "category": "Thú Cưng",
        "classifications": "{\"Ngành\":\"Thú Cưng\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?q=80&w=500"
    },
    {
        "id": "pet_p2_v1",
        "parent_id": "pet_p2",
        "name": "Cát Vệ Sinh",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 250000,
        "stock_quantity": 6,
        "category": "Thú Cưng"
    ,
        "image_url": "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?q=80&w=500"},
    {
        "id": "pet_p2_v2",
        "parent_id": "pet_p2",
        "name": "Cát Vệ Sinh",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 250000,
        "stock_quantity": 7,
        "category": "Thú Cưng"
    ,
        "image_url": "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?q=80&w=500"},
    {
        "id": "pet_p2_v3",
        "parent_id": "pet_p2",
        "name": "Cát Vệ Sinh",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 250000,
        "stock_quantity": 8,
        "category": "Thú Cưng"
    ,
        "image_url": "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?q=80&w=500"},
    {
        "id": "pet_p3",
        "name": "Pate Cho Chó",
        "barcode": "PET3",
        "price": 300000,
        "stock_quantity": 23,
        "category": "Thú Cưng",
        "classifications": "{\"Ngành\":\"Thú Cưng\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?q=80&w=500"
    },
    {
        "id": "pet_p4",
        "name": "Chuồng Thú Cưng",
        "barcode": "PET4",
        "price": 350000,
        "stock_quantity": 24,
        "category": "Thú Cưng",
        "classifications": "{\"Ngành\":\"Thú Cưng\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?q=80&w=500"
    },
    {
        "id": "pet_p5",
        "name": "Dây Dắt Chó",
        "barcode": "PET5",
        "price": 400000,
        "stock_quantity": 25,
        "category": "Thú Cưng",
        "classifications": "{\"Ngành\":\"Thú Cưng\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?q=80&w=500"
    },
    {
        "id": "pet_p6",
        "name": "Đồ Chơi Xương Gặm",
        "barcode": "PET6",
        "price": 450000,
        "stock_quantity": 26,
        "category": "Thú Cưng",
        "classifications": "{\"Ngành\":\"Thú Cưng\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?q=80&w=500"
    },
    {
        "id": "pet_p7",
        "name": "Sữa Tắm Cho Thú",
        "barcode": "PET7",
        "price": 500000,
        "stock_quantity": 27,
        "category": "Thú Cưng",
        "classifications": "{\"Ngành\":\"Thú Cưng\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1550583724-125581cc2556?q=80&w=500"
    },
    {
        "id": "pet_p8",
        "name": "Ổ Nằm Êm Ái",
        "barcode": "PET8",
        "price": 550000,
        "stock_quantity": 28,
        "category": "Thú Cưng",
        "classifications": "{\"Ngành\":\"Thú Cưng\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?q=80&w=500"
    },
    {
        "id": "pet_p9",
        "name": "Lược Chải Lông",
        "barcode": "PET9",
        "price": 600000,
        "stock_quantity": 29,
        "category": "Thú Cưng",
        "classifications": "{\"Ngành\":\"Thú Cưng\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?q=80&w=500"
    },
    {
        "id": "pet_p10",
        "name": "Bát Ăn Inox",
        "barcode": "PET10",
        "price": 650000,
        "stock_quantity": 30,
        "category": "Thú Cưng",
        "classifications": "{\"Ngành\":\"Thú Cưng\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?q=80&w=500"
    },
    {
        "id": "hardware_p1",
        "name": "Máy Khoan Bosch",
        "barcode": "HARDWARE1",
        "price": 200000,
        "stock_quantity": 21,
        "category": "Điện Nước & XD",
        "classifications": "{\"Ngành\":\"Điện Nước & XD\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1530124560676-4ecb2129e160?q=80&w=500"
    },
    {
        "id": "hardware_p1_v1",
        "parent_id": "hardware_p1",
        "name": "Máy Khoan Bosch",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 200000,
        "stock_quantity": 6,
        "category": "Điện Nước & XD"
    ,
        "image_url": "https://images.unsplash.com/photo-1530124560676-4ecb2129e160?q=80&w=500"},
    {
        "id": "hardware_p1_v2",
        "parent_id": "hardware_p1",
        "name": "Máy Khoan Bosch",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 200000,
        "stock_quantity": 7,
        "category": "Điện Nước & XD"
    ,
        "image_url": "https://images.unsplash.com/photo-1530124560676-4ecb2129e160?q=80&w=500"},
    {
        "id": "hardware_p1_v3",
        "parent_id": "hardware_p1",
        "name": "Máy Khoan Bosch",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 200000,
        "stock_quantity": 8,
        "category": "Điện Nước & XD"
    ,
        "image_url": "https://images.unsplash.com/photo-1530124560676-4ecb2129e160?q=80&w=500"},
    {
        "id": "hardware_p2",
        "name": "Bộ Tua Vít",
        "barcode": "HARDWARE2",
        "price": 250000,
        "stock_quantity": 22,
        "category": "Điện Nước & XD",
        "classifications": "{\"Ngành\":\"Điện Nước & XD\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1530124560676-4ecb2129e160?q=80&w=500"
    },
    {
        "id": "hardware_p2_v1",
        "parent_id": "hardware_p2",
        "name": "Bộ Tua Vít",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 250000,
        "stock_quantity": 6,
        "category": "Điện Nước & XD"
    ,
        "image_url": "https://images.unsplash.com/photo-1530124560676-4ecb2129e160?q=80&w=500"},
    {
        "id": "hardware_p2_v2",
        "parent_id": "hardware_p2",
        "name": "Bộ Tua Vít",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 250000,
        "stock_quantity": 7,
        "category": "Điện Nước & XD"
    ,
        "image_url": "https://images.unsplash.com/photo-1530124560676-4ecb2129e160?q=80&w=500"},
    {
        "id": "hardware_p2_v3",
        "parent_id": "hardware_p2",
        "name": "Bộ Tua Vít",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 250000,
        "stock_quantity": 8,
        "category": "Điện Nước & XD"
    ,
        "image_url": "https://images.unsplash.com/photo-1530124560676-4ecb2129e160?q=80&w=500"},
    {
        "id": "hardware_p3",
        "name": "Kìm Đa Năng",
        "barcode": "HARDWARE3",
        "price": 300000,
        "stock_quantity": 23,
        "category": "Điện Nước & XD",
        "classifications": "{\"Ngành\":\"Điện Nước & XD\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1530124560676-4ecb2129e160?q=80&w=500"
    },
    {
        "id": "hardware_p4",
        "name": "Ống Nhựa Tiền Phong",
        "barcode": "HARDWARE4",
        "price": 350000,
        "stock_quantity": 24,
        "category": "Điện Nước & XD",
        "classifications": "{\"Ngành\":\"Điện Nước & XD\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1530124560676-4ecb2129e160?q=80&w=500"
    },
    {
        "id": "hardware_p5",
        "name": "Dây Điện Cadivi",
        "barcode": "HARDWARE5",
        "price": 400000,
        "stock_quantity": 25,
        "category": "Điện Nước & XD",
        "classifications": "{\"Ngành\":\"Điện Nước & XD\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1530124560676-4ecb2129e160?q=80&w=500"
    },
    {
        "id": "hardware_p6",
        "name": "Bóng Đèn Rạng Đông",
        "barcode": "HARDWARE6",
        "price": 450000,
        "stock_quantity": 26,
        "category": "Điện Nước & XD",
        "classifications": "{\"Ngành\":\"Điện Nước & XD\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1530124560676-4ecb2129e160?q=80&w=500"
    },
    {
        "id": "hardware_p7",
        "name": "Sơn Dulux",
        "barcode": "HARDWARE7",
        "price": 500000,
        "stock_quantity": 27,
        "category": "Điện Nước & XD",
        "classifications": "{\"Ngành\":\"Điện Nước & XD\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1530124560676-4ecb2129e160?q=80&w=500"
    },
    {
        "id": "hardware_p8",
        "name": "Thước Cuộn",
        "barcode": "HARDWARE8",
        "price": 550000,
        "stock_quantity": 28,
        "category": "Điện Nước & XD",
        "classifications": "{\"Ngành\":\"Điện Nước & XD\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1530124560676-4ecb2129e160?q=80&w=500"
    },
    {
        "id": "hardware_p9",
        "name": "Búa Nhổ Đinh",
        "barcode": "HARDWARE9",
        "price": 600000,
        "stock_quantity": 29,
        "category": "Điện Nước & XD",
        "classifications": "{\"Ngành\":\"Điện Nước & XD\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1530124560676-4ecb2129e160?q=80&w=500"
    },
    {
        "id": "hardware_p10",
        "name": "Ổ Cắm Điện",
        "barcode": "HARDWARE10",
        "price": 650000,
        "stock_quantity": 30,
        "category": "Điện Nước & XD",
        "classifications": "{\"Ngành\":\"Điện Nước & XD\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1530124560676-4ecb2129e160?q=80&w=500"
    },
    {
        "id": "sport_p1",
        "name": "Giày Chạy Bộ Nike",
        "barcode": "SPORT1",
        "price": 200000,
        "stock_quantity": 21,
        "category": "Đồ Thể Thao",
        "classifications": "{\"Ngành\":\"Đồ Thể Thao\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=500"
    },
    {
        "id": "sport_p1_v1",
        "parent_id": "sport_p1",
        "name": "Giày Chạy Bộ Nike",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 200000,
        "stock_quantity": 6,
        "category": "Đồ Thể Thao"
    ,
        "image_url": "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=500"},
    {
        "id": "sport_p1_v2",
        "parent_id": "sport_p1",
        "name": "Giày Chạy Bộ Nike",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 200000,
        "stock_quantity": 7,
        "category": "Đồ Thể Thao"
    ,
        "image_url": "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=500"},
    {
        "id": "sport_p1_v3",
        "parent_id": "sport_p1",
        "name": "Giày Chạy Bộ Nike",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 200000,
        "stock_quantity": 8,
        "category": "Đồ Thể Thao"
    ,
        "image_url": "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=500"},
    {
        "id": "sport_p2",
        "name": "Quả Bóng Đá",
        "barcode": "SPORT2",
        "price": 250000,
        "stock_quantity": 22,
        "category": "Đồ Thể Thao",
        "classifications": "{\"Ngành\":\"Đồ Thể Thao\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=500"
    },
    {
        "id": "sport_p2_v1",
        "parent_id": "sport_p2",
        "name": "Quả Bóng Đá",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 250000,
        "stock_quantity": 6,
        "category": "Đồ Thể Thao"
    ,
        "image_url": "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=500"},
    {
        "id": "sport_p2_v2",
        "parent_id": "sport_p2",
        "name": "Quả Bóng Đá",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 250000,
        "stock_quantity": 7,
        "category": "Đồ Thể Thao"
    ,
        "image_url": "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=500"},
    {
        "id": "sport_p2_v3",
        "parent_id": "sport_p2",
        "name": "Quả Bóng Đá",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 250000,
        "stock_quantity": 8,
        "category": "Đồ Thể Thao"
    ,
        "image_url": "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=500"},
    {
        "id": "sport_p3",
        "name": "Vợt Cầu Lông",
        "barcode": "SPORT3",
        "price": 300000,
        "stock_quantity": 23,
        "category": "Đồ Thể Thao",
        "classifications": "{\"Ngành\":\"Đồ Thể Thao\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=500"
    },
    {
        "id": "sport_p4",
        "name": "Thảm Tập Yoga",
        "barcode": "SPORT4",
        "price": 350000,
        "stock_quantity": 24,
        "category": "Đồ Thể Thao",
        "classifications": "{\"Ngành\":\"Đồ Thể Thao\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=500"
    },
    {
        "id": "sport_p5",
        "name": "Tạ Tay 5kg",
        "barcode": "SPORT5",
        "price": 400000,
        "stock_quantity": 25,
        "category": "Đồ Thể Thao",
        "classifications": "{\"Ngành\":\"Đồ Thể Thao\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=500"
    },
    {
        "id": "sport_p6",
        "name": "Bình Nước Thể Thao",
        "barcode": "SPORT6",
        "price": 450000,
        "stock_quantity": 26,
        "category": "Đồ Thể Thao",
        "classifications": "{\"Ngành\":\"Đồ Thể Thao\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=500"
    },
    {
        "id": "sport_p7",
        "name": "Áo Đấu CLB",
        "barcode": "SPORT7",
        "price": 500000,
        "stock_quantity": 27,
        "category": "Đồ Thể Thao",
        "classifications": "{\"Ngành\":\"Đồ Thể Thao\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=500"
    },
    {
        "id": "sport_p8",
        "name": "Kính Bơi Speedo",
        "barcode": "SPORT8",
        "price": 550000,
        "stock_quantity": 28,
        "category": "Đồ Thể Thao",
        "classifications": "{\"Ngành\":\"Đồ Thể Thao\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=500"
    },
    {
        "id": "sport_p9",
        "name": "Dây Nhảy",
        "barcode": "SPORT9",
        "price": 600000,
        "stock_quantity": 29,
        "category": "Đồ Thể Thao",
        "classifications": "{\"Ngành\":\"Đồ Thể Thao\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=500"
    },
    {
        "id": "sport_p10",
        "name": "Vợt Tennis",
        "barcode": "SPORT10",
        "price": 650000,
        "stock_quantity": 30,
        "category": "Đồ Thể Thao",
        "classifications": "{\"Ngành\":\"Đồ Thể Thao\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=500"
    },
    {
        "id": "agri_p1",
        "name": "Hạt Giống Rau",
        "barcode": "AGRI1",
        "price": 200000,
        "stock_quantity": 21,
        "category": "Vật Tư Nông Nghiệp",
        "classifications": "{\"Ngành\":\"Vật Tư Nông Nghiệp\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?q=80&w=500"
    },
    {
        "id": "agri_p1_v1",
        "parent_id": "agri_p1",
        "name": "Hạt Giống Rau",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 200000,
        "stock_quantity": 6,
        "category": "Vật Tư Nông Nghiệp"
    ,
        "image_url": "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?q=80&w=500"},
    {
        "id": "agri_p1_v2",
        "parent_id": "agri_p1",
        "name": "Hạt Giống Rau",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 200000,
        "stock_quantity": 7,
        "category": "Vật Tư Nông Nghiệp"
    ,
        "image_url": "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?q=80&w=500"},
    {
        "id": "agri_p1_v3",
        "parent_id": "agri_p1",
        "name": "Hạt Giống Rau",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 200000,
        "stock_quantity": 8,
        "category": "Vật Tư Nông Nghiệp"
    ,
        "image_url": "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?q=80&w=500"},
    {
        "id": "agri_p2",
        "name": "Phân Bón NPK",
        "barcode": "AGRI2",
        "price": 250000,
        "stock_quantity": 22,
        "category": "Vật Tư Nông Nghiệp",
        "classifications": "{\"Ngành\":\"Vật Tư Nông Nghiệp\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?q=80&w=500"
    },
    {
        "id": "agri_p2_v1",
        "parent_id": "agri_p2",
        "name": "Phân Bón NPK",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 250000,
        "stock_quantity": 6,
        "category": "Vật Tư Nông Nghiệp"
    ,
        "image_url": "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?q=80&w=500"},
    {
        "id": "agri_p2_v2",
        "parent_id": "agri_p2",
        "name": "Phân Bón NPK",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 250000,
        "stock_quantity": 7,
        "category": "Vật Tư Nông Nghiệp"
    ,
        "image_url": "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?q=80&w=500"},
    {
        "id": "agri_p2_v3",
        "parent_id": "agri_p2",
        "name": "Phân Bón NPK",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 250000,
        "stock_quantity": 8,
        "category": "Vật Tư Nông Nghiệp"
    ,
        "image_url": "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?q=80&w=500"},
    {
        "id": "agri_p3",
        "name": "Thuốc Trừ Sâu Sinh Học",
        "barcode": "AGRI3",
        "price": 300000,
        "stock_quantity": 23,
        "category": "Vật Tư Nông Nghiệp",
        "classifications": "{\"Ngành\":\"Vật Tư Nông Nghiệp\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?q=80&w=500"
    },
    {
        "id": "agri_p4",
        "name": "Bình Phun Thuốc",
        "barcode": "AGRI4",
        "price": 350000,
        "stock_quantity": 24,
        "category": "Vật Tư Nông Nghiệp",
        "classifications": "{\"Ngành\":\"Vật Tư Nông Nghiệp\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?q=80&w=500"
    },
    {
        "id": "agri_p5",
        "name": "Xẻng Làm Vườn",
        "barcode": "AGRI5",
        "price": 400000,
        "stock_quantity": 25,
        "category": "Vật Tư Nông Nghiệp",
        "classifications": "{\"Ngành\":\"Vật Tư Nông Nghiệp\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?q=80&w=500"
    },
    {
        "id": "agri_p6",
        "name": "Đất Sạch Tribat",
        "barcode": "AGRI6",
        "price": 450000,
        "stock_quantity": 26,
        "category": "Vật Tư Nông Nghiệp",
        "classifications": "{\"Ngành\":\"Vật Tư Nông Nghiệp\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?q=80&w=500"
    },
    {
        "id": "agri_p7",
        "name": "Kéo Cắt Cành",
        "barcode": "AGRI7",
        "price": 500000,
        "stock_quantity": 27,
        "category": "Vật Tư Nông Nghiệp",
        "classifications": "{\"Ngành\":\"Vật Tư Nông Nghiệp\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?q=80&w=500"
    },
    {
        "id": "agri_p8",
        "name": "Lưới Che Lan",
        "barcode": "AGRI8",
        "price": 550000,
        "stock_quantity": 28,
        "category": "Vật Tư Nông Nghiệp",
        "classifications": "{\"Ngành\":\"Vật Tư Nông Nghiệp\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?q=80&w=500"
    },
    {
        "id": "agri_p9",
        "name": "Khay Gieo Hạt",
        "barcode": "AGRI9",
        "price": 600000,
        "stock_quantity": 29,
        "category": "Vật Tư Nông Nghiệp",
        "classifications": "{\"Ngành\":\"Vật Tư Nông Nghiệp\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?q=80&w=500"
    },
    {
        "id": "agri_p10",
        "name": "Chậu Nhựa Trồng Cây",
        "barcode": "AGRI10",
        "price": 650000,
        "stock_quantity": 30,
        "category": "Vật Tư Nông Nghiệp",
        "classifications": "{\"Ngành\":\"Vật Tư Nông Nghiệp\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?q=80&w=500"
    },
    {
        "id": "health_p1",
        "name": "Dầu Cá Omega-3",
        "barcode": "HEALTH1",
        "price": 200000,
        "stock_quantity": 21,
        "category": "TP Chức Năng",
        "classifications": "{\"Ngành\":\"TP Chức Năng\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1584017911766-d451b3d0e8af?q=80&w=500"
    },
    {
        "id": "health_p1_v1",
        "parent_id": "health_p1",
        "name": "Dầu Cá Omega-3",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 200000,
        "stock_quantity": 6,
        "category": "TP Chức Năng"
    ,
        "image_url": "https://images.unsplash.com/photo-1584017911766-d451b3d0e8af?q=80&w=500"},
    {
        "id": "health_p1_v2",
        "parent_id": "health_p1",
        "name": "Dầu Cá Omega-3",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 200000,
        "stock_quantity": 7,
        "category": "TP Chức Năng"
    ,
        "image_url": "https://images.unsplash.com/photo-1584017911766-d451b3d0e8af?q=80&w=500"},
    {
        "id": "health_p1_v3",
        "parent_id": "health_p1",
        "name": "Dầu Cá Omega-3",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 200000,
        "stock_quantity": 8,
        "category": "TP Chức Năng"
    ,
        "image_url": "https://images.unsplash.com/photo-1584017911766-d451b3d0e8af?q=80&w=500"},
    {
        "id": "health_p2",
        "name": "Vitamin Tổng Hợp",
        "barcode": "HEALTH2",
        "price": 250000,
        "stock_quantity": 22,
        "category": "TP Chức Năng",
        "classifications": "{\"Ngành\":\"TP Chức Năng\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1584017911766-d451b3d0e8af?q=80&w=500"
    },
    {
        "id": "health_p2_v1",
        "parent_id": "health_p2",
        "name": "Vitamin Tổng Hợp",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 250000,
        "stock_quantity": 6,
        "category": "TP Chức Năng"
    ,
        "image_url": "https://images.unsplash.com/photo-1584017911766-d451b3d0e8af?q=80&w=500"},
    {
        "id": "health_p2_v2",
        "parent_id": "health_p2",
        "name": "Vitamin Tổng Hợp",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 250000,
        "stock_quantity": 7,
        "category": "TP Chức Năng"
    ,
        "image_url": "https://images.unsplash.com/photo-1584017911766-d451b3d0e8af?q=80&w=500"},
    {
        "id": "health_p2_v3",
        "parent_id": "health_p2",
        "name": "Vitamin Tổng Hợp",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 250000,
        "stock_quantity": 8,
        "category": "TP Chức Năng"
    ,
        "image_url": "https://images.unsplash.com/photo-1584017911766-d451b3d0e8af?q=80&w=500"},
    {
        "id": "health_p3",
        "name": "Tảo Xoắn Nhật",
        "barcode": "HEALTH3",
        "price": 300000,
        "stock_quantity": 23,
        "category": "TP Chức Năng",
        "classifications": "{\"Ngành\":\"TP Chức Năng\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1584017911766-d451b3d0e8af?q=80&w=500"
    },
    {
        "id": "health_p4",
        "name": "Sâm Cao Ly",
        "barcode": "HEALTH4",
        "price": 350000,
        "stock_quantity": 24,
        "category": "TP Chức Năng",
        "classifications": "{\"Ngành\":\"TP Chức Năng\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1584017911766-d451b3d0e8af?q=80&w=500"
    },
    {
        "id": "health_p5",
        "name": "Collagen Nước",
        "barcode": "HEALTH5",
        "price": 400000,
        "stock_quantity": 25,
        "category": "TP Chức Năng",
        "classifications": "{\"Ngành\":\"TP Chức Năng\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1584017911766-d451b3d0e8af?q=80&w=500"
    },
    {
        "id": "health_p6",
        "name": "Viên Uống Sáng Mắt",
        "barcode": "HEALTH6",
        "price": 450000,
        "stock_quantity": 26,
        "category": "TP Chức Năng",
        "classifications": "{\"Ngành\":\"TP Chức Năng\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1584017911766-d451b3d0e8af?q=80&w=500"
    },
    {
        "id": "health_p7",
        "name": "Trà Thảo Mộc",
        "barcode": "HEALTH7",
        "price": 500000,
        "stock_quantity": 27,
        "category": "TP Chức Năng",
        "classifications": "{\"Ngành\":\"TP Chức Năng\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1584017911766-d451b3d0e8af?q=80&w=500"
    },
    {
        "id": "health_p8",
        "name": "Sữa Canxi",
        "barcode": "HEALTH8",
        "price": 550000,
        "stock_quantity": 28,
        "category": "TP Chức Năng",
        "classifications": "{\"Ngành\":\"TP Chức Năng\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1550583724-125581cc2556?q=80&w=500"
    },
    {
        "id": "health_p9",
        "name": "Keo Ong Xịt",
        "barcode": "HEALTH9",
        "price": 600000,
        "stock_quantity": 29,
        "category": "TP Chức Năng",
        "classifications": "{\"Ngành\":\"TP Chức Năng\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1584017911766-d451b3d0e8af?q=80&w=500"
    },
    {
        "id": "health_p10",
        "name": "Viên Sắt",
        "barcode": "HEALTH10",
        "price": 650000,
        "stock_quantity": 30,
        "category": "TP Chức Năng",
        "classifications": "{\"Ngành\":\"TP Chức Năng\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1584017911766-d451b3d0e8af?q=80&w=500"
    },
    {
        "id": "toy_p1",
        "name": "Lego Technic",
        "barcode": "TOY1",
        "price": 200000,
        "stock_quantity": 21,
        "category": "Đồ Chơi & Mô Hình",
        "classifications": "{\"Ngành\":\"Đồ Chơi & Mô Hình\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1558060370-d644479cb6f7?q=80&w=500"
    },
    {
        "id": "toy_p1_v1",
        "parent_id": "toy_p1",
        "name": "Lego Technic",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 200000,
        "stock_quantity": 6,
        "category": "Đồ Chơi & Mô Hình"
    ,
        "image_url": "https://images.unsplash.com/photo-1558060370-d644479cb6f7?q=80&w=500"},
    {
        "id": "toy_p1_v2",
        "parent_id": "toy_p1",
        "name": "Lego Technic",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 200000,
        "stock_quantity": 7,
        "category": "Đồ Chơi & Mô Hình"
    ,
        "image_url": "https://images.unsplash.com/photo-1558060370-d644479cb6f7?q=80&w=500"},
    {
        "id": "toy_p1_v3",
        "parent_id": "toy_p1",
        "name": "Lego Technic",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 200000,
        "stock_quantity": 8,
        "category": "Đồ Chơi & Mô Hình"
    ,
        "image_url": "https://images.unsplash.com/photo-1558060370-d644479cb6f7?q=80&w=500"},
    {
        "id": "toy_p2",
        "name": "Mô Hình Gundam",
        "barcode": "TOY2",
        "price": 250000,
        "stock_quantity": 22,
        "category": "Đồ Chơi & Mô Hình",
        "classifications": "{\"Ngành\":\"Đồ Chơi & Mô Hình\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1558060370-d644479cb6f7?q=80&w=500"
    },
    {
        "id": "toy_p2_v1",
        "parent_id": "toy_p2",
        "name": "Mô Hình Gundam",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 250000,
        "stock_quantity": 6,
        "category": "Đồ Chơi & Mô Hình"
    ,
        "image_url": "https://images.unsplash.com/photo-1558060370-d644479cb6f7?q=80&w=500"},
    {
        "id": "toy_p2_v2",
        "parent_id": "toy_p2",
        "name": "Mô Hình Gundam",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 250000,
        "stock_quantity": 7,
        "category": "Đồ Chơi & Mô Hình"
    ,
        "image_url": "https://images.unsplash.com/photo-1558060370-d644479cb6f7?q=80&w=500"},
    {
        "id": "toy_p2_v3",
        "parent_id": "toy_p2",
        "name": "Mô Hình Gundam",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 250000,
        "stock_quantity": 8,
        "category": "Đồ Chơi & Mô Hình"
    ,
        "image_url": "https://images.unsplash.com/photo-1558060370-d644479cb6f7?q=80&w=500"},
    {
        "id": "toy_p3",
        "name": "Boardgame Ma Sói",
        "barcode": "TOY3",
        "price": 300000,
        "stock_quantity": 23,
        "category": "Đồ Chơi & Mô Hình",
        "classifications": "{\"Ngành\":\"Đồ Chơi & Mô Hình\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1558060370-d644479cb6f7?q=80&w=500"
    },
    {
        "id": "toy_p4",
        "name": "Búp Bê Barbie",
        "barcode": "TOY4",
        "price": 350000,
        "stock_quantity": 24,
        "category": "Đồ Chơi & Mô Hình",
        "classifications": "{\"Ngành\":\"Đồ Chơi & Mô Hình\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1558060370-d644479cb6f7?q=80&w=500"
    },
    {
        "id": "toy_p5",
        "name": "Xe Điều Khiển",
        "barcode": "TOY5",
        "price": 400000,
        "stock_quantity": 25,
        "category": "Đồ Chơi & Mô Hình",
        "classifications": "{\"Ngành\":\"Đồ Chơi & Mô Hình\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1558060370-d644479cb6f7?q=80&w=500"
    },
    {
        "id": "toy_p6",
        "name": "Đất Sét Nặn",
        "barcode": "TOY6",
        "price": 450000,
        "stock_quantity": 26,
        "category": "Đồ Chơi & Mô Hình",
        "classifications": "{\"Ngành\":\"Đồ Chơi & Mô Hình\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1558060370-d644479cb6f7?q=80&w=500"
    },
    {
        "id": "toy_p7",
        "name": "Rubik 3x3",
        "barcode": "TOY7",
        "price": 500000,
        "stock_quantity": 27,
        "category": "Đồ Chơi & Mô Hình",
        "classifications": "{\"Ngành\":\"Đồ Chơi & Mô Hình\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1558060370-d644479cb6f7?q=80&w=500"
    },
    {
        "id": "toy_p8",
        "name": "Bộ Bài Pokemon",
        "barcode": "TOY8",
        "price": 550000,
        "stock_quantity": 28,
        "category": "Đồ Chơi & Mô Hình",
        "classifications": "{\"Ngành\":\"Đồ Chơi & Mô Hình\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1612817288484-6f916006741a?q=80&w=500"
    },
    {
        "id": "toy_p9",
        "name": "Mô Hình Marvel",
        "barcode": "TOY9",
        "price": 600000,
        "stock_quantity": 29,
        "category": "Đồ Chơi & Mô Hình",
        "classifications": "{\"Ngành\":\"Đồ Chơi & Mô Hình\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1558060370-d644479cb6f7?q=80&w=500"
    },
    {
        "id": "toy_p10",
        "name": "Xếp Hình 1000 Mảnh",
        "barcode": "TOY10",
        "price": 650000,
        "stock_quantity": 30,
        "category": "Đồ Chơi & Mô Hình",
        "classifications": "{\"Ngành\":\"Đồ Chơi & Mô Hình\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1558060370-d644479cb6f7?q=80&w=500"
    },
    {
        "id": "music_p1",
        "name": "Đàn Guitar Acoustic",
        "barcode": "MUSIC1",
        "price": 200000,
        "stock_quantity": 21,
        "category": "Nhạc Cụ",
        "classifications": "{\"Ngành\":\"Nhạc Cụ\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=500"
    },
    {
        "id": "music_p1_v1",
        "parent_id": "music_p1",
        "name": "Đàn Guitar Acoustic",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 200000,
        "stock_quantity": 6,
        "category": "Nhạc Cụ"
    ,
        "image_url": "https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=500"},
    {
        "id": "music_p1_v2",
        "parent_id": "music_p1",
        "name": "Đàn Guitar Acoustic",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 200000,
        "stock_quantity": 7,
        "category": "Nhạc Cụ"
    ,
        "image_url": "https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=500"},
    {
        "id": "music_p1_v3",
        "parent_id": "music_p1",
        "name": "Đàn Guitar Acoustic",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 200000,
        "stock_quantity": 8,
        "category": "Nhạc Cụ"
    ,
        "image_url": "https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=500"},
    {
        "id": "music_p2",
        "name": "Đàn Organ Casio",
        "barcode": "MUSIC2",
        "price": 250000,
        "stock_quantity": 22,
        "category": "Nhạc Cụ",
        "classifications": "{\"Ngành\":\"Nhạc Cụ\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=500"
    },
    {
        "id": "music_p2_v1",
        "parent_id": "music_p2",
        "name": "Đàn Organ Casio",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 250000,
        "stock_quantity": 6,
        "category": "Nhạc Cụ"
    ,
        "image_url": "https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=500"},
    {
        "id": "music_p2_v2",
        "parent_id": "music_p2",
        "name": "Đàn Organ Casio",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 250000,
        "stock_quantity": 7,
        "category": "Nhạc Cụ"
    ,
        "image_url": "https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=500"},
    {
        "id": "music_p2_v3",
        "parent_id": "music_p2",
        "name": "Đàn Organ Casio",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 250000,
        "stock_quantity": 8,
        "category": "Nhạc Cụ"
    ,
        "image_url": "https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=500"},
    {
        "id": "music_p3",
        "name": "Kèn Harmonica",
        "barcode": "MUSIC3",
        "price": 300000,
        "stock_quantity": 23,
        "category": "Nhạc Cụ",
        "classifications": "{\"Ngành\":\"Nhạc Cụ\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=500"
    },
    {
        "id": "music_p4",
        "name": "Trống Cajon",
        "barcode": "MUSIC4",
        "price": 350000,
        "stock_quantity": 24,
        "category": "Nhạc Cụ",
        "classifications": "{\"Ngành\":\"Nhạc Cụ\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=500"
    },
    {
        "id": "music_p5",
        "name": "Đàn Ukulele",
        "barcode": "MUSIC5",
        "price": 400000,
        "stock_quantity": 25,
        "category": "Nhạc Cụ",
        "classifications": "{\"Ngành\":\"Nhạc Cụ\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=500"
    },
    {
        "id": "music_p6",
        "name": "Sáo Trúc",
        "barcode": "MUSIC6",
        "price": 450000,
        "stock_quantity": 26,
        "category": "Nhạc Cụ",
        "classifications": "{\"Ngành\":\"Nhạc Cụ\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=500"
    },
    {
        "id": "music_p7",
        "name": "Dây Đàn Elixir",
        "barcode": "MUSIC7",
        "price": 500000,
        "stock_quantity": 27,
        "category": "Nhạc Cụ",
        "classifications": "{\"Ngành\":\"Nhạc Cụ\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=500"
    },
    {
        "id": "music_p8",
        "name": "Capo Kim Loại",
        "barcode": "MUSIC8",
        "price": 550000,
        "stock_quantity": 28,
        "category": "Nhạc Cụ",
        "classifications": "{\"Ngành\":\"Nhạc Cụ\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=500"
    },
    {
        "id": "music_p9",
        "name": "Chân Để Đàn",
        "barcode": "MUSIC9",
        "price": 600000,
        "stock_quantity": 29,
        "category": "Nhạc Cụ",
        "classifications": "{\"Ngành\":\"Nhạc Cụ\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=500"
    },
    {
        "id": "music_p10",
        "name": "Máy Đập Nhịp",
        "barcode": "MUSIC10",
        "price": 650000,
        "stock_quantity": 30,
        "category": "Nhạc Cụ",
        "classifications": "{\"Ngành\":\"Nhạc Cụ\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=500"
    },
    {
        "id": "bake_p1",
        "name": "Bột Mì Đa Năng",
        "barcode": "BAKE1",
        "price": 200000,
        "stock_quantity": 21,
        "category": "Đồ Làm Bánh",
        "classifications": "{\"Ngành\":\"Đồ Làm Bánh\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=500"
    },
    {
        "id": "bake_p1_v1",
        "parent_id": "bake_p1",
        "name": "Bột Mì Đa Năng",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 200000,
        "stock_quantity": 6,
        "category": "Đồ Làm Bánh"
    ,
        "image_url": "https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=500"},
    {
        "id": "bake_p1_v2",
        "parent_id": "bake_p1",
        "name": "Bột Mì Đa Năng",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 200000,
        "stock_quantity": 7,
        "category": "Đồ Làm Bánh"
    ,
        "image_url": "https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=500"},
    {
        "id": "bake_p1_v3",
        "parent_id": "bake_p1",
        "name": "Bột Mì Đa Năng",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 200000,
        "stock_quantity": 8,
        "category": "Đồ Làm Bánh"
    ,
        "image_url": "https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=500"},
    {
        "id": "bake_p2",
        "name": "Men Nở Instant",
        "barcode": "BAKE2",
        "price": 250000,
        "stock_quantity": 22,
        "category": "Đồ Làm Bánh",
        "classifications": "{\"Ngành\":\"Đồ Làm Bánh\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=500"
    },
    {
        "id": "bake_p2_v1",
        "parent_id": "bake_p2",
        "name": "Men Nở Instant",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 250000,
        "stock_quantity": 6,
        "category": "Đồ Làm Bánh"
    ,
        "image_url": "https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=500"},
    {
        "id": "bake_p2_v2",
        "parent_id": "bake_p2",
        "name": "Men Nở Instant",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 250000,
        "stock_quantity": 7,
        "category": "Đồ Làm Bánh"
    ,
        "image_url": "https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=500"},
    {
        "id": "bake_p2_v3",
        "parent_id": "bake_p2",
        "name": "Men Nở Instant",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 250000,
        "stock_quantity": 8,
        "category": "Đồ Làm Bánh"
    ,
        "image_url": "https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=500"},
    {
        "id": "bake_p3",
        "name": "Khuôn Bánh Silicon",
        "barcode": "BAKE3",
        "price": 300000,
        "stock_quantity": 23,
        "category": "Đồ Làm Bánh",
        "classifications": "{\"Ngành\":\"Đồ Làm Bánh\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=500"
    },
    {
        "id": "bake_p4",
        "name": "Máy Đánh Trứng",
        "barcode": "BAKE4",
        "price": 350000,
        "stock_quantity": 24,
        "category": "Đồ Làm Bánh",
        "classifications": "{\"Ngành\":\"Đồ Làm Bánh\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=500"
    },
    {
        "id": "bake_p5",
        "name": "Bơ Lạt Anchor",
        "barcode": "BAKE5",
        "price": 400000,
        "stock_quantity": 25,
        "category": "Đồ Làm Bánh",
        "classifications": "{\"Ngành\":\"Đồ Làm Bánh\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=500"
    },
    {
        "id": "bake_p6",
        "name": "Vani Nước",
        "barcode": "BAKE6",
        "price": 450000,
        "stock_quantity": 26,
        "category": "Đồ Làm Bánh",
        "classifications": "{\"Ngành\":\"Đồ Làm Bánh\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=500"
    },
    {
        "id": "bake_p7",
        "name": "Cân Điện Tử Mini",
        "barcode": "BAKE7",
        "price": 500000,
        "stock_quantity": 27,
        "category": "Đồ Làm Bánh",
        "classifications": "{\"Ngành\":\"Đồ Làm Bánh\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=500"
    },
    {
        "id": "bake_p8",
        "name": "Giấy Nến Nướng Bánh",
        "barcode": "BAKE8",
        "price": 550000,
        "stock_quantity": 28,
        "category": "Đồ Làm Bánh",
        "classifications": "{\"Ngành\":\"Đồ Làm Bánh\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=500"
    },
    {
        "id": "bake_p9",
        "name": "Đuôi Bắt Kem",
        "barcode": "BAKE9",
        "price": 600000,
        "stock_quantity": 29,
        "category": "Đồ Làm Bánh",
        "classifications": "{\"Ngành\":\"Đồ Làm Bánh\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1612817288484-6f916006741a?q=80&w=500"
    },
    {
        "id": "bake_p10",
        "name": "Socola Chip",
        "barcode": "BAKE10",
        "price": 650000,
        "stock_quantity": 30,
        "category": "Đồ Làm Bánh",
        "classifications": "{\"Ngành\":\"Đồ Làm Bánh\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=500"
    },
    {
        "id": "furniture_p1",
        "name": "Ghế Sofa Đơn",
        "barcode": "FURNITURE1",
        "price": 200000,
        "stock_quantity": 21,
        "category": "Nội Thất",
        "classifications": "{\"Ngành\":\"Nội Thất\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1555041469-a586c88ca9ba?q=80&w=500"
    },
    {
        "id": "furniture_p1_v1",
        "parent_id": "furniture_p1",
        "name": "Ghế Sofa Đơn",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 200000,
        "stock_quantity": 6,
        "category": "Nội Thất"
    ,
        "image_url": "https://images.unsplash.com/photo-1555041469-a586c88ca9ba?q=80&w=500"},
    {
        "id": "furniture_p1_v2",
        "parent_id": "furniture_p1",
        "name": "Ghế Sofa Đơn",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 200000,
        "stock_quantity": 7,
        "category": "Nội Thất"
    ,
        "image_url": "https://images.unsplash.com/photo-1555041469-a586c88ca9ba?q=80&w=500"},
    {
        "id": "furniture_p1_v3",
        "parent_id": "furniture_p1",
        "name": "Ghế Sofa Đơn",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 200000,
        "stock_quantity": 8,
        "category": "Nội Thất"
    ,
        "image_url": "https://images.unsplash.com/photo-1555041469-a586c88ca9ba?q=80&w=500"},
    {
        "id": "furniture_p2",
        "name": "Bàn Làm Việc",
        "barcode": "FURNITURE2",
        "price": 250000,
        "stock_quantity": 22,
        "category": "Nội Thất",
        "classifications": "{\"Ngành\":\"Nội Thất\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1555041469-a586c88ca9ba?q=80&w=500"
    },
    {
        "id": "furniture_p2_v1",
        "parent_id": "furniture_p2",
        "name": "Bàn Làm Việc",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 250000,
        "stock_quantity": 6,
        "category": "Nội Thất"
    ,
        "image_url": "https://images.unsplash.com/photo-1555041469-a586c88ca9ba?q=80&w=500"},
    {
        "id": "furniture_p2_v2",
        "parent_id": "furniture_p2",
        "name": "Bàn Làm Việc",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 250000,
        "stock_quantity": 7,
        "category": "Nội Thất"
    ,
        "image_url": "https://images.unsplash.com/photo-1555041469-a586c88ca9ba?q=80&w=500"},
    {
        "id": "furniture_p2_v3",
        "parent_id": "furniture_p2",
        "name": "Bàn Làm Việc",
        "attributes": "{\"Phân loại\":\"Mẫu ${v}\",\"Tình trạng\":\"Sẵn hàng\"}",
        "barcode": "${baseProduct.barcode}-V${v}",
        "price": 250000,
        "stock_quantity": 8,
        "category": "Nội Thất"
    ,
        "image_url": "https://images.unsplash.com/photo-1555041469-a586c88ca9ba?q=80&w=500"},
    {
        "id": "furniture_p3",
        "name": "Kệ Sách Gỗ",
        "barcode": "FURNITURE3",
        "price": 300000,
        "stock_quantity": 23,
        "category": "Nội Thất",
        "classifications": "{\"Ngành\":\"Nội Thất\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1555041469-a586c88ca9ba?q=80&w=500"
    },
    {
        "id": "furniture_p4",
        "name": "Tủ Quần Áo",
        "barcode": "FURNITURE4",
        "price": 350000,
        "stock_quantity": 24,
        "category": "Nội Thất",
        "classifications": "{\"Ngành\":\"Nội Thất\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1555041469-a586c88ca9ba?q=80&w=500"
    },
    {
        "id": "furniture_p5",
        "name": "Giường Ngủ 1m8",
        "barcode": "FURNITURE5",
        "price": 400000,
        "stock_quantity": 25,
        "category": "Nội Thất",
        "classifications": "{\"Ngành\":\"Nội Thất\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1555041469-a586c88ca9ba?q=80&w=500"
    },
    {
        "id": "furniture_p6",
        "name": "Bàn Ăn 4 Ghế",
        "barcode": "FURNITURE6",
        "price": 450000,
        "stock_quantity": 26,
        "category": "Nội Thất",
        "classifications": "{\"Ngành\":\"Nội Thất\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1555041469-a586c88ca9ba?q=80&w=500"
    },
    {
        "id": "furniture_p7",
        "name": "Ghế Xoay Văn Phòng",
        "barcode": "FURNITURE7",
        "price": 500000,
        "stock_quantity": 27,
        "category": "Nội Thất",
        "classifications": "{\"Ngành\":\"Nội Thất\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1555041469-a586c88ca9ba?q=80&w=500"
    },
    {
        "id": "furniture_p8",
        "name": "Gương Toàn Thân",
        "barcode": "FURNITURE8",
        "price": 550000,
        "stock_quantity": 28,
        "category": "Nội Thất",
        "classifications": "{\"Ngành\":\"Nội Thất\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1555041469-a586c88ca9ba?q=80&w=500"
    },
    {
        "id": "furniture_p9",
        "name": "Tab Đầu Giường",
        "barcode": "FURNITURE9",
        "price": 600000,
        "stock_quantity": 29,
        "category": "Nội Thất",
        "classifications": "{\"Ngành\":\"Nội Thất\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1555041469-a586c88ca9ba?q=80&w=500"
    },
    {
        "id": "furniture_p10",
        "name": "Giá Treo Đồ",
        "barcode": "FURNITURE10",
        "price": 650000,
        "stock_quantity": 30,
        "category": "Nội Thất",
        "classifications": "{\"Ngành\":\"Nội Thất\",\"Nhãn\":\"Demo\"}",
        "image_url": "https://images.unsplash.com/photo-1555041469-a586c88ca9ba?q=80&w=500"
    }
];

const generateSales = () => {
    const sales = [];
    const now = new Date();
    
    // Pick from parent products that have a price
    const parents = MOCK_PRODUCTS.filter(p => !p.parent_id && p.price);

    for (let i = 0; i < 40; i++) {
        const saleDate = new Date(now);
        saleDate.setHours(now.getHours() - Math.floor(Math.random() * 72));
        
        const itemCount = Math.floor(Math.random() * 3) + 1;
        const items = [];
        let total = 0;
        
        for (let j = 0; j < itemCount; j++) {
            const p = parents[Math.floor(Math.random() * parents.length)];
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
            code: "HD" + (1000 + i),
            total_amount: total,
            payment_method: Math.random() > 0.5 ? 'cash' : 'transfer',
            items: items,
            created_at: saleDate.toISOString(),
            synced: 1
        });
    }
    return sales;
};

export const MOCK_SALES = generateSales();

export const MOCK_CASHFLOWS = [
    { type: 'out', category: 'Chi phí mặt bằng', description: 'Thanh toán tiền thuê mặt bằng tháng này', amount: 15000000, created_at: new Date().toISOString() },
    { type: 'out', category: 'Tiền điện nước', description: 'Thanh toán hóa đơn điện nước', amount: 2500000, created_at: new Date().toISOString() },
    { type: 'out', category: 'Nhập hàng', description: 'Nhập lô hàng tổng hợp mẫu cho 18 ngành', amount: 50000000, created_at: new Date().toISOString() },
    { type: 'in', category: 'Thu khác', description: 'Lợi nhuận gộp từ các ngành hàng', amount: 10000000, created_at: new Date().toISOString() },
];
