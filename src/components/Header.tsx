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
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { BRAND_NAME, BRAND_PHONE } from "../lib/brand";
import { useTranslation } from "react-i18next";
import { useLang, toRoPath, toRuPath } from "../hooks/useLang";

export default function Header() {
  const { t } = useTranslation();
  const lang = useLang();
  const { user, profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [cartCount, setCartCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { label: t('nav.home'), path: lang === 'ro' ? '/ro' : '/' },
    { label: t('nav.catalog'), path: lang === 'ro' ? '/ro/catalog' : '/catalog', icon: <ChevronDown className="w-4 h-4" /> },
    { label: t('nav.equipment'), path: lang === 'ro' ? '/ro/arenda-tehniki' : '/arenda-tehniki' },
    { label: t('nav.services'), path: '' },
    { label: t('nav.about'), path: '' },
    { label: t('nav.contacts'), path: lang === 'ro' ? '/ro/kontakt' : '/kontakt' },
  ];

  const switchLang = (target: 'ru' | 'ro') => {
    if (target === lang) return;
    const currentPath = location.pathname;
    const newPath = target === 'ro' ? toRoPath(currentPath) : toRuPath(currentPath);
    navigate(newPath);
  };

  useEffect(() => {
    if (!user) { setCartCount(0); return; }

    const loadCartCount = async () => {
      const { data } = await supabase
        .from("cart_items").select("quantity").eq("user_id", user.id);
      if (data) setCartCount(data.reduce((s, i) => s + i.quantity, 0));
    };

    loadCartCount();

    const channel = supabase
      .channel(`header-cart-${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "cart_items", filter: `user_id=eq.${user.id}` }, loadCartCount)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "cart_items", filter: `user_id=eq.${user.id}` }, loadCartCount)
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "cart_items", filter: `user_id=eq.${user.id}` }, loadCartCount)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setMenuOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const handleSignOut = async () => { await signOut(); navigate("/"); };

  const isActive = (path: string) => {
    if (!path) return false;
    if (path === '/' || path === '/ro') return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const cartTarget = user ? (lang === 'ro' ? '/ro/korzina' : '/korzina') : '/vkhod';
  const cabinetTarget = lang === 'ro' ? '/ro/kabinet' : '/kabinet';

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
                <span>{t('header.hours')}</span>
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="flex items-center space-x-1">
                <Phone className="w-3.5 h-3.5 text-brand" />
                <span>{BRAND_PHONE}</span>
              </span>
              <span className="text-gray-500">|</span>
              {/* Language switcher — navigates to the /ro or / variant of the current page */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => switchLang('ru')}
                  className={`text-xs font-semibold px-1.5 py-0.5 rounded transition ${
                    lang === 'ru' ? 'text-white bg-gray-700' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  RU
                </button>
                <span className="text-gray-600">|</span>
                <button
                  onClick={() => switchLang('ro')}
                  className={`text-xs font-semibold px-1.5 py-0.5 rounded transition ${
                    lang === 'ro' ? 'text-white bg-gray-700' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  RO
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main header */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">

              <Link to={lang === 'ro' ? '/ro' : '/'} className="flex items-center space-x-2 hover:opacity-80 transition">
                <Building2 className="w-8 h-8 text-brand" />
                <span className="text-xl font-bold text-gray-900">{BRAND_NAME}</span>
              </Link>

              <nav className="hidden md:flex items-center space-x-1">
                {navLinks.map(({ label, path, icon }) => {
                  const classes = `px-4 py-2 font-medium transition relative flex items-center space-x-1 ${
                    isActive(path) ? "text-brand-dark" : "text-gray-700 hover:text-brand-dark"
                  }`;
                  const content = (
                    <>
                      <span>{label}</span>
                      {icon}
                      {isActive(path) && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand" />
                      )}
                    </>
                  );
                  return path ? (
                    <Link key={label} to={path} className={classes} aria-current={isActive(path) ? "page" : undefined}>
                      {content}
                    </Link>
                  ) : (
                    <span key={label} className={`${classes} cursor-default`}>{content}</span>
                  );
                })}
              </nav>

              <div className="flex items-center space-x-1">
                <button className="hidden md:block p-2 text-gray-600 hover:text-brand-dark transition hover:scale-110 active:scale-95">
                  <Heart className="w-5 h-5" />
                </button>

                <button
                  onClick={() => navigate(cartTarget)}
                  className="relative p-2 text-gray-600 hover:text-brand-dark transition hover:scale-110 active:scale-95"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-brand text-gray-900 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </button>

                {user ? (
                  <div className="hidden md:flex items-center space-x-1">
                    {isAdmin && (
                      <button
                        onClick={() => navigate("/admin")}
                        className="p-2 text-gray-600 hover:text-brand-dark transition hover:scale-110 active:scale-95"
                        title={t('header.adminPanel')}
                      >
                        <Settings className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => navigate(cabinetTarget)}
                      className="p-2 text-gray-600 hover:text-brand-dark transition hover:scale-110 active:scale-95"
                      title={profile?.full_name || t('header.cabinet')}
                    >
                      <User className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="p-2 text-gray-600 hover:text-red-500 transition hover:scale-110 active:scale-95"
                      title={t('header.logout')}
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => navigate(lang === 'ro' ? '/vkhod?lang=ro' : '/vkhod')}
                    className="hidden md:block px-5 py-2 bg-brand text-gray-900 rounded font-semibold hover:bg-brand-dark transition hover:scale-105 active:scale-95"
                  >
                    {t('header.login')}
                  </button>
                )}

                <button
                  onClick={() => setMenuOpen(o => !o)}
                  className="md:hidden p-2 text-gray-600 hover:text-brand-dark transition active:scale-95"
                  aria-label={t('header.menu')}
                >
                  {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`md:hidden bg-white border-b border-gray-200 shadow-lg overflow-hidden transition-all duration-300 ease-in-out ${
          menuOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
        }`}>
          <nav className="px-4 pt-2 pb-4 space-y-1">
            {navLinks.map(({ label, path }) => {
              const classes = `block w-full text-left px-4 py-3 rounded-lg font-medium transition ${
                isActive(path) ? "bg-brand/10 text-brand-dark" : "text-gray-700 hover:bg-gray-100"
              }`;
              return path ? (
                <Link key={label} to={path} className={classes} aria-current={isActive(path) ? "page" : undefined}>
                  {label}
                </Link>
              ) : (
                <span key={label} className={`${classes} cursor-default`}>{label}</span>
              );
            })}

            {/* Mobile language switcher */}
            <div className="flex items-center space-x-2 px-4 py-3">
              <button
                onClick={() => switchLang('ru')}
                className={`text-sm font-semibold px-2 py-1 rounded transition ${
                  lang === 'ru' ? 'bg-gray-200 text-gray-900' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                RU
              </button>
              <button
                onClick={() => switchLang('ro')}
                className={`text-sm font-semibold px-2 py-1 rounded transition ${
                  lang === 'ro' ? 'bg-gray-200 text-gray-900' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                RO
              </button>
            </div>
          </nav>

          <div className="border-t border-gray-100 px-4 py-4">
            {user ? (
              <div className="space-y-1">
                {profile?.full_name && (
                  <p className="px-4 py-2 text-sm text-gray-500 font-medium">{profile.full_name}</p>
                )}
                <button
                  onClick={() => navigate(cabinetTarget)}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition"
                >
                  <User className="w-5 h-5" />
                  <span className="font-medium">{t('header.personalCabinet')}</span>
                </button>
                {isAdmin && (
                  <button
                    onClick={() => navigate("/admin")}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition"
                  >
                    <Settings className="w-5 h-5" />
                    <span className="font-medium">{t('header.adminPanelFull')}</span>
                  </button>
                )}
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">{t('header.logout')}</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate(lang === 'ro' ? '/vkhod?lang=ro' : '/vkhod')}
                className="w-full py-3 bg-brand text-gray-900 rounded-lg font-semibold hover:bg-brand-dark transition active:scale-95"
              >
                {t('header.login')}
              </button>
            )}
          </div>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-black/20 md:hidden" onClick={() => setMenuOpen(false)} />
      )}
    </>
  );
}
