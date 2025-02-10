import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Eye, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

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

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
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
  };

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
      [key: string]: { 
        [key: string]: { 
          isPaid: boolean; 
          amount: number;
          payments: number[];
        } 
      } 
    } = {};
    
    // Son 2 yılı oluştur
    const currentYear = new Date().getFullYear();
    for (let year = currentYear; year >= currentYear - 1; year--) {
      grouped[year] = {};
      Object.keys(allMonths).forEach(month => {
        grouped[year][allMonths[month]] = {
          isPaid: false,
          amount: 0,
          payments: []
        };
      });
    }
    
    // Ödemeleri topla
    payments.forEach(payment => {
      const [year, month] = payment.payment_month.split('-');
      const monthName = allMonths[month];
      
      if (grouped[year] && monthName) {
        if (!grouped[year][monthName].isPaid) {
          grouped[year][monthName].isPaid = true;
        }
        grouped[year][monthName].payments.push(payment.amount);
        grouped[year][monthName].amount = grouped[year][monthName].payments.reduce((a, b) => a + b, 0);
      }
    });
    
    return grouped;
  };

  const calculateTotalPayments = () => {
    return payments.reduce((total, payment) => total + payment.amount, 0);
  };

  if (!profile?.is_admin) {
    return <div>Bu sayfaya erişim yetkiniz yok.</div>;
  }

  if (loading) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <div>
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

      {/* Detay Modal */}
      {showDetailModal && selectedMember && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">
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
                        <h3 className="text-lg leading-6 font-medium text-gray-900">{year} Yılı Ödemeleri</h3>
                      </div>
                      <div className="border-t border-gray-200">
                        <div className="grid grid-cols-3 gap-4 p-4">
                          {Object.entries(months).map(([month, data]) => (
                            <div 
                              key={month} 
                              className={`p-3 rounded-lg ${
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Members;