import { useEffect } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import type { RouteRecord } from 'vite-react-ssg';
import { Head } from 'vite-react-ssg';
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
import AdminDashboard from './pages/AdminDashboard';
import { supabase } from './lib/supabase';
import { productLoader } from './lib/productLoader';
import { catalogLoader } from './lib/catalogLoader';

function Providers() {
  return (
    <AuthProvider>
      <Head>
        <title>DenAlex — строительные материалы и аренда оборудования</title>
      </Head>
      <Outlet />
    </AuthProvider>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <ScrollToTop />
      <Header />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
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

export const routes: RouteRecord[] = [
  {
    element: <Providers />,
    children: [
      {
        element: <MainLayout />,
        children: [
          { path: '/', element: <Home /> },
          { path: '/catalog', element: <Products />, loader: catalogLoader },
          {
            path: '/catalog/:slug',
            element: <Products />,
            loader: catalogLoader,
            async getStaticPaths() {
              const slugs = await getCategorySlugs('product');
              return slugs.map(s => `/catalog/${s}`);
            },
          },
          {
            path: '/tovar/:slug',
            element: <ProductDetail />,
            loader: productLoader,
            async getStaticPaths() {
              const slugs = await getProductSlugs();
              return slugs.map(s => `/tovar/${s}`);
            },
          },
          { path: '/arenda-tehniki', element: <Equipment /> },
          {
            path: '/arenda-tehniki/:slug',
            element: <Equipment />,
            async getStaticPaths() {
              const slugs = await getCategorySlugs('equipment');
              return slugs.map(s => `/arenda-tehniki/${s}`);
            },
          },
          { path: '/korzina', element: <Cart /> },
          { path: '/kabinet', element: <Cabinet /> },
          { path: '/kontakt', element: <Contact /> },
        ],
      },
      { path: '/vkhod', element: <Login /> },
      { path: '/registraciya', element: <Register /> },
      { path: '/admin', element: <AdminDashboard /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
];
