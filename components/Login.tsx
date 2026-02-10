
import React, { useState } from 'react';
import { Car as CarIcon, AlertCircle, Loader2, KeyRound, Mail, ChevronRight } from 'lucide-react';
import { UserProfile } from '../types';

interface LoginProps {
  onLogin: (user: UserProfile) => void;
}

const AUTHORIZED_USER = 'lvcp.contato@gmail.com';
const AUTHORIZED_PASS = 'I9psum@1';

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsAuthenticating(true);

    setTimeout(() => {
      if (email.toLowerCase() === AUTHORIZED_USER && password === AUTHORIZED_PASS) {
        onLogin({
          name: 'Leo',
          email: AUTHORIZED_USER,
          picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Leo&backgroundColor=b6e3f4'
        });
      } else {
        setError('E-mail ou senha incorretos. Acesso negado.');
        setIsAuthenticating(false);
      }
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]"></div>
      
      <div className="max-w-md w-full z-10">
        <div className="text-center mb-10 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-500 rounded-2xl text-slate-900 shadow-2xl mb-6 transform -rotate-3 transition-transform hover:rotate-0 cursor-default">
            <CarIcon size={40} />
          </div>
          <h1 className="text-4xl font-display text-white tracking-wider italic">
            DIECAST
            <span className="block text-sm font-bold text-emerald-400 tracking-[0.4em] uppercase mt-1">MANAGER PRO</span>
          </h1>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 rounded-[40px] shadow-2xl relative overflow-hidden transition-all">
          <form onSubmit={handleLoginSubmit} className="space-y-6">
            <div className="mb-4 text-center">
              <h2 className="text-xl font-bold text-white">Acesso à Garagem</h2>
              <p className="text-slate-400 text-sm">Identifique-se para gerenciar sua frota.</p>
            </div>

            <div className="space-y-4">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-emerald-500 transition-colors">
                  <Mail size={18} />
                </div>
                <input 
                  id="email"
                  name="email"
                  type="email" 
                  autoComplete="username"
                  required
                  placeholder="E-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                />
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-emerald-500 transition-colors">
                  <KeyRound size={18} />
                </div>
                <input 
                  id="password"
                  name="password"
                  type="password" 
                  autoComplete="current-password"
                  required
                  placeholder="Senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl animate-shake">
                <AlertCircle className="text-rose-500 shrink-0" size={18} />
                <p className="text-rose-300/80 text-[11px] leading-tight font-bold uppercase">{error}</p>
              </div>
            )}

            <button 
              type="submit"
              disabled={isAuthenticating}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl shadow-emerald-500/10 disabled:opacity-50"
            >
              {isAuthenticating ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>Acessar Garagem <ChevronRight size={18} /></>
              )}
            </button>
          </form>
        </div>

        <div className="flex justify-center items-center gap-4 mt-8 opacity-40">
           <div className="h-px w-8 bg-slate-800"></div>
           <p className="text-slate-600 text-[10px] uppercase tracking-[0.3em] font-bold">
             Leo Collector System
           </p>
           <div className="h-px w-8 bg-slate-800"></div>
        </div>
      </div>
    </div>
  );
};
