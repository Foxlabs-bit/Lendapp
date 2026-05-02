-- =============================================
-- LEND APP — Seed Data
-- Run AFTER supabase-migrations.sql
-- https://supabase.com/dashboard/project/nunygjzicawqvskxnawf/sql
-- =============================================

-- Step 1: Create auth users via Supabase Dashboard (Authentication > Users > Add user)
--   demo@lend.app  / Demo1234!
--   free@lend.app  / Free1234!
-- Then grab their UUIDs and replace below.

-- ============================================================
-- REPLACE THESE with the actual UUIDs from your auth.users table
-- after creating the users in the Supabase dashboard:
--   SELECT id, email FROM auth.users;
-- ============================================================
DO $$
DECLARE
  demo_id uuid;
  free_id uuid;
  item1 uuid := gen_random_uuid();
  item2 uuid := gen_random_uuid();
  item3 uuid := gen_random_uuid();
  item4 uuid := gen_random_uuid();
  item5 uuid := gen_random_uuid();
  item6 uuid := gen_random_uuid();
  item7 uuid := gen_random_uuid();
  item8 uuid := gen_random_uuid();
  item9 uuid := gen_random_uuid();
  item10 uuid := gen_random_uuid();
  item11 uuid := gen_random_uuid();
  item12 uuid := gen_random_uuid();
  borrow1 uuid := gen_random_uuid();
  borrow2 uuid := gen_random_uuid();
  borrow3 uuid := gen_random_uuid();
  loan1 uuid := gen_random_uuid();
  loan2 uuid := gen_random_uuid();
  loan3 uuid := gen_random_uuid();
  loan4 uuid := gen_random_uuid();
  loan5 uuid := gen_random_uuid();
  loan6 uuid := gen_random_uuid();
  loan7 uuid := gen_random_uuid();
  loan8 uuid := gen_random_uuid();
