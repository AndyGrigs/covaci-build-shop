import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/novyy-parol`,
    });

    setLoading(false);

    if (error) console.error(error);
    setSent(true);
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">{t('forgot.sentTitle')}</h2>
          <p className="text-gray-600 mb-6">
            {t('forgot.sentDesc', { email })}
          </p>
          <Link to="/vkhod" className="text-brand-dark font-medium hover:text-brand transition">
            {t('forgot.backToLogin')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-6"
      >
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">{t('forgot.title')}</h2>
          <p className="text-gray-600 mt-2">{t('forgot.subtitle')}</p>
        </div>

        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent transition"
            placeholder={t('forgot.emailPlaceholder')}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand text-gray-900 py-3 rounded-lg font-medium hover:bg-brand-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? t('forgot.sending') : t('forgot.submit')}
        </button>

        <div className="text-center">
          <Link to="/vkhod" className="text-sm text-gray-500 hover:text-gray-700 transition">
            {t('forgot.backToLogin')}
          </Link>
        </div>
      </form>
    </div>
  );
}
