import { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  children: ReactNode;
  onNavigate: (page: string) => void;
  currentPage: string;
}

export default function Layout({ children, onNavigate, currentPage }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header onNavigate={onNavigate} currentPage={currentPage} />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
}
