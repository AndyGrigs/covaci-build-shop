import { Outlet, Navigate } from 'react-router-dom';
import type { RouteRecord } from 'vite-react-ssg';
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

function Providers() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}

function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

async function getCategorySlugs(type: 'product' | 'equipment') {
  try {
    const { data } = await supabase.from('categories').select('slug').eq('type', type);
    return data?.map(c => c.slug).filter(Boolean) ?? [];
  } catch {
    return [];
  }
}

async function getProductSlugs() {
  try {
    const { data } = await supabase.from('products').select('slug').eq('is_active', true);
    return data?.map(p => p.slug).filter(Boolean) ?? [];
  } catch {
    return [];
  }
}

export const routes: RouteRecord[] = [
  {
    element: <Providers />,
    children: [
      {
        element: <MainLayout />,
        children: [
          { path: '/', element: <Home /> },
          { path: '/catalog', element: <Products /> },
          {
            path: '/catalog/:slug',
            element: <Products />,
            async getStaticPaths() {
              const slugs = await getCategorySlugs('product');
              return slugs.map(s => `/catalog/${s}`);
            },
          },
          {
            path: '/tovar/:slug',
            element: <ProductDetail />,
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
