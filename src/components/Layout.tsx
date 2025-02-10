import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Home, CreditCard, Receipt, Users, LogOut, Menu } from 'lucide-react';
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
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900">Çay Şeker Parası</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <NavLink
                  to="/"
                  className={({ isActive }) =>
                    `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive
                        ? 'border-indigo-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`
                  }
                >
                  <Home className="w-4 h-4 mr-2" />
                  Gösterge Paneli
                </NavLink>
                <NavLink
                  to="/payments"
                  className={({ isActive }) =>
                    `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive
                        ? 'border-indigo-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`
                  }
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Ödemeler
                </NavLink>
                <NavLink
                  to="/expenses"
                  className={({ isActive }) =>
                    `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive
                        ? 'border-indigo-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`
                  }
                >
                  <Receipt className="w-4 h-4 mr-2" />
                  Harcamalar
                </NavLink>
                {profile?.is_admin && (
                  <NavLink
                    to="/members"
                    className={({ isActive }) =>
                      `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                        isActive
                          ? 'border-indigo-500 text-gray-900'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      }`
                    }
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Üyeler
                  </NavLink>
                )}
                     <NavLink
                  to="/changePassword"
                  className={({ isActive }) =>
                    `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive
                        ? 'border-indigo-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`
                  }
                >
                  <Receipt className="w-4 h-4 mr-2" />
                  Şifre Yenile
                </NavLink>
              </div>
            </div>
            {/* Mobile menu button */}
            <div className="flex items-center sm:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              >
                <span className="sr-only">Menüyü aç</span>
                <Menu className="w-6 h-6" />
              </button>
            </div>
            <div className="hidden sm:flex items-center">
              <span className="text-sm text-gray-700 mr-4">{profile?.full_name}</span>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 bg-white hover:text-gray-700 focus:outline-none transition"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Çıkış Yap
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-white shadow-md p-4">
          <NavLink
            to="/"
            className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100"
          >
            <Home className="w-5 h-5 mr-2" />
            Gösterge Paneli
          </NavLink>
          <NavLink
            to="/payments"
            className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100"
          >
            <CreditCard className="w-5 h-5 mr-2" />
            Ödemeler
          </NavLink>
          <NavLink
            to="/expenses"
            className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100"
          >
            <Receipt className="w-5 h-5 mr-2" />
            Harcamalar
          </NavLink>
          <NavLink
            to="/changePassword"
            className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100"
          >
            <Receipt className="w-5 h-5 mr-2" />
            Şifre Yenile
          </NavLink>
          {profile?.is_admin && (
            <NavLink
              to="/members"
              className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100"
            >
              <Users className="w-5 h-5 mr-2" />
              Üyeler
            </NavLink>
          )}
          <button
            onClick={handleSignOut}
            className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Çıkış Yap
          </button>
        </div>
      )}

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
