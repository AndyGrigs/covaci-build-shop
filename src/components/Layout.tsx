import { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';

// kept for backward compat; router.tsx uses MainLayout with Outlet directly
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
}
