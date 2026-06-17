import { useAuth } from "../contexts/AuthContext";
import {
  Building2,
  ShoppingCart,
  User,
  LogOut,
  Wrench,
  Package,
  Settings,
  MapPin,
  Clock,
  Phone,
  Heart,
  ChevronDown,
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

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
      .from("cart_items")
      .select("quantity")
      .eq("user_id", user.id);

    if (data) {
      const total = data.reduce((sum, item) => sum + item.quantity, 0);
      setCartCount(total);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    onNavigate("home");
  };

  return (
    <header className="sticky top-0 z-50">
       {/* Top bar — темная полоса с контактами */}
      <div className="bg-gray-900 text-gray-300 text-sm py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <span className="flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-brand" />
              <span>с. Самурза Taraclia 7419</span>
            </span>
            <span className="flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-brand" />
              <span>Пн-Пт: 8:00 - 18:00</span>
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1">
              <Phone className="w-3.5 h-3.5 text-brand" />
              <span>+37 37 8719072</span>
            </span>
            <span className="text-gray-500">|</span>
            <span className="text-gray-300 cursor-pointer hover:text-white transition">MD</span>
          </div>
        </div>
      </div>


       {/* Main header — белый */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Логотип */}
            <button
              onClick={() => onNavigate("home")}
              className="flex items-center space-x-2 hover:opacity-80 transition"
            >
              <div className="w-8 h-8 rounded flex items-center justify-center">
                <span className=" font-bold text-sm">
                  <Building2 className="w-8 h-8 text-brand" />
                </span>
              </div>
              <span className="text-xl  font-bold text-gray-900">DenAlex</span>
            </button>

            {/* Навигация */}
            <nav className="hidden md:flex items-center space-x-1">
              <button
                onClick={() => onNavigate("home")}
                className={`px-4 py-2 font-medium transition relative ${
                  currentPage === "home"
                    ? "text-brand-dark"
                    : "text-gray-700 hover:text-brand-dark"
                }`}
              >
                Главная
                {currentPage === "home" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand" />
                )}
              </button>

              <button
                onClick={() => onNavigate("products")}
                className={`px-4 py-2 font-medium transition flex items-center space-x-1 ${
                  currentPage === "products"
                    ? "text-brand-dark"
                    : "text-gray-700 hover:text-brand-dark"
                }`}
              >
                <span>Каталог</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              <button
                onClick={() => onNavigate("equipment")}
                className={`px-4 py-2 font-medium transition ${
                  currentPage === "equipment"
                    ? "text-brand-dark"
                    : "text-gray-700 hover:text-brand-dark"
                }`}
              >
                Аренда техники
              </button>

              <button className="px-4 py-2 font-medium text-gray-700 hover:text-brand-dark transition">
                Услуги
              </button>

              <button className="px-4 py-2 font-medium text-gray-700 hover:text-brand-dark transition">
                О нас
              </button>

              <button className="px-4 py-2 font-medium text-gray-700 hover:text-brand-dark transition">
                Контакты
              </button>
            </nav>

            {/* Правая часть */}
            <div className="flex items-center space-x-3">
              {/* Избранное */}
              <button className="p-2 text-gray-600 hover:text-brand-dark transition">
                <Heart className="w-5 h-5" />
              </button>

              {/* Корзина */}
              <button
                onClick={() => user ? onNavigate("cart") : onNavigate("login")}
                className="relative p-2 text-gray-600 hover:text-brand-dark transition"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-brand text-gray-900 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>

              {user ? (
                <>
                  {isAdmin && (
                    <button
                      onClick={() => onNavigate("admin")}
                      className="p-2 text-gray-600 hover:text-brand-dark transition"
                      title="Админ панель"
                    >
                      <Settings className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => onNavigate("cabinet")}
                    className="p-2 text-gray-600 hover:text-brand-dark transition"
                    title={profile?.full_name || "Кабинет"}
                  >
                    <User className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="p-2 text-gray-600 hover:text-red-500 transition"
                    title="Выйти"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => onNavigate("login")}
                  className="px-5 py-2 bg-brand text-gray-900 rounded font-semibold hover:bg-brand-dark transition"
                >
                  Войти
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button
            onClick={() => onNavigate("home")}
            className="flex items-center space-x-2 hover:opacity-80 transition"
          >
            <Building2 className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">КовачМаркет</span>
          </button>

          <nav className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => onNavigate("home")}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                currentPage === "home"
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              Главная
            </button>
            <button
              onClick={() => onNavigate("products")}
              className={`px-4 py-2 rounded-lg font-medium transition flex items-center space-x-1 ${
                currentPage === "products"
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Материалы</span>
            </button>
            <button
              onClick={() => onNavigate("equipment")}
              className={`px-4 py-2 rounded-lg font-medium transition flex items-center space-x-1 ${
                currentPage === "equipment"
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-700 hover:bg-gray-100"
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
                  onClick={() => onNavigate("cart")}
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
                    onClick={() => onNavigate("admin")}
                    className={`p-2 rounded-lg transition flex items-center space-x-2 ${
                      currentPage === "admin"
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    title="Панель администратора"
                  >
                    <Settings className="w-6 h-6" />
                    <span className="hidden md:inline font-medium">Админ</span>
                  </button>
                )}
                <button
                  onClick={() => onNavigate("cabinet")}
                  className={`p-2 rounded-lg transition flex items-center space-x-2 ${
                    currentPage === "cabinet"
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <User className="w-6 h-6" />
                  <span className="hidden md:inline font-medium">
                    {profile?.full_name}
                  </span>
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
                onClick={() => onNavigate("login")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
              >
                Войти
              </button>
            )}
          </div>
        </div>
      </div> */}
    </header>
  );
}
