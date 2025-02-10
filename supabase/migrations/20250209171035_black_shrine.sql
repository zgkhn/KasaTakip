/*
  # Create Initial Admin User

  1. Creates an admin user in auth.users
  2. Creates corresponding admin profile
*/

-- Create admin user in auth.users
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  gen_random_uuid(), -- id
  '00000000-0000-0000-0000-000000000000', -- instance_id
  'admin@caysekerparasi.com', -- email
  crypt('admin123', gen_salt('bf')), -- password: admin123
  now(), -- email_confirmed_at
  '{"provider":"email","providers":["email"]}', -- raw_app_meta_data
  '{}', -- raw_user_meta_data
  now(), -- created_at
  now(), -- updated_at
  '', -- confirmation_token
  '', -- email_change
  '', -- email_change_token_new
  '' -- recovery_token
) ON CONFLICT DO NOTHING;

-- Create admin profile
INSERT INTO public.profiles (
  id,
  full_name,
  is_admin,
  created_at,
  updated_at
)
SELECT
  id,
  'Admin User',
  true,
  now(),
  now()
FROM auth.users
WHERE email = 'admin@caysekerparasi.com'
ON CONFLICT DO NOTHING;