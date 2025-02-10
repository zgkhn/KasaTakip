import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Payment, Profile } from '../types/database';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const Payments: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [members, setMembers] = useState<Profile[]>([]);
  const { profile } = useAuth();

  const [newPayment, setNewPayment] = useState({
    user_id: '',
    amount: '',
    payment_date: format(new Date(), 'yyyy-MM-dd', { locale: tr }),
    payment_month: format(new Date(), 'yyyy-MM', { locale: tr }),
  });

  useEffect(() => {
    fetchPayments();
    if (profile?.is_admin) {
      fetchMembers();
    }
  }, [profile?.id]);

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          member:profiles!user_id(full_name)
        `)
        .eq('user_id', profile?.id) // Giriş yapan kullanıcının kayıtlarını filtreliyoruz.
        .order('payment_date', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Ödemeler alınırken hata oluştu:', error);
      toast.error('Ödemeler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Üyeler alınırken hata oluştu:', error);
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('payments').insert({
        user_id: newPayment.user_id,
        amount: parseFloat(newPayment.amount),
        payment_date: newPayment.payment_date,
        payment_month: `${newPayment.payment_month}-01`,
        created_by: profile?.id,
      });

      if (error) throw error;

      toast.success('Ödeme başarıyla eklendi');
      setShowAddModal(false);
      setNewPayment({
        user_id: '',
        amount: '',
        payment_date: format(new Date(), 'yyyy-MM-dd', { locale: tr }),
        payment_month: format(new Date(), 'yyyy-MM', { locale: tr }),
      });
      fetchPayments();
    } catch (error) {
      console.error('Ödeme eklenirken hata oluştu:', error);
      toast.error('Ödeme eklenemedi');
    }
  };

  if (loading) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <div>
      <div className="sm:flex sm:items-center mb-6">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Ödemeler</h1>
        </div>
        {profile?.is_admin && (
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ödeme Ekle
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Üye
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Tutar
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Ödeme Tarihi
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Ödeme Ayı
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {payments.map((payment) => (
                    <tr key={payment.id}>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {(payment as any).member?.full_name}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        ₺{payment.amount.toFixed(2)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {format(new Date(payment.payment_date), 'dd-MM-yyyy', { locale: tr })}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {format(new Date(payment.payment_month), 'MMMM yyyy', { locale: tr })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <form onSubmit={handleAddPayment}>
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Yeni Ödeme Ekle
                  </h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="member" className="block text-sm font-medium text-gray-700">
                      Üye
                    </label>
                    <select
                      id="member"
                      value={newPayment.user_id}
                      onChange={(e) => setNewPayment({ ...newPayment, user_id: e.target.value })}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                      required
                    >
                      <option value="">Bir üye seçin</option>
                      {members.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.full_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                      Tutar
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">₺</span>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        id="amount"
                        value={newPayment.amount}
                        onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                        className="pl-7 block w-full pr-12 sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="payment_date" className="block text-sm font-medium text-gray-700">
                      Ödeme Tarihi
                    </label>
                    <div className="mt-1">
                      <input
                        type="date"
                        id="payment_date"
                        value={newPayment.payment_date}
                        onChange={(e) => setNewPayment({ ...newPayment, payment_date: e.target.value })}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="payment_month" className="block text-sm font-medium text-gray-700">
                      Ödeme Ayı
                    </label>
                    <div className="mt-1">
                      <input
                        type="month"
                        id="payment_month"
                        value={newPayment.payment_month}
                        onChange={(e) => setNewPayment({ ...newPayment, payment_month: e.target.value })}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-5 sm:mt-6">
                  <button
                    type="submit"
                    className="inline-flex justify-center w-full rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:text-sm"
                  >
                    Kaydet
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
