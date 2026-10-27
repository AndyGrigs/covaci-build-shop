import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, Mail, Lock } from 'lucide-react';
import { useAppNav } from '../hooks/useAppNav';
import { useTranslation } from 'react-i18next';

export default function Login() {
  const { t } = useTranslation();
  const nav = useAppNav();
  const onSwitchToRegister = () => nav('register');
  const onLoginSuccess = () => nav('home');
  const onNavigate = nav;
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: signInError } = await signIn(email, password);

      if (signInError) {
        setError(signInError.message);
      } else {
        onLoginSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('login.connectionError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand rounded-full mb-4">
            <LogIn className="w-8 h-8 text-gray-900" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">{t('login.welcome')}</h2>
          <p className="text-gray-600 mt-2">{t('login.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('login.email')}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent transition"
                placeholder="your@email.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('login.password')}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent transition"
                placeholder={t('login.passwordPlaceholder')}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand text-gray-900 py-3 rounded-lg font-medium hover:bg-brand-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t('login.loading') : t('login.submit')}
          </button>

          <div className="text-center space-y-2">
            <div>
              <span className="text-gray-600">{t('login.noAccount')} </span>
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="text-brand-dark font-medium hover:text-brand transition"
              >
                {t('login.register')}
              </button>
            </div>
            <div>
              <Link
                to="/vosstanovlenie-parolya"
                className="text-sm text-gray-600 hover:text-brand-dark transition"
              >
                {t('login.forgotPassword')}
              </Link>
            </div>
            <div>
              <button
                type="button"
                onClick={() => onNavigate('home')}
                className="text-gray-500 font-medium hover:text-gray-700 transition text-sm"
              >
                {t('login.backHome')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