BEGIN
  -- Get user IDs
  SELECT id INTO demo_id FROM auth.users WHERE email = 'demo@lend.app';
  SELECT id INTO free_id FROM auth.users WHERE email = 'free@lend.app';

  IF demo_id IS NULL THEN
    RAISE EXCEPTION 'demo@lend.app not found in auth.users — create the user first in Supabase Auth dashboard';
  END IF;
  IF free_id IS NULL THEN
    RAISE EXCEPTION 'free@lend.app not found in auth.users — create the user first in Supabase Auth dashboard';
  END IF;

  -- Profiles
  INSERT INTO profiles (id, username, email, display_name, plan, item_limit)
  VALUES
    (demo_id, 'demo_user', 'demo@lend.app', 'Alex Demo', 'pro', 999999),
    (free_id, 'free_user', 'free@lend.app', 'Free User', 'free', 10)
  ON CONFLICT (id) DO UPDATE SET
    plan = EXCLUDED.plan,
    display_name = EXCLUDED.display_name,
    item_limit = EXCLUDED.item_limit;

  -- Items for demo user
  INSERT INTO items (id, owner_id, name, emoji, category, total_quantity, description, notes) VALUES
    (item1,  demo_id, 'Canon EOS R50 Camera', '📷', 'Electronics', 1, 'Mirrorless camera with 18-45mm kit lens', 'Keep in padded case'),
    (item2,  demo_id, 'DeWalt Drill Set', '🔨', 'Tools', 1, '20V cordless drill with 2 batteries and charger', NULL),
    (item3,  demo_id, 'The Art of War', '📚', 'Books', 2, 'Sun Tzu — classic strategy book', NULL),
    (item4,  demo_id, 'Camping Tent (4-person)', '🏕️', 'Sports', 1, 'Coleman 4-person instant tent', 'Stakes stored in red bag inside'),
    (item5,  demo_id, 'Ninja Air Fryer', '🍳', 'Kitchen', 1, 'Ninja AF101 4qt air fryer', NULL),
    (item6,  demo_id, 'MacBook Pro Charger', '💻', 'Electronics', 2, '140W USB-C MagSafe 3 charger', NULL),
    (item7,  demo_id, 'Road Bike', '🚴', 'Sports', 1, 'Trek FX3 disc — M frame, black', 'Lock code: 2580'),
    (item8,  demo_id, 'Power Washer', '💧', 'Tools', 1, 'Sun Joe SPX3000 pressure washer', NULL),
    (item9,  demo_id, 'Atomic Habits', '📖', 'Books', 3, 'James Clear — habit building', NULL),
    (item10, demo_id, 'Projector', '📽️', 'Electronics', 1, 'Epson EX3280 SVGA 3LCD projector', 'Remote in side pocket'),
    (item11, demo_id, 'Hedge Trimmer', '✂️', 'Tools', 1, 'Black+Decker 22in cordless', NULL),
    (item12, demo_id, 'Stand Mixer', '🥣', 'Kitchen', 1, 'KitchenAid Artisan 5qt tilt-head', NULL);

  -- Items for free user (7 items so they see 7/10 used)
  INSERT INTO items (id, owner_id, name, emoji, category, total_quantity) VALUES
    (gen_random_uuid(), free_id, 'Bluetooth Speaker', '🔊', 'Electronics', 1),
    (gen_random_uuid(), free_id, 'Yoga Mat', '🧘', 'Sports', 2),
    (gen_random_uuid(), free_id, 'Dutch Oven', '🍲', 'Kitchen', 1),
    (gen_random_uuid(), free_id, 'Ladder', '🪜', 'Tools', 1),
    (gen_random_uuid(), free_id, 'Kindle Paperwhite', '📱', 'Electronics', 1),
    (gen_random_uuid(), free_id, 'Sleeping Bag', '🛏️', 'Sports', 2),
    (gen_random_uuid(), free_id, 'Toolbox', '🧰', 'Tools', 1);

  -- Borrowers for demo user
  INSERT INTO borrowers (id, owner_id, name, email, phone, avatar_emoji, total_loans) VALUES
    (borrow1, demo_id, 'Sarah Chen', 'sarah@example.com', '+1 555-0101', '👩', 4),
    (borrow2, demo_id, 'Marcus Johnson', 'marcus@example.com', '+1 555-0102', '👨', 3),
    (borrow3, demo_id, 'Priya Patel', 'priya@example.com', NULL, '👩🏽', 2);

  -- Loans for demo user (mix of active, returned, overdue)
  INSERT INTO loans (id, owner_id, item_id, borrower_id, borrower_name, quantity, status, borrowed_at, due_at, returned_at, condition_out) VALUES
    -- Active loans
    (loan1, demo_id, item1, borrow1, 'Sarah Chen',     1, 'active',   current_date - 5,  current_date + 9,  NULL,                      'Perfect condition'),
    (loan2, demo_id, item2, borrow2, 'Marcus Johnson', 1, 'active',   current_date - 3,  current_date + 11, NULL,                      NULL),
    (loan3, demo_id, item4, borrow3, 'Priya Patel',    1, 'active',   current_date - 1,  current_date + 13, NULL,                      'All parts present'),
    -- Overdue loans
    (loan4, demo_id, item6, borrow1, 'Sarah Chen',     1, 'overdue',  current_date - 14, current_date - 2,  NULL,                      NULL),
    (loan5, demo_id, item7, borrow2, 'Marcus Johnson', 1, 'overdue',  current_date - 21, current_date - 7,  NULL,                      'Slight scratch on frame'),
    -- Returned loans
    (loan6, demo_id, item3, borrow3, 'Priya Patel',    1, 'returned', current_date - 30, current_date - 20, current_date - 21,         NULL),
    (loan7, demo_id, item9, borrow1, 'Sarah Chen',     1, 'returned', current_date - 20, current_date - 10, current_date - 8,          NULL),
    (loan8, demo_id, item10, borrow2, 'Marcus Johnson', 1, 'returned', current_date - 45, current_date - 35, current_date - 36,        NULL);

  -- Loan events
  INSERT INTO loan_events (loan_id, owner_id, event_type, metadata) VALUES
    (loan1, demo_id, 'created',  '{"borrower_name": "Sarah Chen"}'),
    (loan2, demo_id, 'created',  '{"borrower_name": "Marcus Johnson"}'),
    (loan3, demo_id, 'created',  '{"borrower_name": "Priya Patel"}'),
    (loan4, demo_id, 'created',  '{"borrower_name": "Sarah Chen"}'),
    (loan5, demo_id, 'created',  '{"borrower_name": "Marcus Johnson"}'),
    (loan6, demo_id, 'created',  '{"borrower_name": "Priya Patel"}'),
    (loan6, demo_id, 'returned', '{"condition_in": "Good"}'),
    (loan7, demo_id, 'created',  '{"borrower_name": "Sarah Chen"}'),
    (loan7, demo_id, 'returned', '{}'),
    (loan8, demo_id, 'created',  '{"borrower_name": "Marcus Johnson"}'),
    (loan8, demo_id, 'returned', '{}');

  -- Notifications for demo user
  INSERT INTO notifications (user_id, loan_id, title, body, is_read) VALUES
    (demo_id, loan4, '⚠️ Overdue loan', 'Sarah Chen has had your MacBook Pro Charger for 16 days — it was due 2 days ago.', false),
    (demo_id, loan5, '⚠️ Overdue loan', 'Marcus Johnson has had your Road Bike for 28 days — it was due 7 days ago.', false),
    (demo_id, loan7, '✅ Returned', 'Sarah Chen returned Atomic Habits.', true);

  RAISE NOTICE 'Seed data inserted successfully for % and %', demo_id, free_id;
END $$;
