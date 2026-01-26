
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Car as CarIcon, Plus, Menu, ScanLine, Wrench, Loader2, LogOut, Keyboard, Sparkles, X } from 'lucide-react';
import { Car, ViewState, UserProfile } from './types';
import { getCars, saveCar, deleteCar } from './services/storageService';
import { Dashboard } from './components/Dashboard';
import { CarList } from './components/CarList';
import { CarForm } from './components/CarForm';
import { DataManagement } from './components/DataManagement';
import { ScannerFlow } from './components/ScannerFlow';
import { Login } from './components/Login';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [view, setView] = useState<ViewState>('login');
  const [cars, setCars] = useState<Car[]>([]);
  const [editingCar, setEditingCar] = useState<Partial<Car> | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const sessionAuth = sessionStorage.getItem('diecast_auth');
    const storedProfile = sessionStorage.getItem('diecast_profile');
    if (sessionAuth === 'true' && storedProfile) {
      setIsAuthenticated(true);
      setUserProfile(JSON.parse(storedProfile));
      setView('dashboard');
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    const initDB = async () => {
      setIsLoading(true);
      try {
        const data = await getCars();
        setCars(data);
      } catch (error) {
        console.error("Failed to load DB", error);
      } finally {
        setIsLoading(false);
      }
    };
    initDB();
  }, [isAuthenticated]);

  const handleLogin = (user: UserProfile) => {
    sessionStorage.setItem('diecast_auth', 'true');
    sessionStorage.setItem('diecast_profile', JSON.stringify(user));
    setUserProfile(user);
    setIsAuthenticated(true);
    setView('dashboard');
  };

  const handleLogout = () => {
    if (confirm('Deseja sair da sua garagem?')) {
      sessionStorage.removeItem('diecast_auth');
      sessionStorage.removeItem('diecast_profile');
      setIsAuthenticated(false);
      setUserProfile(null);
      setView('login');
    }
  };

  const handleManualRefresh = async () => {
    setIsLoading(true);
    const data = await getCars();
    setCars(data);
    setIsLoading(false);
  }

  // Fix: Defined handleRefresh to allow DataManagement component to update the collection state
  const handleRefresh = (data: Car[]) => {
    setCars(data);
  };

  const handleSaveCar = async (car: Car) => {
    setIsLoading(true);
    try {
      const updatedList = await saveCar(car);
      setCars(updatedList);
      setView('list');
      setEditingCar(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCar = async (id: string) => {
    if (confirm('Tem certeza que deseja remover este item da coleção?')) {
      setIsLoading(true);
      try {
        const updatedList = await deleteCar(id);
        setCars(updatedList);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleEditInit = (car: Car) => {
    setEditingCar(car);
    setView('add');
  };

  const handleScannerResult = (preFilledData: Partial<Car>) => {
    setEditingCar(preFilledData);
    setView('add');
  };

  const getPageTitle = () => {
    switch (view) {
      case 'dashboard': return 'Garagem do Leo';
      case 'list': return 'Minha Coleção';
      case 'scanner': return 'Scanner Inteligente';
      case 'data': return 'Oficina de Dados';
      case 'new-choice': return 'Nova Entrada';
      case 'add': return editingCar?.id ? 'Editando Registro' : 'Cadastro Manual';
      default: return 'Garagem';
    }
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 font-sans relative overflow-hidden">
      {isLoading && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
          <Loader2 size={48} className="text-emerald-600 animate-spin mb-4" />
          <p className="text-slate-600 font-display uppercase tracking-wide">Processando...</p>
        </div>
      )}

      {isSidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/40 z-20 lg:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 z-30 w-72 bg-slate-900 text-white transform transition-transform duration-300 ease-out lg:shadow-xl ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 flex flex-col`}>
        <div className="p-8 flex items-center gap-3 border-b border-slate-800">
          <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center text-slate-900 shadow-[0_0_15px_rgba(16,185,129,0.5)]">
            <CarIcon size={24} strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-2xl font-display tracking-wide italic leading-none">DIECAST</h1>
            <span className="text-[10px] font-bold text-emerald-400 tracking-[0.3em] uppercase">FREE MANAGER</span>
          </div>
        </div>

        <div className="px-6 py-6 flex items-center gap-4 border-b border-slate-800 bg-slate-950/30">
           <img src={userProfile?.picture || 'https://via.placeholder.com/40'} alt="Perfil" className="w-10 h-10 rounded-full border-2 border-emerald-500 shadow-lg" />
           <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{userProfile?.name}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest truncate">{userProfile?.email}</p>
           </div>
        </div>

        <nav className="flex-1 px-4 space-y-3 mt-6">
          <button onClick={() => { setView('dashboard'); setIsSidebarOpen(false); }} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 font-bold uppercase tracking-wide text-xs ${view === 'dashboard' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
            <LayoutDashboard size={18} />
            <span>Garagem</span>
          </button>
          <button onClick={() => { setView('list'); setIsSidebarOpen(false); }} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 font-bold uppercase tracking-wide text-xs ${view === 'list' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
            <CarIcon size={18} />
            <span className="flex-1 text-left">Minha Coleção</span>
            <span className="bg-slate-800 text-[10px] font-bold py-0.5 px-2 rounded-full text-emerald-400 border border-slate-700">{cars.length}</span>
          </button>
          <button onClick={() => { setView('data'); setIsSidebarOpen(false); }} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 font-bold uppercase tracking-wide text-xs ${view === 'data' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
            <Wrench size={18} />
            <span>Ferramentas</span>
          </button>
        </nav>

        <div className="p-6 border-t border-slate-800">
           <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl mb-4">
              <p className="text-[10px] text-emerald-500 uppercase font-bold tracking-wider mb-1 flex items-center gap-1"><Sparkles size={10}/> Plano Gratuito</p>
              <p className="text-[9px] text-slate-500 leading-tight">Google Sheets + Gemini Flash (Cota Free Ativa)</p>
           </div>
           <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-3 text-slate-500 hover:text-rose-400 transition-colors text-[10px] font-bold uppercase tracking-widest border border-slate-800 hover:border-rose-900/30 rounded-lg">
             <LogOut size={14} /> Sair
           </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden z-10 relative bg-slate-50">
        <header className="h-20 flex items-center justify-between px-6 lg:px-10 shrink-0 bg-white border-b border-slate-200 z-20">
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 bg-slate-100 rounded-lg text-slate-600" onClick={() => setIsSidebarOpen(true)}><Menu size={20} /></button>
            <h2 className="text-3xl font-display text-slate-900 uppercase tracking-tight skew-x-[-2deg]">{getPageTitle()}</h2>
          </div>
          {view !== 'new-choice' && view !== 'scanner' && view !== 'add' && (
            <button onClick={() => setView('new-choice')} className="flex items-center gap-2 bg-slate-900 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-lg font-bold uppercase tracking-wide transition-all shadow-md active:scale-95 text-xs group">
              <Plus size={16} className="group-hover:rotate-90 transition-transform" />
              <span className="hidden sm:inline">Nova Catalogação</span>
            </button>
          )}
        </header>

        <div className="flex-1 overflow-auto p-4 lg:px-10 lg:pb-10 scroll-smooth">
          <div className="max-w-7xl mx-auto pt-6">
            {view === 'dashboard' && <Dashboard cars={cars} />}
            
            {view === 'new-choice' && (
              <div className="max-w-3xl mx-auto py-12 animate-fade-in text-center">
                 <h3 className="text-2xl font-bold text-slate-800 mb-2">Como deseja adicionar?</h3>
                 <p className="text-slate-500 mb-10">O scanner usa IA gratuita para preencher os dados pra você.</p>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <button 
                      onClick={() => setView('scanner')}
                      className="group p-8 bg-white border-2 border-slate-200 rounded-[32px] hover:border-emerald-500 hover:shadow-xl transition-all text-left relative overflow-hidden"
                    >
                       <div className="absolute -right-4 -top-4 text-emerald-50 group-hover:text-emerald-100 transition-colors rotate-12">
                         <Sparkles size={120} />
                       </div>
                       <div className="bg-emerald-500 text-white p-4 rounded-2xl w-fit mb-6 shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                         <ScanLine size={32} />
                       </div>
                       <h4 className="text-xl font-bold text-slate-900 mb-2">Scanner Inteligente</h4>
                       <p className="text-sm text-slate-500 leading-relaxed">Tire uma foto e deixe a IA identificar marca, modelo e cor automaticamente.</p>
                       <div className="mt-6 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded">
                         <Sparkles size={10}/> Gemini Flash Free
                       </div>
                    </button>

                    <button 
                      onClick={() => { setEditingCar(null); setView('add'); }}
                      className="group p-8 bg-white border-2 border-slate-200 rounded-[32px] hover:border-slate-800 hover:shadow-xl transition-all text-left relative overflow-hidden"
                    >
                       <div className="absolute -right-4 -top-4 text-slate-50 group-hover:text-slate-100 transition-colors rotate-12">
                         <Keyboard size={120} />
                       </div>
                       <div className="bg-slate-800 text-white p-4 rounded-2xl w-fit mb-6 shadow-lg shadow-slate-800/20 group-hover:scale-110 transition-transform">
                         <Plus size={32} />
                       </div>
                       <h4 className="text-xl font-bold text-slate-900 mb-2">Cadastro Manual</h4>
                       <p className="text-sm text-slate-500 leading-relaxed">Digite os dados você mesmo. Ideal para quando não tiver foto ou internet lenta.</p>
                       <div className="mt-6 inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded">
                         100% Offline / Grátis
                       </div>
                    </button>
                 </div>
                 
                 <button onClick={() => setView('dashboard')} className="mt-12 text-slate-400 hover:text-slate-600 text-sm font-bold uppercase tracking-widest">
                   Voltar para a Garagem
                 </button>
              </div>
            )}

            {view === 'scanner' && (
              <ScannerFlow 
                cars={cars} 
                onCatalogItem={handleScannerResult} 
                onDirectSave={handleSaveCar}
                onCancel={() => setView('new-choice')} 
              />
            )}
            
            {view === 'list' && <CarList cars={cars} onEdit={handleEditInit} onDelete={handleDeleteCar} onRefresh={handleManualRefresh} />}
            {view === 'add' && <CarForm initialData={editingCar} onSave={handleSaveCar} onCancel={() => setView('new-choice')} />}
            {view === 'data' && <DataManagement cars={cars} onRefresh={handleRefresh} setLoading={setIsLoading} />}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
