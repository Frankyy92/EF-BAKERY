INSERT INTO shops (name, city, address) VALUES
('À deux mains', 'Suresnes', '8 place du Général Leclerc'),
('Saint-Germain', 'Saint-Germain-en-Laye', 'Centre ville'),
('Rueil-Malmaison', 'Rueil-Malmaison', 'Quartier marché');

INSERT INTO products (sku, name, unit, category) VALUES
('BAGUETTE', 'Baguette', 'pcs', 'pain'),
('CROISSANT', 'Croissant', 'pcs', 'viennoiserie'),
('PAINCHOCO', 'Pain au chocolat', 'pcs', 'viennoiserie');

INSERT INTO raw_materials (sku, name, unit) VALUES
('FARINE-T65', 'Farine T65', 'kg'),
('LEVURE', 'Levure boulangère', 'g'),
('BEURRE-AOP', 'Beurre AOP', 'kg');

-- Exemples de commandes
INSERT INTO orders (shop_id, date, status) VALUES (1, date('now'), 'submitted');
INSERT INTO order_items (order_id, product_id, quantity) VALUES (1, 1, 120), (1, 2, 60), (1, 3, 50);
