import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Home, CreditCard, Receipt, Users, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Layout: React.FC = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Üst Menü */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo ve Başlık */}
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Çay Şeker Parası</h1>
            </div>
            {/* Masaüstü Menü */}
            <div className="hidden sm:flex space-x-6">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    isActive ? 'text-indigo-600' : 'text-gray-700 hover:text-indigo-600'
                  }`
                }
              >
                <Home className="w-5 h-5 mr-1" />
                Gösterge Paneli
              </NavLink>
              <NavLink
                to="/payments"
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    isActive ? 'text-indigo-600' : 'text-gray-700 hover:text-indigo-600'
                  }`
                }
              >
                <CreditCard className="w-5 h-5 mr-1" />
                Ödemeler
              </NavLink>
              {profile?.is_admin && (
                <NavLink
                  to="/expenses"
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                      isActive ? 'text-indigo-600' : 'text-gray-700 hover:text-indigo-600'
                    }`
                  }
                >
                  <Users className="w-5 h-5 mr-1" />
                  Harcamalar
                </NavLink>
              )}
              <NavLink
                to="/takip"
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    isActive ? 'text-indigo-600' : 'text-gray-700 hover:text-indigo-600'
                  }`
                }
              >
                <Receipt className="w-5 h-5 mr-1" />
                Ödeme Takip
              </NavLink>
              {profile?.is_admin && (
                <NavLink
                  to="/members"
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                      isActive ? 'text-indigo-600' : 'text-gray-700 hover:text-indigo-600'
                    }`
                  }
                >
                  <Users className="w-5 h-5 mr-1" />
                  Üyeler
                </NavLink>
              )}
              <NavLink
                to="/changePassword"
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    isActive ? 'text-indigo-600' : 'text-gray-700 hover:text-indigo-600'
                  }`
                }
              >
                <Receipt className="w-5 h-5 mr-1" />
                Şifre Yenile
              </NavLink>
            </div>
            {/* Kullanıcı Bilgisi ve Çıkış Butonu (Masaüstü) */}
            <div className="hidden sm:flex items-center space-x-4">
              <span className="text-gray-700">{profile?.full_name}</span>
              <button
                onClick={handleSignOut}
                className="flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Çıkış Yap
              </button>
            </div>
            {/* Mobil Menü Butonu */}
            <div className="sm:hidden">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-2 rounded-md text-gray-700 hover:text-indigo-600 focus:outline-none transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobil Menü (Yan Çekmece) */}
      {mobileMenuOpen && (
        <>
          {/* Arka Plan Kapatma Alanı */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setMobileMenuOpen(false)}
          ></div>
          {/* Yan Menünün Kendisi */}
          <div className="fixed top-0 left-0 w-64 h-full bg-white z-50 shadow-lg transform transition-transform duration-300">
            <div className="flex items-center justify-between px-4 py-4 border-b">
              <h2 className="text-lg font-bold text-gray-900">Menü</h2>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-md text-gray-700 hover:text-indigo-600 focus:outline-none"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <nav className="px-4 py-6 space-y-4">
              <NavLink
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Home className="w-5 h-5 mr-2" />
                Gösterge Paneli
              </NavLink>
              <NavLink
                to="/payments"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <CreditCard className="w-5 h-5 mr-2" />
                Ödemeler
              </NavLink>
              {profile?.is_admin && (
                <NavLink
                  to="/expenses"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <Users className="w-5 h-5 mr-2" />
                  Harcamalar
                </NavLink>
              )}
              <NavLink
                to="/takip"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Receipt className="w-5 h-5 mr-2" />
                Ödeme Takip
              </NavLink>
              {profile?.is_admin && (
                <NavLink
                  to="/members"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <Users className="w-5 h-5 mr-2" />
                  Üyeler
                </NavLink>
              )}
              <NavLink
                to="/changePassword"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Receipt className="w-5 h-5 mr-2" />
                Şifre Yenile
              </NavLink>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <LogOut className="w-5 h-5 mr-2" />
                Çıkış Yap
              </button>
            </nav>
          </div>
        </>
      )}

      {/* Ana İçerik */}
      <main className="pt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
