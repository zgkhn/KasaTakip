import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { supabase } from '../lib/supabase';
import { Payment, Profile } from '../types/database';

interface NonPayingMonth {
  month: string;
  monthIndex: number;
  members: Profile[];
}

const Dashboard: React.FC = () => {
  // Yıllık özet için state
  const [yearlySummary, setYearlySummary] = useState<
    { month: string; totalPayments: number; totalExpenses: number; balance: number }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Devreden bakiye (geçmiş yıllardan kalan bakiye)
  const [carryOverBalance, setCarryOverBalance] = useState<number>(0);

  // Aylara göre ödeme yapmayan üyeler için state (ay indeksi de eklendi)
  const [nonPayingByMonth, setNonPayingByMonth] = useState<NonPayingMonth[]>([]);

  useEffect(() => {
    fetchYearlySummary();
    fetchNonPayingMembersByMonth();
    fetchCarryOverBalance();
  }, [selectedYear]);

  // Geçmiş yıl verilerini çekip devreden bakiyeyi hesaplıyoruz.
  const fetchCarryOverBalance = async () => {
    try {
      const { data: previousPaymentsData, error: previousPaymentsError } = await supabase
        .from('payments')
        .select('amount, payment_month')
        .lt('payment_month', `${selectedYear}-01-01`);
      if (previousPaymentsError) throw previousPaymentsError;

      const { data: previousExpensesData, error: previousExpensesError } = await supabase
        .from('expenses')
        .select('amount, expense_date')
        .lt('expense_date', `${selectedYear}-01-01`);
      if (previousExpensesError) throw previousExpensesError;

      const totalPreviousPayments = (previousPaymentsData || []).reduce(
        (sum: number, p: any) => sum + p.amount,
        0
      );
      const totalPreviousExpenses = (previousExpensesData || []).reduce(
        (sum: number, e: any) => sum + e.amount,
        0
      );
      setCarryOverBalance(totalPreviousPayments - totalPreviousExpenses);
    } catch (error) {
      console.error('Geçmiş yıl devreden bakiye alınırken hata:', error);
    }
  };

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
        const totalPayments = (paymentsData || [])
          .filter((p: any) => new Date(p.payment_month).getMonth() + 1 === month)
          .reduce((sum: number, p: any) => sum + p.amount, 0);

        const totalExpenses = (expensesData || [])
          .filter((e: any) => new Date(e.expense_date).getMonth() + 1 === month)
          .reduce((sum: number, e: any) => sum + e.amount, 0);

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

  const fetchNonPayingMembersByMonth = async () => {
    try {
      // Tüm üyeleri getiriyoruz
      const { data: membersData, error: membersError } = await supabase
        .from('profiles')
        .select('*');
      if (membersError) throw membersError;

      // Seçilen yıl için ödemeleri getiriyoruz
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('user_id, payment_month')
        .gte('payment_month', `${selectedYear}-01-01`)
        .lte('payment_month', `${selectedYear}-12-31`);
      if (paymentsError) throw paymentsError;

      const nonPayingArray: NonPayingMonth[] = [];

      for (let i = 0; i < 12; i++) {
        const monthDate = new Date(selectedYear, i, 1);
        const paidUserIds = new Set(
          (paymentsData || [])
            .filter((p: any) => {
              const pDate = new Date(p.payment_month);
              return pDate.getFullYear() === selectedYear && pDate.getMonth() === i;
            })
            .map((p: any) => p.user_id)
        );
        const nonPayingMembersForMonth = (membersData || []).filter(
          (member: any) => !paidUserIds.has(member.id)
        );
        nonPayingArray.push({
          month: format(monthDate, 'MMMM', { locale: tr }),
          monthIndex: i,
          members: nonPayingMembersForMonth,
        });
      }

      setNonPayingByMonth(nonPayingArray);
    } catch (error) {
      console.error('Ödeme yapmayan üyeler getirilirken hata:', error);
    }
  };

  const handleYearChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedYear(parseInt(event.target.value));
  };

  if (loading) {
    return <div className="text-center">Veriler yükleniyor...</div>;
  }

  const totalYearlyIncome = yearlySummary.reduce((sum, month) => sum + month.totalPayments, 0);
  const totalYearlyExpenses = yearlySummary.reduce((sum, month) => sum + month.totalExpenses, 0);
  const totalYearlyBalance = yearlySummary.reduce((sum, month) => sum + month.balance, 0);

  // Eğer seçilen yıl bugünkü yıl ise, sadece geçerli ay ve önceki ayları gösterelim.
  const currentYear = new Date().getFullYear();
  const currentMonthIndex = new Date().getMonth();
  const filteredNonPaying = nonPayingByMonth.filter(monthData =>
    selectedYear < currentYear ? true : monthData.monthIndex <= currentMonthIndex
  );

  // Sadece ödeme yapmayan üyesi olan ayları gösterelim
  const nonPayingWithMembers = filteredNonPaying.filter(monthData => monthData.members.length > 0);

  // Yeni Yıl Toplamı: mevcut yıl toplam bakiyesi + devreden bakiye
  const finalTotalBalance = totalYearlyBalance + carryOverBalance;

  return (
    <div className="p-4">
      {/* Yıllık Genel Bakış */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4 sm:mb-0">
          Yıllık Genel Bakış
        </h1>
        <select
          className="border rounded-md p-2 text-sm sm:text-base"
          value={selectedYear}
          onChange={handleYearChange}
        >
          {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      {/* Yıllık Özet Tablosu */}
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
                <td className="px-4 py-2 border">
                  {index + 1}. {monthData.month}
                </td>
                <td className="px-4 py-2 border text-green-600">
                  ₺{monthData.totalPayments.toFixed(2)}
                </td>
                <td className="px-4 py-2 border text-red-600">
                  ₺{monthData.totalExpenses.toFixed(2)}
                </td>
                <td className={`px-4 py-2 border ${monthData.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ₺{monthData.balance.toFixed(2)}
                </td>
              </tr>
            ))}

            {/* Devreden bakiye sadece sıfırdan farklı ise gösterilsin */}
            {carryOverBalance !== 0 && (
              <tr className="text-center">
                <td className="px-4 py-2 border font-semibold">Devreden Bakiye</td>
                <td className="px-4 py-2 border"></td>
                <td className="px-4 py-2 border"></td>
                <td className={`px-4 py-2 border ${carryOverBalance >= 0 ? 'text-green-600' : 'text-red-600'} font-semibold`}>
                  ₺{carryOverBalance.toFixed(2)}
                </td>
              </tr>
            )}

            <tr className="font-bold text-center bg-gray-200">
              <td className="px-4 py-2 border">Yeni Yıl Toplamı</td>
              <td className="px-4 py-2 border text-green-600">
                ₺{totalYearlyIncome.toFixed(2)}
              </td>
              <td className="px-4 py-2 border text-red-600">
                ₺{totalYearlyExpenses.toFixed(2)}
              </td>
              <td className={`px-4 py-2 border ${finalTotalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₺{finalTotalBalance.toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Ödeme Yapmayan Üyeler Bölümü */}
      {nonPayingWithMembers.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-6">Ödeme Yapmayan Üyeler</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {nonPayingWithMembers.map((monthData, index) => (
              <div key={index} className="bg-white shadow rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4">{monthData.month}</h3>
                <ul className="divide-y">
                  {monthData.members.map((member) => (
                    <li key={member.id} className="py-2 flex items-center">
                      <div className="w-10 h-10 flex-shrink-0 bg-gray-200 rounded-full flex items-center justify-center mr-4">
                        <span className="text-sm font-medium text-gray-600">
                          {member.full_name.charAt(0)}
                        </span>
                      </div>
                      <span className="text-gray-800">{member.full_name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
