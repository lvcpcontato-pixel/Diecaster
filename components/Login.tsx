
import React, { useState, useEffect } from 'react';
import { Car as CarIcon, AlertCircle, Loader2, ShieldCheck, CheckCircle2, HelpCircle, Copy, ExternalLink, X } from 'lucide-react';
import { UserProfile } from '../types';
import { getGoogleClientId } from '../services/storageService';

interface LoginProps {
  onLogin: (user: UserProfile) => void;
}

const AUTHORIZED_USER = 'lvcp.contato@gmail.com';

const decodeJwt = (token: string): any => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) { return null; }
};

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [showTroubleshoot, setShowTroubleshoot] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  useEffect(() => {
    const clientId = getGoogleClientId();
    
    /* @ts-ignore */
    if (window.google) {
      try {
        /* @ts-ignore */
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          auto_select: false,
        });

        const btnContainer = document.getElementById("googleBtn");
        if (btnContainer) {
          /* @ts-ignore */
          window.google.accounts.id.renderButton(
            btnContainer,
            { 
              theme: "filled_black", 
              size: "large", 
              width: "320",
              text: "signin_with",
              shape: "pill",
            }
          );
        }
      } catch (e) {
        console.error("Google Init Error:", e);
        setError("Erro ao carregar o sistema de login.");
      }
    }
  }, []);

  const handleCredentialResponse = (response: any) => {
    setIsAuthenticating(true);
    setError(null);
    const payload = decodeJwt(response.credential);
    
    if (payload?.email.toLowerCase() === AUTHORIZED_USER) {
      setTimeout(() => {
        onLogin({
          name: payload.name,
          email: payload.email,
          picture: payload.picture
        });
      }, 800);
    } else {
      setError(`Acesso negado para ${payload?.email}. Esta garagem é privada.`);
      setIsAuthenticating(false);
    }
  };

  const copyOrigin = () => {
    navigator.clipboard.writeText(window.location.origin);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]"></div>
      
      <div className="max-w-md w-full z-10">
        <div className="text-center mb-10 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-500 rounded-2xl text-slate-900 shadow-2xl mb-6 transform -rotate-3">
            <CarIcon size={40} />
          </div>
          <h1 className="text-4xl font-display text-white tracking-wider italic">
            DIECAST
            <span className="block text-sm font-bold text-emerald-400 tracking-[0.4em] uppercase mt-1">MANAGER PRO</span>
          </h1>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 rounded-[40px] shadow-2xl relative overflow-hidden">
          {isAuthenticating && (
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center animate-fade-in">
              <Loader2 className="animate-spin text-emerald-500 mb-4" size={40} />
              <p className="text-emerald-400 font-bold uppercase tracking-widest text-xs">Acessando sua Garagem...</p>
            </div>
          )}

          {showTroubleshoot ? (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center">
                <h3 className="text-white font-bold text-lg">Resolver Erro 400</h3>
                <button onClick={() => setShowTroubleshoot(false)} className="text-slate-500 hover:text-white transition-colors"><X size={20}/></button>
              </div>
              
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-3">
                <p className="text-amber-400 text-[11px] leading-relaxed">
                  O erro <strong>origin_mismatch</strong> acontece porque este endereço não está autorizado no seu Google Cloud Console.
                </p>
                
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Sua Origem Atual:</label>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-black/40 p-2 rounded border border-white/5 text-[10px] text-white font-mono truncate select-all">
                      {window.location.origin}
                    </div>
                    <button 
                      onClick={copyOrigin}
                      className="p-2 bg-emerald-500 text-slate-900 rounded-lg hover:bg-emerald-400 transition-colors"
                    >
                      {copyFeedback ? <CheckCircle2 size={16}/> : <Copy size={16}/>}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Passo a Passo:</p>
                <ol className="text-slate-300 text-xs space-y-3 list-decimal pl-4">
                  <li>Acesse o <a href="https://console.cloud.google.com/apis/credentials" target="_blank" className="text-emerald-400 hover:underline inline-flex items-center gap-1">Console do Google <ExternalLink size={10}/></a></li>
                  <li>Clique no seu <strong>ID do cliente OAuth 2.0</strong>.</li>
                  <li>Vá em <strong>"Origens JavaScript autorizadas"</strong>.</li>
                  <li>Clique em <strong>"Adicionar URI"</strong> e cole o link acima.</li>
                  <li>Salve e aguarde 2 minutos.</li>
                </ol>
              </div>

              <button 
                onClick={() => setShowTroubleshoot(false)}
                className="w-full py-3 bg-slate-800 text-white font-bold rounded-xl text-xs uppercase tracking-widest hover:bg-slate-700"
              >
                Voltar
              </button>
            </div>
          ) : (
            <>
              <div className="mb-8 text-center space-y-2">
                <h2 className="text-xl font-bold text-white">Bem-vindo, Leo!</h2>
                <p className="text-slate-400 text-sm">Acesse sua coleção oficial.</p>
              </div>

              <div className="flex flex-col items-center justify-center space-y-6">
                <div id="googleBtn" className="min-h-[50px] flex items-center justify-center"></div>
                
                <button 
                  onClick={() => setShowTroubleshoot(true)}
                  className="inline-flex items-center gap-2 text-slate-500 hover:text-emerald-400 text-[10px] font-bold uppercase tracking-widest transition-colors"
                >
                  <HelpCircle size={14} /> Problemas com o login?
                </button>
                
                {error && (
                  <div className="flex items-start gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl animate-shake w-full">
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
                    Login Seguro via Google
                 </div>
              </div>
            </>
          )}
        </div>

        <p className="text-center mt-8 text-slate-600 text-[10px] uppercase tracking-[0.2em]">
          &copy; 2025 Leo Collector System
        </p>
      </div>
    </div>
  );
};
