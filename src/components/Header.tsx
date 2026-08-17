import { useAuth } from "../contexts/AuthContext";
import {
  Building2,
  ShoppingCart,
  User,
  LogOut,
  Settings,
  MapPin,
  Clock,
  Phone,
  Heart,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";

const navLinks = [
  { label: "Главная", path: "/" },
  { label: "Каталог", path: "/catalog", icon: <ChevronDown className="w-4 h-4" /> },
  { label: "Аренда техники", path: "/arenda-tehniki" },
  { label: "Услуги", path: "" },
  { label: "О нас", path: "" },
  { label: "Контакты", path: "/kontakt" },
];

export default function Header() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [cartCount, setCartCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      setCartCount(0);
      return;
    }

    const loadCartCount = async () => {
      const { data } = await supabase
        .from("cart_items")
        .select("quantity")
        .eq("user_id", user.id);
      if (data) {
        setCartCount(data.reduce((sum, item) => sum + item.quantity, 0));
      }
    };

    loadCartCount();

    const channel = supabase
      .channel("header-cart-count")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cart_items", filter: `user_id=eq.${user.id}` },
        loadCartCount
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setMenuOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Close menu on route change
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const go = (path: string) => {
    if (path) navigate(path);
  };

  const isActive = (path: string) => {
    if (!path) return false;
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <header className="sticky top-0 z-50">
        {/* Top bar */}
        <div className="bg-gray-900 text-gray-300 text-sm py-2 hidden sm:block">
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
                <span>+373 78719072</span>
              </span>
              <span className="text-gray-500">|</span>
              <span className="text-gray-300 cursor-pointer hover:text-white transition">MD</span>
            </div>
          </div>
        </div>

        {/* Main header */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">

              {/* Logo */}
              <button
                onClick={() => navigate("/")}
                className="flex items-center space-x-2 hover:opacity-80 transition"
              >
                <Building2 className="w-8 h-8 text-brand" />
                <span className="text-xl font-bold text-gray-900">DenAlex</span>
              </button>

              {/* Desktop nav */}
              <nav className="hidden md:flex items-center space-x-1">
                {navLinks.map(({ label, path, icon }) => (
                  <button
                    key={label}
                    onClick={() => go(path)}
                    className={`px-4 py-2 font-medium transition relative flex items-center space-x-1 ${
                      isActive(path)
                        ? "text-brand-dark"
                        : "text-gray-700 hover:text-brand-dark"
                    }`}
                  >
                    <span>{label}</span>
                    {icon}
                    {isActive(path) && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand" />
                    )}
                  </button>
                ))}
              </nav>

              {/* Right actions */}
              <div className="flex items-center space-x-1">
                {/* Favourites — desktop only */}
                <button className="hidden md:block p-2 text-gray-600 hover:text-brand-dark transition hover:scale-110 active:scale-95">
                  <Heart className="w-5 h-5" />
                </button>

                {/* Cart */}
                <button
                  onClick={() => navigate(user ? "/korzina" : "/vkhod")}
                  className="relative p-2 text-gray-600 hover:text-brand-dark transition hover:scale-110 active:scale-95"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-brand text-gray-900 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </button>

                {/* Desktop user actions */}
                {user ? (
                  <div className="hidden md:flex items-center space-x-1">
                    {isAdmin && (
                      <button
                        onClick={() => navigate("/admin")}
                        className="p-2 text-gray-600 hover:text-brand-dark transition hover:scale-110 active:scale-95"
                        title="Админ панель"
                      >
                        <Settings className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => navigate("/kabinet")}
                      className="p-2 text-gray-600 hover:text-brand-dark transition hover:scale-110 active:scale-95"
                      title={profile?.full_name || "Кабинет"}
                    >
                      <User className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="p-2 text-gray-600 hover:text-red-500 transition hover:scale-110 active:scale-95"
                      title="Выйти"
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => navigate("/vkhod")}
                    className="hidden md:block px-5 py-2 bg-brand text-gray-900 rounded font-semibold hover:bg-brand-dark transition hover:scale-105 active:scale-95"
                  >
                    Войти
                  </button>
                )}

                {/* Burger button */}
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  className="md:hidden p-2 text-gray-600 hover:text-brand-dark transition active:scale-95"
                  aria-label="Меню"
                >
                  {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile menu panel */}
        <div
          className={`md:hidden bg-white border-b border-gray-200 shadow-lg overflow-hidden transition-all duration-300 ease-in-out ${
            menuOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <nav className="px-4 pt-2 pb-4 space-y-1">
            {navLinks.map(({ label, path }) => (
              <button
                key={label}
                onClick={() => go(path)}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition ${
                  isActive(path)
                    ? "bg-brand/10 text-brand-dark"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>

          <div className="border-t border-gray-100 px-4 py-4">
            {user ? (
              <div className="space-y-1">
                {profile?.full_name && (
                  <p className="px-4 py-2 text-sm text-gray-500 font-medium">{profile.full_name}</p>
                )}
                <button
                  onClick={() => navigate("/kabinet")}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition"
                >
                  <User className="w-5 h-5" />
                  <span className="font-medium">Личный кабинет</span>
                </button>
                {isAdmin && (
                  <button
                    onClick={() => navigate("/admin")}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition"
                  >
                    <Settings className="w-5 h-5" />
                    <span className="font-medium">Админ панель</span>
                  </button>
                )}
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Выйти</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate("/vkhod")}
                className="w-full py-3 bg-brand text-gray-900 rounded-lg font-semibold hover:bg-brand-dark transition active:scale-95"
              >
                Войти
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Backdrop */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </>
  );
}
