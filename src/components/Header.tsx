import { useAuth } from '../contexts/AuthContext';
import { Building2, ShoppingCart, User, LogOut, Wrench, Package, Settings } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface HeaderProps {
  onNavigate: (page: string) => void;
  currentPage: string;
}

export default function Header({ onNavigate, currentPage }: HeaderProps) {
  const { user, profile, isAdmin, signOut } = useAuth();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    if (user) {
      loadCartCount();
    } else {
      setCartCount(0);
    }
  }, [user]);

  const loadCartCount = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('cart_items')
      .select('quantity')
      .eq('user_id', user.id);

    if (data) {
      const total = data.reduce((sum, item) => sum + item.quantity, 0);
      setCartCount(total);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    onNavigate('home');
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center space-x-2 hover:opacity-80 transition"
          >
            <Building2 className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">СтройМаркет</span>
          </button>

          <nav className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => onNavigate('home')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                currentPage === 'home'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Главная
            </button>
            <button
              onClick={() => onNavigate('products')}
              className={`px-4 py-2 rounded-lg font-medium transition flex items-center space-x-1 ${
                currentPage === 'products'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Материалы</span>
            </button>
            <button
              onClick={() => onNavigate('equipment')}
              className={`px-4 py-2 rounded-lg font-medium transition flex items-center space-x-1 ${
                currentPage === 'equipment'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Wrench className="w-4 h-4" />
              <span>Оборудование</span>
            </button>
          </nav>

          <div className="flex items-center space-x-2">
            {user ? (
              <>
                <button
                  onClick={() => onNavigate('cart')}
                  className="relative p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                >
                  <ShoppingCart className="w-6 h-6" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </button>
                {isAdmin && (
                  <button
                    onClick={() => onNavigate('admin')}
                    className={`p-2 rounded-lg transition flex items-center space-x-2 ${
                      currentPage === 'admin'
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    title="Панель администратора"
                  >
                    <Settings className="w-6 h-6" />
                    <span className="hidden md:inline font-medium">Админ</span>
                  </button>
                )}
                <button
                  onClick={() => onNavigate('cabinet')}
                  className={`p-2 rounded-lg transition flex items-center space-x-2 ${
                    currentPage === 'cabinet'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <User className="w-6 h-6" />
                  <span className="hidden md:inline font-medium">{profile?.full_name}</span>
                </button>
                <button
                  onClick={handleSignOut}
                  className="p-2 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition"
                  title="Выйти"
                >
                  <LogOut className="w-6 h-6" />
                </button>
              </>
            ) : (
              <button
                onClick={() => onNavigate('login')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
              >
                Войти
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
