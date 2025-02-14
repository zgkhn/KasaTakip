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

  // Filtre state’leri
  const [filterUser, setFilterUser] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterMonth, setFilterMonth] = useState('');

  // Sayfalama state’leri
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Yeni ödeme için state (ödeme tarihi otomatik olarak günün tarihi)
  const [newPayment, setNewPayment] = useState({
    user_id: '',
    amount: '',
    payment_date: format(new Date(), 'yyyy-MM-dd', { locale: tr }),
    payment_month: format(new Date(), 'yyyy-MM', { locale: tr }),
  });

  // Düzenleme için state (ödeme tarihi kullanıcıya sorulmayacak)
  const [showEditModal, setShowEditModal] = useState(false);
  const [editPayment, setEditPayment] = useState<{
    id: string | null;
    user_id: string;
    amount: string;
    payment_date: string;
    payment_month: string;
  }>({
    id: null,
    user_id: '',
    amount: '',
    payment_date: format(new Date(), 'yyyy-MM-dd', { locale: tr }),
    payment_month: format(new Date(), 'yyyy-MM', { locale: tr }),
  });

  const handleOpenEditModal = (payment: Payment) => {
    setEditPayment({
      id: payment.id,
      user_id: payment.user_id,
      amount: payment.amount.toString(),
      // Eski ödeme tarihi alınsa da, güncelleme sırasında günün tarihi kullanılacak
      payment_date: payment.payment_date,
      payment_month: format(new Date(payment.payment_month), 'yyyy-MM', { locale: tr }),
    });
    setShowEditModal(true);
  };

  const handleEditPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPayment.id) return;
    try {
      // Güncelleme sırasında ödeme tarihi günün tarihi olarak belirlenecek
      const currentPaymentDate = format(new Date(), 'yyyy-MM-dd', { locale: tr });
      const { data, error } = await supabase
        .from('payments')
        .update({
          user_id: editPayment.user_id,
          amount: parseFloat(editPayment.amount),
          payment_date: currentPaymentDate,
          payment_month: `${editPayment.payment_month}-01`,
        })
        .eq('id', editPayment.id)
        .select();

      if (error) {
        console.error('Güncelleme Hatası:', error);
        throw error;
      }
      // Eğer data boş dizi geliyorsa; bu, güncellenmek istenen değerlerle
      // veritabanındaki değerlerin aynı olmasından kaynaklanabilir.
      toast.success('Ödeme başarıyla güncellendi');
      setShowEditModal(false);
      fetchPayments();
    } catch (error) {
      toast.error('Ödeme güncellenemedi');
    }
  };

  const handleDeletePayment = async (id: string) => {
    if (!window.confirm('Ödemeyi silmek istediğinize emin misiniz?')) return;
    try {
      const { data, error } = await supabase
        .from('payments')
        .delete()
        .eq('id', id)
        .select();

      if (error) {
        console.error('Silme Hatası:', error);
        throw error;
      }
      if (data && data.length === 0) {
        console.error('Silme gerçekleşmedi, eşleşen kayıt bulunamadı');
      }
      toast.success('Ödeme başarıyla silindi');
      fetchPayments();
    } catch (error) {
      toast.error('Ödeme silinemedi');
    }
  };

  useEffect(() => {
    fetchPayments();
    if (profile?.is_admin) {
      fetchMembers();
    }
    setCurrentPage(1);
  }, [profile?.id, filterUser, filterDate, filterMonth]);

  const fetchPayments = async () => {
    try {
      let query = supabase
        .from('payments')
        .select(`*, member:profiles!user_id(full_name)`)
        .order('payment_date', { ascending: false });

      if (!profile?.is_admin) {
        query = query.eq('user_id', profile?.id);
      } else {
        if (filterUser) {
          query = query.eq('user_id', filterUser);
        }
      }

      if (filterDate) {
        query = query.eq('payment_date', filterDate);
      }

      if (filterMonth) {
        // payment_month veritabanında 'YYYY-MM-01' formatında tutuluyor.
        query = query.eq('payment_month', `${filterMonth}-01`);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Ödemeler Getirme Hatası:', error);
        throw error;
      }
      setPayments(data || []);
    } catch (error) {
      toast.error('Ödemeler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').order('full_name');
      if (error) {
        console.error('Üyeler Getirme Hatası:', error);
        throw error;
      }
      setMembers(data || []);
    } catch (error) {
      toast.error('Üyeler yüklenemedi');
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Eklerken de ödeme tarihi günün tarihi olarak kullanılıyor.
      const currentPaymentDate = format(new Date(), 'yyyy-MM-dd', { locale: tr });
      const { error } = await supabase.from('payments').insert({
        user_id: newPayment.user_id,
        amount: parseFloat(newPayment.amount),
        payment_date: currentPaymentDate,
        payment_month: `${newPayment.payment_month}-01`,
        created_by: profile?.id,
      });
      if (error) {
        console.error('Ekleme Hatası:', error);
        throw error;
      }
      toast.success('Ödeme başarıyla eklendi');
      setShowAddModal(false);
      fetchPayments();
    } catch (error) {
      toast.error('Ödeme eklenemedi');
    }
  };

  if (loading) return <div className="text-center p-4">Yükleniyor...</div>;

  const indexOfLastPayment = currentPage * itemsPerPage;
  const indexOfFirstPayment = indexOfLastPayment - itemsPerPage;
  const currentPayments = payments.slice(indexOfFirstPayment, indexOfLastPayment);
  const totalPages = Math.ceil(payments.length / itemsPerPage);

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4">
        <h1 className="text-2xl font-semibold mb-2 sm:mb-0">Ödemeler</h1>
        {profile?.is_admin && (
          <button
            onClick={() => {
              // Modal açılırken tarihleri güncelliyoruz
              setNewPayment({
                user_id: '',
                amount: '',
                payment_date: format(new Date(), 'yyyy-MM-dd', { locale: tr }),
                payment_month: format(new Date(), 'yyyy-MM', { locale: tr }),
              });
              setShowAddModal(true);
            }}
            className="w-full sm:w-auto flex items-center justify-center bg-indigo-600 text-white px-4 py-2 rounded-md shadow hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4 mr-2" /> Ödeme Ekle
          </button>
        )}
      </div>

      {/* Filtre Alanları */}
      <div className="flex flex-wrap gap-4 mb-4">
        {profile?.is_admin && (
          <select
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="">Tüm Üyeler</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.full_name}
              </option>
            ))}
          </select>
        )}
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="p-2 border rounded"
          placeholder="Tarih"
        />
        <input
          type="month"
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className="p-2 border rounded"
          placeholder="Ay"
        />
      </div>

      {/* Tablo */}
      <div className="overflow-x-auto w-full">
        <table className="min-w-full border border-gray-200 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Üye</th>
              <th className="p-2 text-left">Tutar</th>
              <th className="p-2 text-left">Tarih</th>
              <th className="p-2 text-left">Ay</th>
              {profile?.is_admin && <th className="p-2 text-left">İşlemler</th>}
            </tr>
          </thead>
          <tbody>
            {currentPayments.map((payment) => (
              <tr key={payment.id} className="border-t">
                <td className="p-2">{(payment as any).member?.full_name}</td>
                <td className="p-2">₺{payment.amount.toFixed(2)}</td>
                <td className="p-2">
                  {format(new Date(payment.payment_date), 'dd-MM-yyyy', { locale: tr })}
                </td>
                <td className="p-2">
                  {format(new Date(payment.payment_month), 'MMMM yyyy', { locale: tr })}
                </td>
                {profile?.is_admin && (
                  <td className="p-2">
                    <button
                      onClick={() => handleOpenEditModal(payment)}
                      className="text-blue-600 hover:underline mr-2"
                    >
                      Düzenle
                    </button>
                    <button
                      onClick={() => handleDeletePayment(payment.id)}
                      className="text-red-600 hover:underline"
                    >
                      Sil
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sayfalama Kontrolleri */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-4">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
            className="px-4 py-2 border rounded mr-2 disabled:opacity-50"
          >
            Önceki
          </button>
          <span>
            {currentPage} / {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
            className="px-4 py-2 border rounded ml-2 disabled:opacity-50"
          >
            Sonraki
          </button>
        </div>
      )}

      {/* Ekleme Modalı */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-2 relative">
            {/* Kapatma Butonu */}
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
            >
              X
            </button>
            <h3 className="text-lg font-medium mb-4">Yeni Ödeme Ekle</h3>
            <form onSubmit={handleAddPayment} className="space-y-4">
              <select
                value={newPayment.user_id}
                onChange={(e) => setNewPayment({ ...newPayment, user_id: e.target.value })}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">Bir üye seçin</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.full_name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Tutar"
                value={newPayment.amount}
                onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
              {/* Ödeme tarihi input'u kaldırıldı, günün tarihi otomatik kullanılıyor */}
              <input
                type="month"
                value={newPayment.payment_month}
                onChange={(e) => setNewPayment({ ...newPayment, payment_month: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
              <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700"
              >
                Kaydet
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Düzenleme Modalı */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-2 relative">
            {/* Kapatma Butonu */}
            <button
              onClick={() => setShowEditModal(false)}
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
            >
              X
            </button>
            <h3 className="text-lg font-medium mb-4">Ödemeyi Düzenle</h3>
            <form onSubmit={handleEditPayment} className="space-y-4">
              <select
                value={editPayment.user_id}
                onChange={(e) => setEditPayment({ ...editPayment, user_id: e.target.value })}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">Bir üye seçin</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.full_name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Tutar"
                value={editPayment.amount}
                onChange={(e) => setEditPayment({ ...editPayment, amount: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
              {/* Ödeme tarihi input'u kaldırıldı; güncelleme anında günün tarihi kullanılacak */}
              <input
                type="month"
                value={editPayment.payment_month}
                onChange={(e) => setEditPayment({ ...editPayment, payment_month: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
              <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700"
              >
                Güncelle
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
