import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Eye, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import html2canvas from 'html2canvas';

interface Profile {
  id: string;
  full_name: string;
  is_admin: boolean;
  created_at: string;
}

interface Payment {
  id: string;
  user_id: string;
  amount: number;
  payment_date: string;
  payment_month: string;
  created_at: string;
}

const Members: React.FC = () => {
  const [members, setMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Profile | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const { profile } = useAuth();
  const modalRef = useRef<HTMLDivElement>(null);

  // Üyeleri getirme işlemini useCallback ile sarmallıyoruz
  const fetchMembers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');

      if (error) throw error;
      setMembers(data);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast.error('Üyeleri yüklerken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const fetchMemberPayments = async (memberId: string) => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', memberId)
        .order('payment_date', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Ödemeleri yüklerken bir hata oluştu');
    }
  };

  const handleShowDetails = async (member: Profile) => {
    setSelectedMember(member);
    await fetchMemberPayments(member.id);
    setShowDetailModal(true);
  };

  // Ödemeleri yıl ve aya göre gruplandırıyoruz
  const groupPaymentsByYearAndMonth = () => {
    const allMonths: Record<string, string> = {
      '01': 'Ocak',
      '02': 'Şubat',
      '03': 'Mart',
      '04': 'Nisan',
      '05': 'Mayıs',
      '06': 'Haziran',
      '07': 'Temmuz',
      '08': 'Ağustos',
      '09': 'Eylül',
      '10': 'Ekim',
      '11': 'Kasım',
      '12': 'Aralık'
    };

    const grouped: { 
      [year: string]: { 
        [monthName: string]: { 
          isPaid: boolean; 
          amount: number;
          payments: number[];
        } 
      } 
    } = {};
    const monthOrder = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

    // Son 2 yılı (mevcut yıl ve önceki yıl) kapsayacak şekilde oluşturuyoruz.
    const currentYear = new Date().getFullYear();
    for (let year = currentYear; year >= currentYear - 1; year--) {
      grouped[year] = {};
      monthOrder.forEach(month => {
        grouped[year][allMonths[month]] = {
          isPaid: false,
          amount: 0,
          payments: []
        };
      });
    }
    
    // Ödeme verilerini grupluyoruz
    payments.forEach(payment => {
      const [year, month] = payment.payment_month.split('-');
      const monthName = allMonths[month];
      
      if (grouped[year] && monthName) {
        grouped[year][monthName].isPaid = true;
        grouped[year][monthName].payments.push(payment.amount);
        grouped[year][monthName].amount = grouped[year][monthName].payments.reduce((a, b) => a + b, 0);
      }
    });
    
    return grouped;
  };

  const calculateTotalPayments = () => {
    return payments.reduce((total, payment) => total + payment.amount, 0);
  };

  const closeModal = () => {
    setShowDetailModal(false);
    setSelectedMember(null);
    setPayments([]);
  };

  // Popup görselini yakalayıp paylaşmayı deneyelim.
  const handleShareModal = async () => {
    if (modalRef.current) {
      try {
        const canvas = await html2canvas(modalRef.current);
        canvas.toBlob(async (blob) => {
          if (blob) {
            const file = new File([blob], 'popup.png', { type: 'image/png' });
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
              try {
                await navigator.share({
                  title: 'Aidat Geçmişi Popup',
                  text: 'İşte aidat geçmişi popup görseli:',
                  files: [file],
                });
                toast.success('Paylaşım başarılı!');
              } catch (error) {
                console.error('Error sharing:', error);
                toast.error('Paylaşım sırasında hata oluştu.');
              }
            } else {
              // Fallback: Görseli yeni pencerede aç
              const url = URL.createObjectURL(file);
              window.open(url, '_blank');
              toast('Görsel yeni sekmede açıldı. Lütfen oradan paylaşın.');
            }
          }
        });
      } catch (error) {
        console.error('Error capturing modal:', error);
        toast.error('Popup görseli oluşturulurken hata oluştu.');
      }
    }
  };

  if (!profile?.is_admin) {
    return <div>Bu sayfaya erişim yetkiniz yok.</div>;
  }

  if (loading) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <div className="p-4">
      <div className="sm:flex sm:items-center mb-6">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Üyeler</h1>
        </div>
      </div>

      <div className="flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Ad Soyad
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Rol
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {members.map((member) => (
                    <tr key={member.id}>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {member.full_name}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {member.is_admin ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            Yönetici
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Üye
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <button
                          onClick={() => handleShowDetails(member)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Overlay'a tıklanırsa kapanır */}
      {showDetailModal && selectedMember && (
        <div 
          className="fixed inset-0 z-10 overflow-y-auto" 
          onClick={closeModal}
        >
          {/* Overlay arka plan */}
          <div className="absolute inset-0 bg-black bg-opacity-40" />

          {/* Modal içeriği */}
          <div 
            className="relative flex items-center justify-center min-h-screen px-4" 
            onClick={(e) => e.stopPropagation()}
          >
            <div 
              ref={modalRef} 
              className="relative bg-white rounded-lg shadow-xl w-full max-w-lg sm:max-w-2xl transform transition-all duration-300"
            >
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  onClick={closeModal}
                  className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="px-4 pt-5 pb-4 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {selectedMember.full_name} - Aidat Geçmişi
                </h3>
                <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-md mb-4">
                  <span className="font-medium">Toplam Ödenmiş Aidat: </span>
                  <span className="text-green-600 font-medium">
                    ₺{calculateTotalPayments().toFixed(2)}
                  </span>
                </div>

                <div className="mt-6 space-y-8">
                  {Object.entries(groupPaymentsByYearAndMonth()).map(([year, months]) => (
                    <div key={year} className="bg-white shadow overflow-hidden sm:rounded-lg">
                      <div className="px-4 py-5 sm:px-6 bg-gray-50">
                        <h3 className="text-lg font-medium text-gray-900">{year} Yılı Ödemeleri</h3>
                      </div>
                      <div className="border-t border-gray-200">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4">
                          {Object.entries(months).map(([month, data]) => (
                            <div 
                              key={month} 
                              className={`p-3 rounded-lg text-center ${
                                data.isPaid 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-500'
                              }`}
                            >
                              <div className="flex flex-col items-center justify-center">
                                <div className="flex items-center space-x-2">
                                  <span>{month}</span>
                                  {data.isPaid && (
                                    <svg 
                                      className="h-5 w-5 text-green-600" 
                                      fill="none" 
                                      strokeLinecap="round" 
                                      strokeLinejoin="round" 
                                      strokeWidth="2" 
                                      viewBox="0 0 24 24" 
                                      stroke="currentColor"
                                    >
                                      <path d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>
                                {data.isPaid && (
                                  <div className="text-sm font-medium mt-1">
                                    ₺{data.amount.toFixed(2)}
                                    {data.payments.length > 1 && (
                                      <span className="text-xs ml-1">
                                        ({data.payments.length} taksit)
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal alt kısmında butonlar */}
              <div className="flex justify-end space-x-3 px-4 pb-4 sm:px-6">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Kapat
                </button>
                <button
                  onClick={handleShareModal}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Bilgilendir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Members;
