import React, { useState } from 'react';
import Home from './views/Home';
import Marketplace from './views/Marketplace';
import Auth from './views/Auth'; // This serves as your Login/Register view
import Dashboard from './views/Dashboard';
import { 
  Sprout, 
  User, 
  LayoutDashboard, 
  LogOut, 
  ShoppingBag, 
  Home as HomeIcon 
} from 'lucide-react';

const SESSION_KEY = 'agri_go_user';

function App() {
  // 1. Initialize user from SessionStorage
  const [user, setUser] = useState(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch { 
      return null; 
    }
  });

  // 2. Initialize activeTab based on whether user is logged in
  const [activeTab, setActiveTab] = useState(user ? 'dashboard' : 'home');

  const handleLoginSuccess = (userData) => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(userData));
    setUser(userData);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setUser(null);
    setActiveTab('home');
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-0">
      
      {/* ================= DESKTOP NAVBAR ================= */}
      <nav className="hidden md:flex items-center justify-between px-8 py-2.5 bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-50">
        <div 
          className="flex items-center gap-2.5 cursor-pointer group"
          onClick={() => setActiveTab('home')}
        >
          <div className="bg-green-600 p-1.5 rounded-lg text-white shadow-sm group-hover:bg-green-500 transition-colors">
            <Sprout size={18}/>
          </div>
          <span className="font-black text-xl tracking-tight text-green-950 uppercase">
            Agri-Go
          </span>
        </div>

        <div className="flex items-center gap-1">
          <DesktopTab 
            label="Home" 
            isActive={activeTab === 'home'} 
            onClick={() => setActiveTab('home')} 
          />
          <DesktopTab 
            label="Marketplace" 
            isActive={activeTab === 'market'} 
            onClick={() => setActiveTab('market')} 
          />
          
          <div className="h-4 w-[1px] bg-slate-200 mx-4" />

          {user ? (
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full transition-all text-xs font-bold uppercase tracking-wider ${
                  activeTab === 'dashboard' 
                  ? 'bg-green-950 text-white' 
                  : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <LayoutDashboard size={14} />
                Dashboard
              </button>
              <button 
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-50"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setActiveTab('auth')}
              className="bg-green-600 text-white px-5 py-1.5 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-green-700 transition-all active:scale-95 shadow-sm"
            >
              Sign In
            </button>
          )}
        </div>
      </nav>

      {/* ================= MOBILE TOP HEADER ================= */}
      <header className="flex justify-between items-center px-5 py-3.5 sticky top-0 bg-white/90 backdrop-blur-md z-50 border-b border-slate-100 md:hidden">
        <div className="flex items-center gap-2" onClick={() => setActiveTab('home')}>
          <div className="bg-green-600 p-1.5 rounded-lg text-white">
            <Sprout size={16}/>
          </div>
          <span className="font-black text-lg tracking-tighter text-green-900 uppercase">
            Agri-Go
          </span>
        </div>
        
        {user && (
          <button onClick={handleLogout} className="p-2 text-slate-400">
            <LogOut size={18} />
          </button>
        )}
      </header>

      {/* ================= MAIN CONTENT ================= */}
      <main className="w-full">
        {activeTab === 'home' && <Home onNavigate={setActiveTab} />}
        {activeTab === 'market' && <Marketplace />}
        {activeTab === 'auth' && (
          <Auth 
            onNavigate={setActiveTab} 
            onLoginSuccess={handleLoginSuccess} 
          />
        )}
        {activeTab === 'dashboard' && user && (
          <Dashboard 
            user={user} 
            onLogout={handleLogout} 
          />
        )}
      </main>

      {/* ================= MOBILE BOTTOM NAV ================= */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-3 flex justify-between items-center z-50 md:hidden">
        <MobileNavBtn isActive={activeTab === 'home'} onClick={() => setActiveTab('home')} icon={<HomeIcon size={20} />} label="Home" />
        <MobileNavBtn isActive={activeTab === 'market'} onClick={() => setActiveTab('market')} icon={<ShoppingBag size={20} />} label="Market" />
        {user ? (
          <MobileNavBtn isActive={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={20} />} label="Admin" />
        ) : (
          <MobileNavBtn isActive={activeTab === 'auth'} onClick={() => setActiveTab('auth')} icon={<User size={20} />} label="Login" />
        )}
      </nav>
    </div>
  );
}

/** * HELPER COMPONENTS 
 */
function DesktopTab({ label, isActive, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all ${
        isActive 
        ? 'text-green-700 bg-green-50' 
        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
      }`}
    >
      {label}
    </button>
  );
}

function MobileNavBtn({ isActive, onClick, icon, label }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-green-600' : 'text-slate-400'}`}
    >
      {isActive ? React.cloneElement(icon, { strokeWidth: 2.5 }) : icon}
      <span className="text-[9px] font-bold uppercase tracking-[0.05em]">
        {label}
      </span>
    </button>
  );
}

export default App;