import React, { useState, useEffect } from 'react';
import Head from 'next/head';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function CheckinAuthGuard({ children }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [username, setUsername] = useState('recepcao');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const auth = localStorage.getItem('checkin_authenticated');
    if (auth === 'true') {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/checkin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Usuário ou senha incorretos');
      }

      localStorage.setItem('checkin_authenticated', 'true');
      localStorage.setItem('checkin_user', data.user.username);
      localStorage.setItem('isv-admin', data.user.username);
      localStorage.setItem('checkin-responsavel', data.user.username);

      setIsAuthenticated(true);
    } catch (err: any) {
      setError(err.message || 'Falha na autenticação');
    } finally {
      setLoading(false);
    }
  };

  // Initial loading check
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-100 font-sans">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Not authenticated: render Login screen
  if (!isAuthenticated) {
    return (
      <>
        <Head>
          <title>Acesso ao Check-in | AD 2026</title>
        </Head>
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 font-sans">
          <div className="max-w-sm w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
            {/* Header Badge */}
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-gradient-to-tr from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center font-black text-white text-2xl shadow-xl mx-auto">
                AD
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-white tracking-tight">AD 2026 Check-in</h1>
                <p className="text-xs text-slate-400 mt-1">Digite suas credenciais de portaria</p>
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="bg-rose-950/60 border border-rose-800/80 p-3.5 rounded-2xl text-xs text-rose-300 text-center font-medium animate-pulse">
                ⚠️ {error}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Usuário
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="recepcao"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-amber-500 transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Senha
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-amber-500 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 text-white font-bold rounded-2xl shadow-lg transition-all active:scale-95 text-sm uppercase tracking-wider mt-2"
              >
                {loading ? 'Entrando...' : 'Entrar no Sistema'}
              </button>
            </form>

            <div className="text-center pt-2 border-t border-slate-800/80">
              <span className="text-[11px] text-slate-500">Credenciamento AD 2026 • Portaria</span>
            </div>
          </div>
        </div>
      </>
    );
  }

  return <>{children}</>;
}
