CREATE TYPE user_role AS ENUM ('customer', 'merchant');

CREATE TABLE users (
    user_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    nickname VARCHAR(30),
    avatar_key TEXT,
    role user_role NOT NULL,
    CONSTRAINT users_username_format_check CHECK (username ~ '^[A-Za-z0-9]{3,20}$'),
    UNIQUE (user_id, role)
);

CREATE UNIQUE INDEX users_username_case_insensitive_unique ON users (LOWER(username));

CREATE TABLE customer_profiles (
    user_id INTEGER PRIMARY KEY,
    role user_role NOT NULL DEFAULT 'customer' CHECK (role = 'customer'),
    FOREIGN KEY (user_id, role) REFERENCES users(user_id, role)
);

CREATE TABLE merchant_profiles (
    user_id INTEGER PRIMARY KEY,
    role user_role NOT NULL DEFAULT 'merchant' CHECK (role = 'merchant'),
    FOREIGN KEY (user_id, role) REFERENCES users(user_id, role)
);

CREATE TABLE categories (
    category_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    CONSTRAINT categories_name_not_blank_check CHECK (
        name = trim(name) AND char_length(name) > 0
    )
);

CREATE TABLE products (
    product_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    merchant_id INTEGER NOT NULL REFERENCES merchant_profiles(user_id),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    sku VARCHAR(100) NOT NULL UNIQUE,
    category_id INTEGER NOT NULL REFERENCES categories(category_id),
    -- smallest currency unit
    price_amount INTEGER NOT NULL,
    inventory INTEGER NOT NULL DEFAULT 0,
    image_key TEXT,
    meta JSONB NOT NULL DEFAULT '{}' :: JSONB,
    CONSTRAINT products_price_amount_nonnegative_check CHECK (price_amount >= 0),
    CONSTRAINT products_inventory_nonnegative_check CHECK (inventory >= 0),
    CONSTRAINT products_meta_object_check CHECK (jsonb_typeof(meta) = 'object')
);

CREATE INDEX products_merchant_id_idx ON products (merchant_id);

