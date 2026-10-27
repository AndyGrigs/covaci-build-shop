import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import type { RouteRecord } from 'vite-react-ssg';
import { Head } from 'vite-react-ssg';
import { I18nextProvider } from 'react-i18next';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Equipment from './pages/Equipment';
import Cart from './pages/Cart';
import Cabinet from './pages/Cabinet';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AdminDashboard from './pages/AdminDashboard';
import NotFound from './pages/NotFound';
import { supabase } from './lib/supabase';
import { productLoader } from './lib/productLoader';
import { catalogLoader } from './lib/catalogLoader';
import { equipmentLoader } from './lib/equipmentLoader';
import { homeLoader } from './lib/homeLoader';
import { BRAND_NAME } from './lib/brand';
import { Toaster } from 'sonner';
import i18nRu, { i18nRo } from './i18n';
import type { i18n as I18nType } from 'i18next';

function Providers() {
  return (
    <AuthProvider>
      <Head>
        <title>{BRAND_NAME}</title>
      </Head>
      <Outlet />
    </AuthProvider>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function LangLayout({ i18n }: { i18n: I18nType }) {
  return (
    <I18nextProvider i18n={i18n}>
      <div className="min-h-screen flex flex-col bg-slate-50">
        <ScrollToTop />
        <Header />
        <main className="flex-grow">
          <Outlet />
        </main>
        <Footer />
        <Toaster position="top-right" richColors />
      </div>
    </I18nextProvider>
  );
}

async function getCategorySlugs(type: 'product' | 'equipment') {
  const { data, error } = await supabase.from('categories').select('slug').eq('type', type);
  if (error) throw new Error(`getCategorySlugs(${type}): ${error.message}`);
  return data.map(c => c.slug).filter(Boolean);
}

async function getProductSlugs() {
  const { data, error } = await supabase.from('products').select('slug').eq('is_active', true);
  if (error) throw new Error(`getProductSlugs: ${error.message}`);
  return data.map(p => p.slug).filter(Boolean);
}

/** Build the content route list for a given URL prefix ('', '/ro'). */
function makeContentRoutes(prefix: string): RouteRecord[] {
  const p = prefix; // '' or '/ro'

  return [
    { index: true, element: <Home />, loader: homeLoader },
    { path: 'catalog', element: <Products />, loader: catalogLoader },
    {
      path: 'catalog/:slug',
      element: <Products />,
      loader: catalogLoader,
      async getStaticPaths() {
        const slugs = await getCategorySlugs('product');
        return slugs.map(s => `${p}/catalog/${s}`);
      },
    },
    {
      path: 'tovar/:slug',
      element: <ProductDetail />,
      loader: productLoader,
      async getStaticPaths() {
        const slugs = await getProductSlugs();
        return slugs.map(s => `${p}/tovar/${s}`);
      },
    },
    { path: 'arenda-tehniki', element: <Equipment />, loader: equipmentLoader },
    {
      path: 'arenda-tehniki/:slug',
      element: <Equipment />,
      loader: equipmentLoader,
      async getStaticPaths() {
        const slugs = await getCategorySlugs('equipment');
        return slugs.map(s => `${p}/arenda-tehniki/${s}`);
      },
    },
    { path: 'korzina', element: <Cart /> },
    { path: 'kabinet', element: <Cabinet /> },
    { path: 'kontakt', element: <Contact /> },
    { path: '*', element: <NotFound /> },
  ];
}

export const routes: RouteRecord[] = [
  {
    element: <Providers />,
    children: [
      // ── Russian routes (no prefix) ──
      {
        path: '/',
        element: <LangLayout i18n={i18nRu} />,
        children: makeContentRoutes(''),
      },
      // ── Romanian routes (/ro prefix) ──
      {
        path: '/ro',
        element: <LangLayout i18n={i18nRo} />,
        children: makeContentRoutes('/ro'),
      },
      // ── Auth / admin (language-agnostic, default Russian i18n) ──
      {
        element: <I18nextProvider i18n={i18nRu}><Outlet /></I18nextProvider>,
        children: [
          { path: '/vkhod', element: <Login /> },
          { path: '/registraciya', element: <Register /> },
          { path: '/vosstanovlenie-parolya', element: <ForgotPassword /> },
          { path: '/novyy-parol', element: <ResetPassword /> },
          { path: '/admin', element: <AdminDashboard /> },
        ],
      },
    ],
  },
];
