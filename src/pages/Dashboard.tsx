import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { supabase } from '../lib/supabase';

const Dashboard: React.FC = () => {
  const [yearlySummary, setYearlySummary] = useState<{ month: string; totalPayments: number; totalExpenses: number; balance: number; }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchYearlySummary();
  }, [selectedYear]);

  const fetchYearlySummary = async () => {
    try {
      setLoading(true);
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('amount, payment_month')
        .gte('payment_month', `${selectedYear}-01-01`)
        .lte('payment_month', `${selectedYear}-12-31`);

      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('amount, expense_date')
        .gte('expense_date', `${selectedYear}-01-01`)
        .lte('expense_date', `${selectedYear}-12-31`);

      if (paymentsError) throw paymentsError;
      if (expensesError) throw expensesError;

      const monthlyData = Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        const totalPayments = paymentsData
          .filter(p => new Date(p.payment_month).getMonth() + 1 === month)
          .reduce((sum, p) => sum + p.amount, 0);

        const totalExpenses = expensesData
          .filter(e => new Date(e.expense_date).getMonth() + 1 === month)
          .reduce((sum, e) => sum + e.amount, 0);

        return {
          month: format(new Date(selectedYear, i, 1), 'MMMM', { locale: tr }),
          totalPayments,
          totalExpenses,
          balance: totalPayments - totalExpenses,
        };
      });

      setYearlySummary(monthlyData);
    } catch (error) {
      console.error('Yıllık özet alınırken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleYearChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedYear(parseInt(event.target.value));
  };

  if (loading) {
    return <div className="text-center">Veriler yükleniyor...</div>;
  }

  const totalYearlyIncome = yearlySummary.reduce((sum: number, month) => sum + month.totalPayments, 0);
  const totalYearlyExpenses = yearlySummary.reduce((sum: number, month) => sum + month.totalExpenses, 0);
  const totalYearlyBalance = totalYearlyIncome - totalYearlyExpenses;

  return (
    <div className="p-4">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4 sm:mb-0">Yıllık Genel Bakış</h1>
        <select
          className="border rounded-md p-2 text-sm sm:text-base"
          value={selectedYear}
          onChange={handleYearChange}
        >
          {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr>
              <th className="px-4 py-2 border">Ay</th>
              <th className="px-4 py-2 border">Toplam Gelir</th>
              <th className="px-4 py-2 border">Toplam Gider</th>
              <th className="px-4 py-2 border">Toplam Bakiye</th>
            </tr>
          </thead>
          <tbody>
            {yearlySummary.map((monthData, index) => (
              <tr key={index} className="text-center">
                <td className="px-4 py-2 border">{index + 1}. {monthData.month}</td>
                <td className="px-4 py-2 border text-green-600">₺{monthData.totalPayments.toFixed(2)}</td>
                <td className="px-4 py-2 border text-red-600">₺{monthData.totalExpenses.toFixed(2)}</td>
                <td className={`px-4 py-2 border ${monthData.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ₺{monthData.balance.toFixed(2)}
                </td>
              </tr>
            ))}
            <tr className="font-bold text-center bg-gray-200">
              <td className="px-4 py-2 border">Yıl Toplamı</td>
              <td className="px-4 py-2 border text-green-600">₺{totalYearlyIncome.toFixed(2)}</td>
              <td className="px-4 py-2 border text-red-600">₺{totalYearlyExpenses.toFixed(2)}</td>
              <td className={`px-4 py-2 border ${totalYearlyBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₺{totalYearlyBalance.toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
