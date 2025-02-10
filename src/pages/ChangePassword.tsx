import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';

const ChangePassword = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!newPassword) {
      toast.error('Lütfen yeni şifrenizi girin.');
      setLoading(false);
      return;
    }

    // Supabase ile şifre değiştirme
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      toast.error(`Şifre değiştirme başarısız: ${error.message}`);
    } else {
      toast.success('Şifre başarıyla değiştirildi!');
      navigate('/');
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <form onSubmit={handleChangePassword} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <h2 className="text-2xl font-bold mb-4">Şifre Değiştir</h2>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Yeni Şifre
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
            required
          />
        </div>

        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          disabled={loading}
        >
          {loading ? 'Şifre Değiştiriliyor...' : 'Şifreyi Güncelle'}
        </button>
      </form>
    </div>
  );
};

export default ChangePassword;
