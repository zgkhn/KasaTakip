/*
  # Initial Schema for Tea & Sugar Money Management System

  1. New Tables
    - `profiles`
      - Extends Supabase auth.users
      - Stores user profile information
      - Links to auth.users via id
    
    - `payments`
      - Tracks monthly payments from members
      - Records payment amount, date, and status
    
    - `expenses`
      - Tracks workshop expenses
      - Records expense details, amount, and date
    
  2. Security
    - Enable RLS on all tables
    - Set up policies for admin and regular users
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  full_name text NOT NULL,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) NOT NULL,
  amount decimal(10,2) NOT NULL,
  payment_date date NOT NULL,
  payment_month date NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id) NOT NULL
);

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text NOT NULL,
  amount decimal(10,2) NOT NULL,
  expense_date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id) NOT NULL
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can insert profiles"
  ON profiles FOR INSERT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_admin = true
  ));

CREATE POLICY "Only admins can update profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_admin = true
  ));

-- Payments policies
CREATE POLICY "Users can view all payments"
  ON payments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can insert payments"
  ON payments FOR INSERT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_admin = true
  ));

-- Expenses policies
CREATE POLICY "Users can view all expenses"
  ON expenses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage expenses"
  ON expenses FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_admin = true
  ));

-- Functions
CREATE OR REPLACE FUNCTION get_monthly_summary(year_month date)
RETURNS TABLE (
  total_payments decimal(10,2),
  total_expenses decimal(10,2),
  balance decimal(10,2)
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  WITH monthly_totals AS (
    SELECT
      COALESCE(SUM(p.amount), 0) as total_payments,
      COALESCE(SUM(e.amount), 0) as total_expenses
    FROM (
      SELECT date_trunc('month', year_month) as month
    ) d
    LEFT JOIN payments p ON date_trunc('month', p.payment_month) = d.month
    LEFT JOIN expenses e ON date_trunc('month', e.expense_date) = d.month
  )
  SELECT
    total_payments,
    total_expenses,
    (total_payments - total_expenses) as balance
  FROM monthly_totals;
END;
$$;