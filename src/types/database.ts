export interface Profile {
  id: string;
  full_name: string;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  amount: number;
  payment_date: string;
  payment_month: string;
  created_at: string;
  created_by: string;
  profiles?: {
    full_name: string;
  };
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  expense_date: string;
  created_at: string;
  created_by: string;
}

export interface MonthlySummary {
  total_payments: number;
  total_expenses: number;
  balance: number;
  previous_balance: number;
}