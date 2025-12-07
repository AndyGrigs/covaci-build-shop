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

type Page = 'home' | 'login' | 'register' | 'products' | 'equipment' | 'cart' | 'cabinet' | 'admin';

function AppContent() {
  const { loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('home');

  const handleNavigate = (page: string) => {
    setCurrentPage(page as Page);
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
      <Login
        onSwitchToRegister={() => setCurrentPage('register')}
        onLoginSuccess={() => setCurrentPage('home')}
        onNavigate={handleNavigate}
      />
    );
  }

  if (currentPage === 'register') {
    return (
      <Register
        onSwitchToLogin={() => setCurrentPage('login')}
        onRegisterSuccess={() => setCurrentPage('home')}
        onNavigate={handleNavigate}
      />
    );
  }

  if (currentPage === 'admin') {
    return <AdminDashboard onNavigate={handleNavigate} />;
  }

  return (
    <Layout onNavigate={handleNavigate} currentPage={currentPage}>
      {currentPage === 'home' && <Home onNavigate={handleNavigate} />}
      {currentPage === 'products' && <Products onNavigate={handleNavigate} />}
      {currentPage === 'equipment' && <Equipment onNavigate={handleNavigate} />}
      {currentPage === 'cart' && <Cart onNavigate={handleNavigate} />}
      {currentPage === 'cabinet' && <Cabinet onNavigate={handleNavigate} />}
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
