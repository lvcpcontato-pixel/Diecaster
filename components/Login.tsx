
import React, { useState, useEffect } from 'react';
import { Car as CarIcon, Lock, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import { UserProfile } from '../types';

interface LoginProps {
  onLogin: (user: UserProfile) => void;
}

const AUTHORIZED_USER = 'lvcp.contato@gmail.com';

// Função auxiliar para decodificar JWT sem bibliotecas externas
const decodeJwt = (token: string): any => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    // Inicializa o Google One Tap / Button
    /* @ts-ignore */
    if (window.google) {
      /* @ts-ignore */
      window.google.accounts.id.initialize({
        client_id: "731777218659-e9mjs08v047cl5r04i588i0pce5o6k2a.apps.googleusercontent.com", // Client ID de exemplo, idealmente o usuário criaria o seu no console.google.com
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      /* @ts-ignore */
      window.google.accounts.id.renderButton(
        document.getElementById("googleBtn"),
        { 
          theme: "filled_black", 
          size: "large", 
          width: "320",
          text: "signin_with",
          shape: "pill",
          logo_alignment: "left"
        }
      );
    }
  }, []);

  const handleCredentialResponse = (response: any) => {
    setIsAuthenticating(true);
    setError(null);
    
    const payload = decodeJwt(response.credential);
    
    if (!payload) {
      setError("Falha na autenticação do Google.");
      setIsAuthenticating(false);
      return;
    }

    // Validação de segurança (Somente o Leo entra)
    if (payload.email.toLowerCase() === AUTHORIZED_USER) {
      setTimeout(() => {
        onLogin({
          name: payload.name,
          email: payload.email,
          picture: payload.picture
        });
      }, 1000);
    } else {
      setError(`Acesso negado para ${payload.email}. Esta garagem é privada.`);
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Elementos Decorativos de Fundo */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]"></div>
      
      <div className="max-w-md w-full z-10">
        <div className="text-center mb-10 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-500 rounded-2xl text-slate-900 shadow-[0_0_30px_rgba(16,185,129,0.4)] mb-6 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
            <CarIcon size={40} strokeWidth={2} />
          </div>
          <h1 className="text-4xl font-display text-white tracking-wider italic">
            DIECAST
            <span className="block text-sm font-bold text-emerald-400 tracking-[0.4em] uppercase mt-1">MANAGER PRO</span>
          </h1>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
          {isAuthenticating && (
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center animate-fade-in">
              <Loader2 className="animate-spin text-emerald-500 mb-4" size={40} />
              <p className="text-emerald-400 font-bold uppercase tracking-widest text-xs">Validando Credenciais...</p>
            </div>
          )}

          <div className="mb-8 text-center">
            <h2 className="text-xl font-bold text-white mb-2">Garagem Privada</h2>
            <p className="text-slate-400 text-sm">Entre com sua conta Google para gerenciar sua coleção.</p>
          </div>

          <div className="flex flex-col items-center justify-center space-y-6">
            <div id="googleBtn" className="min-h-[50px] flex items-center justify-center"></div>
            
            {error && (
              <div className="flex items-start gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl animate-shake">
                <AlertCircle className="text-rose-500 shrink-0" size={20} />
                <p className="text-rose-400 text-xs font-bold leading-tight uppercase tracking-tight">
                  {error}
                </p>
              </div>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800/50 text-center">
             <div className="inline-flex items-center gap-2 text-slate-600 text-[10px] font-bold uppercase tracking-widest">
                <ShieldCheck size={14} className="text-emerald-500/50" />
                Google Secure Authentication Enabled
             </div>
          </div>
        </div>

        <p className="text-center mt-8 text-slate-600 text-[10px] uppercase tracking-[0.2em]">
          &copy; 2025 Leo Collector System v2.1
        </p>
      </div>
    </div>
  );
};
