import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { CheckCircle } from "lucide-react";

const DuesHistory = () => {
  const { profile } = useAuth();
  const [dues, setDues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      fetchDues();
    }
  }, [profile?.id]);

  const fetchDues = async () => {
    try {
      const { data, error } = await supabase
        .from("payments")
        .select("amount, payment_month")
        .eq("user_id", profile?.id)
        .order("payment_month", { ascending: false });

      if (error) throw error;
      setDues(data || []);
    } catch (error) {
      console.error("Aidat bilgileri alınırken hata oluştu:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateDuesData = () => {
    const currentYear = new Date().getFullYear();
    const lastTwoYears = [currentYear - 1, currentYear];
    const months = [
      "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", 
      "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
    ];

    return lastTwoYears.map((year) => ({
      year,
      months: months.map((month, index) => {
        const monthIndex = index + 1;
        const payment = dues.find((d) => d.payment_month.startsWith(`${year}-${monthIndex.toString().padStart(2, "0")}`));
        return {
          name: month,
          amount: payment ? payment.amount : null,
        };
      }),
    }));
  };

  if (loading) return <div className="text-center py-4">Yükleniyor...</div>;

  return (
    <div className="p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        {profile?.full_name} - Aidat Geçmişi
      </h2>
      <div className="mb-4 p-3 bg-gray-100 rounded-md text-green-600 font-medium">
        Toplam Ödenmiş Aidat: ₺{dues.reduce((sum, d) => sum + d.amount, 0).toFixed(2)}
      </div>
      {generateDuesData().map((yearData) => (
        <div key={yearData.year} className="mb-6 border rounded-lg overflow-hidden shadow-sm">
          <div className="bg-gray-100 px-4 py-2 font-medium text-gray-800">{yearData.year} Yılı Ödemeleri</div>
          <div className="grid grid-cols-3 gap-2 p-4 sm:grid-cols-4 md:grid-cols-6">
            {yearData.months.map((monthData) => (
              <div
                key={monthData.name}
                className={`p-4 text-center border rounded-md ${monthData.amount ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}
              >
                {monthData.name}
                {monthData.amount && (
                  <div className="text-sm font-semibold mt-1">
                    ₺{monthData.amount.toFixed(2)}
                    <CheckCircle className="inline-block ml-1 text-green-500 w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default DuesHistory;
