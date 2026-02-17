insert into public.users (id, role, restaurant_name, email, phone, delivery_address)
values
  ('e6a118e9-47f2-44d2-92f4-8e832f2cb10a', 'customer', 'Sushi Palace Restaurant', 'buyer@sushipalace.ae', '+971501234567', '{"city":"Dubai","area":"Jumeirah","street":"Al Wasl Road"}')
on conflict (id) do nothing;

insert into public.products (id, name, category, price, unit, description, image_url, certifications, stock_level, stock_status, ai_note)
values
  ('a30b8398-8f52-4f89-b3fa-0d89cd5fcb10', 'Japanese Milk Bread (Shokupan)', 'japanese', 45.00, '6 loaves per pack', 'Authentic Japanese milk bread with pillowy texture.', 'https://images.unsplash.com/photo-1608198093002-ad4e005484ec?auto=format&fit=crop&w=1200&q=80', '["Imported","Halal","Cold Chain"]'::jsonb, 180, 'In Stock', null),
  ('bfc29fb7-a28a-4858-af50-8f21b213f510', 'Ultra-Coarse Panko', 'japanese', 32.00, '2kg bag', 'Extra-crispy breadcrumb for premium fried texture.', 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=1200&q=80', '["Imported","Halal"]'::jsonb, 64, 'Low Stock', 'You usually reorder every 14 days'),
  ('93f96cc8-5e08-44a3-b2fe-8bbf7e53f8f0', 'Premium Ramadan Dates', 'ramadan', 85.00, '1 box', 'Jumbo medjool dates curated for Ramadan menus.', 'https://images.unsplash.com/photo-1615485925600-97237c4fc1ec?auto=format&fit=crop&w=1200&q=80', '["Halal","Premium Grade"]'::jsonb, 240, 'In Stock', null)
on conflict (id) do nothing;

insert into public.orders (id, user_id, order_number, items, total_amount, deposit_amount, deposit_paid, delivery_date, status, special_instructions)
values
  ('d67fbfc2-f4c9-4565-a4d8-cd977a4f89ce', 'e6a118e9-47f2-44d2-92f4-8e832f2cb10a', 'RAM-2026-0147', '[{"product_id":"a30b8398-8f52-4f89-b3fa-0d89cd5fcb10","name":"Japanese Milk Bread (Shokupan)","qty":6,"unit_price":45},{"product_id":"bfc29fb7-a28a-4858-af50-8f21b213f510","name":"Ultra-Coarse Panko","qty":4,"unit_price":32},{"product_id":"93f96cc8-5e08-44a3-b2fe-8bbf7e53f8f0","name":"Premium Ramadan Dates","qty":10,"unit_price":85}]'::jsonb,
  1248.00, 624.00, true, '2026-02-27', 'confirmed', 'Use service entrance, call on arrival')
on conflict (id) do nothing;

insert into public.ai_suggestions (id, user_id, title, message, action)
values
  ('0fc88036-e331-45f9-9c2f-6ce6bb6ea815', 'e6a118e9-47f2-44d2-92f4-8e832f2cb10a', 'Time to Reorder', 'Panko is projected to run out in 3 days based on your usage.', 'Quick Order AED 128'),
  ('9567e311-8df3-470a-9ea0-f55f73e5acfd', 'e6a118e9-47f2-44d2-92f4-8e832f2cb10a', 'Bundle Opportunity', 'Add Yuzu Juice. 72% of similar restaurants order both.', 'Add Bundle'),
  ('98cde9f9-e7dc-4f93-b870-fd8723a39173', 'e6a118e9-47f2-44d2-92f4-8e832f2cb10a', 'Container Share', 'Tokyo container is 67% full. Join now to lock 25% savings.', 'View Container')
on conflict (id) do nothing;
