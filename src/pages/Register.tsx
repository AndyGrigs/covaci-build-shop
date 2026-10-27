import { useState, FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { BRAND_NAME } from "../lib/brand";
import { UserPlus, Mail, Lock, User, CheckCircle } from "lucide-react";
import { useAppNav } from "../hooks/useAppNav";
import { useTranslation } from "react-i18next";

export default function Register() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const locale = searchParams.get('lang') === 'ro' ? 'ro' : 'ru';
  const nav = useAppNav();
  const onSwitchToLogin = () => nav('login');
  const onNavigate = nav;
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError(t('register.passwordMismatch'));
      return;
    }

    if (password.length < 6) {
      setError(t('register.passwordTooShort'));
      return;
    }

    setLoading(true);

    const { error: signUpError } = await signUp(email, password, fullName, locale);

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
    } else {
      setEmailSent(true);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4 py-8">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('register.emailSentTitle')}</h2>
          <p className="text-gray-600 mb-2">
            {t('register.emailSentDesc')} <span className="font-medium text-gray-900">{email}</span>
          </p>
          <p className="text-gray-500 text-sm mb-6">
            {t('register.emailSentHint')}
          </p>
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="w-full bg-brand text-gray-900 py-3 rounded-lg font-medium hover:bg-brand-dark transition"
          >
            {t('register.goToLogin')}
          </button>
          <button
            type="button"
            onClick={() => onNavigate("home")}
            className="mt-3 w-full text-gray-500 text-sm hover:text-gray-700 transition"
          >
            {t('register.backHome')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand rounded-full mb-4">
            <UserPlus className="w-8 h-8 text-gray-900" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">{t('register.title')}</h2>
          <p className="text-gray-600 mt-2">
            {t('register.subtitle', { brand: BRAND_NAME })}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('register.fullName')}
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent transition"
                placeholder={t('register.fullNamePlaceholder')}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('register.email')}
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
              {t('register.password')}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent transition"
                placeholder={t('register.passwordPlaceholder')}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('register.confirmPassword')}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent transition"
                placeholder={t('register.confirmPasswordPlaceholder')}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand text-gray-900 py-3 rounded-lg font-medium hover:bg-brand-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t('register.loading') : t('register.submit')}
          </button>

          <div className="text-center space-y-2">
            <div>
              <span className="text-gray-600">{t('register.haveAccount')} </span>
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-brand-dark font-medium hover:text-brand transition"
              >
                {t('register.login')}
              </button>
            </div>
            <div>
              <button
                type="button"
                onClick={() => onNavigate("home")}
                className="text-gray-500 font-medium hover:text-gray-700 transition text-sm"
              >
                {t('register.backHome')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
