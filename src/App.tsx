import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Products from './pages/Products';
import Equipment from './pages/Equipment';
import Cart from './pages/Cart';
import Cabinet from './pages/Cabinet';
import AdminDashboard from './pages/AdminDashboard';
import ProductDetail from './pages/ProductDetail';
import PageTransition from './components/PageTransition';

type Page = 'home' | 'login' | 'register' | 'products' | 'product-detail' | 'equipment' | 'cart' | 'cabinet' | 'admin';

function AppContent() {
  const { loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const handleNavigate = (page: string) => {
    if (page.startsWith('product-detail:')) {
      setSelectedProductId(page.split(':')[1]);
      setCurrentPage('product-detail');
    } else {
      setCurrentPage(page as Page);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (currentPage === 'login') {
    return (
      <PageTransition pageKey={currentPage}>
        <Login
          onSwitchToRegister={() => setCurrentPage('register')}
          onLoginSuccess={() => setCurrentPage('home')}
          onNavigate={handleNavigate}
        />
      </PageTransition>
    );
  }

  if (currentPage === 'register') {
    return (
      <PageTransition pageKey={currentPage}>
        <Register
          onSwitchToLogin={() => setCurrentPage('login')}
          onRegisterSuccess={() => setCurrentPage('home')}
          onNavigate={handleNavigate}
        />
      </PageTransition>
    );
  }

  if (currentPage === 'admin') {
    return (
      <PageTransition pageKey={currentPage}>
        <AdminDashboard onNavigate={handleNavigate} />
      </PageTransition>
    );
  }

  return (
    <Layout onNavigate={handleNavigate} currentPage={currentPage}>
      <PageTransition pageKey={currentPage}>
        {currentPage === 'home' && <Home onNavigate={handleNavigate} />}
        {currentPage === 'products' && <Products onNavigate={handleNavigate} />}
        {currentPage === 'product-detail' && selectedProductId && (
          <ProductDetail productId={selectedProductId} onNavigate={handleNavigate} />
        )}
        {currentPage === 'equipment' && <Equipment onNavigate={handleNavigate} />}
        {currentPage === 'cart' && <Cart onNavigate={handleNavigate} />}
        {currentPage === 'cabinet' && <Cabinet onNavigate={handleNavigate} />}
      </PageTransition>
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