CREATE TABLE cart_items (
    user_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT cart_items_quantity_positive_check CHECK (quantity > 0),
    PRIMARY KEY (user_id, product_id),
    FOREIGN KEY (user_id) REFERENCES customer_profiles(user_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

INSERT INTO
    categories (name)
VALUES
    ('electronics'),
    ('clothing'),
    ('books'),
    ('home'),
    ('kitchen'),
    ('beauty'),
    ('health'),
    ('sports'),
    ('outdoors'),
    ('toys'),
    ('games'),
    ('automotive'),
    ('grocery'),
    ('pet-supplies'),
    ('office-supplies'),
    ('jewelry'),
    ('shoes'),
    ('bags'),
    ('music'),
    ('movies') ON CONFLICT (name) DO NOTHING;

INSERT INTO
    users (username, email, password_hash, role)
VALUES
    ('storefront', 'storefront@example.com', 'seed-only-no-login', 'merchant')
ON CONFLICT (email) DO NOTHING;

INSERT INTO
    merchant_profiles (user_id)
SELECT
    user_id
FROM
    users
WHERE
    email = 'storefront@example.com'
ON CONFLICT (user_id) DO NOTHING;

WITH product_templates (
    category_name,
    brand,
    base_price,
    product_names
) AS (
    VALUES
        (
            'electronics',
            'NovaTech',
            19900 :: INTEGER,
            ARRAY [
                'Wireless Noise-Canceling Headphones',
                'Smartphone 256GB',
                'Portable Bluetooth Speaker',
                '4K Streaming Device',
                'Wireless Charging Pad',
                'Mechanical Gaming Keyboard',
                'Ergonomic Wireless Mouse',
                'USB-C Multiport Hub',
                'Smart Fitness Watch',
                '1080p Webcam'
            ] :: TEXT []
        ),
        (
            'clothing',
            'UrbanThread',
            2500 :: INTEGER,
            ARRAY [
                'Classic Cotton T-Shirt',
                'Slim Fit Chino Pants',
                'Fleece Pullover Hoodie',
                'Lightweight Bomber Jacket',
                'Relaxed Fit Jeans',
                'Long Sleeve Henley Shirt',
                'Waterproof Rain Jacket',
                'Athletic Jogger Pants',
                'Merino Wool Sweater',
                'Everyday Polo Shirt'
            ] :: TEXT []
        ),
        (
            'books',
            'OpenLeaf Press',
            899 :: INTEGER,
            ARRAY [
                'The Art of Clear Thinking',
                'Practical PostgreSQL',
                'Modern Web Architecture',
                'A Journey Beyond the Stars',
                'The Complete Home Cookbook',
                'Personal Finance Fundamentals',
                'Introduction to Machine Learning',
                'The Quiet Forest',
                'Productivity Without Burnout',
                'World History Illustrated'
            ] :: TEXT []
        ),
        (
            'home',
            'HavenHome',
            1800 :: INTEGER,
            ARRAY [
                'Soft Microfiber Bed Sheet Set',
                'Decorative Throw Pillow',
                'Blackout Window Curtains',
                'Bamboo Laundry Basket',
                'Digital Alarm Clock',
                'LED Bedside Table Lamp',
                'Non-Slip Area Rug',
                'Floating Wall Shelf',
                'Memory Foam Seat Cushion',
                'Scented Soy Candle Set'
            ] :: TEXT []
        ),
        (
            'kitchen',
            'ChefCraft',
            1500 :: INTEGER,
            ARRAY [
                'Stainless Steel Chef Knife',
                'Non-Stick Frying Pan',
                'Digital Kitchen Scale',
                'Glass Food Storage Set',
                'Bamboo Cutting Board',
                'Electric Milk Frother',
                'Silicone Cooking Utensil Set',
                'Insulated Travel Mug',
                'Manual Coffee Grinder',
                'Adjustable Measuring Spoon'
            ] :: TEXT []
        ),
        (
            'beauty',
            'PureGlow',
            1200 :: INTEGER,
            ARRAY [
                'Hydrating Facial Cleanser',
                'Vitamin C Face Serum',
                'Daily Moisturizing Cream',
                'Volumizing Mascara',
                'Matte Lip Color',
                'Gentle Exfoliating Scrub',
                'Mineral Face Powder',
                'Nourishing Hair Mask',
                'Rosewater Facial Mist',
                'Makeup Brush Set'
            ] :: TEXT []
        ),
        (
            'health',
            'WellSpring',
            900 :: INTEGER,
            ARRAY [
                'Digital Oral Thermometer',
                'Weekly Pill Organizer',
                'Reusable Hot and Cold Pack',
                'Wrist Blood Pressure Monitor',
                'First Aid Essentials Kit',
                'Posture Support Brace',
                'Foam Massage Roller',
                'Sleep Comfort Eye Mask',
                'Digital Body Weight Scale',
                'Hand Grip Strengthener'
            ] :: TEXT []
        ),
        (
            'sports',
            'PeakMotion',
            1600 :: INTEGER,
            ARRAY [
                'Professional Basketball',
                'Training Soccer Ball',
                'Adjustable Jump Rope',
                'Resistance Band Set',
                'Yoga Exercise Mat',
                'Adjustable Dumbbell Set',
                'Sports Water Bottle',
                'Tennis Racket',
                'Compression Knee Sleeve',
                'Quick-Dry Gym Towel'
            ] :: TEXT []
        ),
        (
            'outdoors',
            'TrailBound',
            2200 :: INTEGER,
            ARRAY [
                'Lightweight Camping Tent',
                'Insulated Sleeping Bag',
                'Rechargeable Camping Lantern',
                'Hiking Daypack',
                'Stainless Steel Water Flask',
                'Compact Camping Stove',
                'Portable Folding Chair',
                'Waterproof Dry Bag',
                'Trekking Pole Set',
                'Emergency Survival Kit'
            ] :: TEXT []
        ),
        (
            'toys',
            'BrightPlay',
            1100 :: INTEGER,
            ARRAY [
                'Wooden Building Block Set',
                'Remote Control Racing Car',
                'Creative Art Supply Kit',
                'Interactive Learning Tablet',
                'Plush Dinosaur Toy',
                'Magnetic Tile Building Set',
                'Kids Doctor Play Set',
                'Bubble Making Machine',
                'Wooden Train Set',
                'Mini Construction Vehicle Set'
            ] :: TEXT []
        ),
        (
            'games',
            'NextMove',
            1400 :: INTEGER,
            ARRAY [
                'Family Strategy Board Game',
                'Classic Playing Card Set',
                'Wooden Chess Set',
                'Mystery Adventure Game',
                'Fast-Paced Word Game',
                'Fantasy Roleplaying Dice Set',
                'Trivia Challenge Game',
                'Deluxe Poker Chip Set',
                'Cooperative Puzzle Game',
                'Portable Magnetic Checkers'
            ] :: TEXT []
        ),
        (
            'automotive',
            'RoadPro',
            1700 :: INTEGER,
            ARRAY [
                'Portable Tire Inflator',
                'Car Phone Mount',
                'Microfiber Car Cleaning Kit',
                'Heavy Duty Jumper Cables',
                'Universal Car Seat Cover',
                'Digital Tire Pressure Gauge',
                'Trunk Storage Organizer',
                'Windshield Sun Shade',
                'USB Car Charger',
                'Emergency Roadside Kit'
            ] :: TEXT []
        ),
        (
            'grocery',
            'DailyHarvest',
            450 :: INTEGER,
            ARRAY [
                'Organic Ground Coffee',
                'Whole Grain Breakfast Oats',
                'Natural Peanut Butter',
                'Premium Green Tea',
                'Dark Chocolate Bar',
                'Roasted Almond Mix',
                'Italian Pasta Pack',
                'Extra Virgin Olive Oil',
                'Wildflower Honey',
                'Sea Salt Popcorn'
            ] :: TEXT []
        ),
        (
            'pet-supplies',
            'HappyPaws',
            800 :: INTEGER,
            ARRAY [
                'Orthopedic Pet Bed',
                'Adjustable Dog Collar',
                'Interactive Cat Toy',
                'Stainless Steel Pet Bowl',
                'Retractable Dog Leash',
                'Pet Grooming Brush',
                'Portable Pet Water Bottle',
                'Washable Training Pads',
                'Cat Scratching Board',
                'Pet Travel Carrier'
            ] :: TEXT []
        ),
        (
            'office-supplies',
            'WorkWise',
            600 :: INTEGER,
            ARRAY [
                'Hardcover Meeting Notebook',
                'Smooth Writing Pen Set',
                'Adjustable Desk Organizer',
                'Heavy Duty Stapler',
                'Colorful Sticky Note Pack',
                'Desktop Document Tray',
                'Permanent Marker Set',
                'Weekly Planning Pad',
                'Metal Bookend Pair',
                'Portable File Folder'
            ] :: TEXT []
        ),
        (
            'jewelry',
            'LunaStone',
            2400 :: INTEGER,
            ARRAY [
                'Sterling Silver Pendant Necklace',
                'Minimalist Gold-Plated Ring',
                'Classic Hoop Earrings',
                'Natural Stone Bracelet',
                'Layered Chain Necklace',
                'Pearl Stud Earrings',
                'Adjustable Cuff Bracelet',
                'Crystal Drop Earrings',
                'Personalized Initial Necklace',
                'Stainless Steel Signet Ring'
            ] :: TEXT []
        ),
        (
            'shoes',
            'StrideWorks',
            3200 :: INTEGER,
            ARRAY [
                'Everyday Running Shoes',
                'Classic Canvas Sneakers',
                'Waterproof Hiking Boots',
                'Comfort Walking Shoes',
                'Lightweight Training Shoes',
                'Slip-On Casual Loafers',
                'Cushioned Tennis Shoes',
                'Leather Dress Shoes',
                'Warm Winter Boots',
                'Adjustable Sport Sandals'
            ] :: TEXT []
        ),
        (
            'bags',
            'CarryAll',
            2600 :: INTEGER,
            ARRAY [
                'Water-Resistant Laptop Backpack',
                'Canvas Weekend Duffel Bag',
                'Compact Crossbody Bag',
                'Reusable Grocery Tote',
                'Professional Messenger Bag',
                'Lightweight Travel Backpack',
                'Insulated Lunch Bag',
                'Expandable Carry-On Bag',
                'Drawstring Gym Bag',
                'Minimalist Shoulder Bag'
            ] :: TEXT []
        ),
        (
            'music',
            'SoundHouse',
            1300 :: INTEGER,
            ARRAY [
                'Acoustic Guitar Starter Guide',
                'Digital Piano Song Collection',
                'Classic Rock Vinyl Album',
                'Jazz Essentials Vinyl Album',
                'Guitar String Set',
                'Adjustable Guitar Strap',
                'Portable Music Stand',
                'Instrument Tuner',
                'Studio Microphone Stand',
                'Padded Drum Practice Pad'
            ] :: TEXT []
        ),
        (
            'movies',
            'SilverScreen',
            1000 :: INTEGER,
            ARRAY [
                'Galactic Horizon 4K Edition',
                'The Last Detective Blu-ray',
                'Wild Earth Documentary Collection',
                'Legends of the Ocean DVD',
                'Midnight City Blu-ray',
                'Animated Adventures Collection',
                'Classic Cinema Essentials',
                'The Forgotten Kingdom 4K Edition',
                'Comedy Night Collection',
                'World Cinema Collection'
            ] :: TEXT []
        )
),
expanded_products AS (
    SELECT
        template.category_name,
        template.brand,
        template.base_price,
        product.product_name,
        product.item_number
    FROM
        product_templates AS template
        CROSS JOIN LATERAL unnest(template.product_names) WITH ORDINALITY AS product(product_name, item_number)
),
numbered_products AS (
    SELECT
        expanded_products.*,
        row_number() OVER (
            ORDER BY
                category_name,
                item_number
        ) AS global_number
    FROM
        expanded_products
),
prepared_products AS (
    SELECT
        product_name AS name,
        format(
            '%s by %s. A quality product from the %s collection.',
            product_name,
            brand,
            replace(category_name, '-', ' ')
        ) AS description,
        format('PRD-%s', lpad(global_number :: TEXT, 4, '0')) AS sku,
        category_name,
        base_price + (item_number * 275) AS price_amount,
        25 + ((global_number * 17) % 476) :: INTEGER AS inventory,
        format(
            'products/PRD-%s.jpg',
            lpad(global_number :: TEXT, 4, '0')
        ) AS image_key,
        jsonb_build_object(
            'brand',
            brand,
            'category',
            category_name,
            'featured',
            (item_number <= 2),
            'rating',
            round(
                (3.5 + ((global_number % 15) :: NUMERIC / 10)),
                1
            ),
            'specs',
            jsonb_build_object(
                'model',
                format(
                    '%s-%s',
                    upper(left(replace(category_name, '-', ''), 3)),
                    global_number
                ),
                'warranty_months',
                CASE
                    WHEN category_name IN (
                        'electronics',
                        'automotive',
                        'kitchen'
                    ) THEN 24
                    ELSE 12
                END
            )
        ) AS meta
    FROM
        numbered_products
)
INSERT INTO
    products (
        merchant_id,
        name,
        description,
        sku,
        category_id,
        price_amount,
        inventory,
        image_key,
        meta
    )
SELECT
    merchant.user_id,
    prepared.name,
    prepared.description,
    prepared.sku,
    categories.category_id,
    prepared.price_amount,
    prepared.inventory,
    prepared.image_key,
    prepared.meta
FROM
    prepared_products AS prepared
    JOIN categories ON categories.name = prepared.category_name
    JOIN users AS merchant_user ON merchant_user.email = 'storefront@example.com'
    JOIN merchant_profiles AS merchant ON merchant.user_id = merchant_user.user_id ON CONFLICT (sku) DO NOTHING;
