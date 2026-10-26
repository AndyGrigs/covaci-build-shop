import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Following the reset link creates a temporary session and fires PASSWORD_RECOVERY.
    // We also accept SIGNED_IN in case the client parsed the URL hash before this effect ran.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') setReady(true);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setReady(true);
      } else {
        setTimeout(() => setInvalid(true), 2000);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error('Пароль должен содержать не менее 6 символов');
      return;
    }
    if (password !== confirm) {
      toast.error('Пароли не совпадают');
      return;
    }

    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success('Пароль обновлён');
    navigate('/kabinet');
  };

  if (invalid && !ready) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4 text-center">
        <div>
          <h2 className="text-2xl font-bold mb-2">Ссылка недействительна</h2>
          <p className="text-gray-600">Возможно, срок действия истёк. Запросите новую.</p>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <p className="text-gray-500">Проверка ссылки...</p>
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
          <h2 className="text-3xl font-bold text-gray-900">Новый пароль</h2>
          <p className="text-gray-600 mt-2">Придумайте надёжный пароль для вашего аккаунта.</p>
        </div>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent transition"
          placeholder="Новый пароль"
          required
        />
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent transition"
          placeholder="Повторите пароль"
          required
        />

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-brand text-gray-900 py-3 rounded-lg font-medium hover:bg-brand-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Сохранение...' : 'Сохранить пароль'}
        </button>
      </form>
    </div>
  );
}
