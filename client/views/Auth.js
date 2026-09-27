import React, { useState, useEffect } from 'react';
import { Sprout, LogIn, UserPlus, MapPin, Mail, Lock, Bird, Wheat, Phone } from 'lucide-react';

import slide6 from './assets/slide6.jpg';
import slide7 from './assets/slide7.jpeg';
import slide5 from './assets/slide5.jpg';
import slide4 from './assets/slide4.jpg';

const Auth = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [formData, setFormData] = useState({
    fullname: '', telephone: '', email: '', password: '', location: '', farm_type: 'crop'
  });

  const slides = [slide6, slide7, slide5, slide4];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const action = isLogin ? 'login' : 'register';
    
    const payload = isLogin 
      ? { email: formData.email, password: formData.password, action }
      : { ...formData, action };
    
    try {
      // Swapped port to match unified 3000 mapping layout configurations
      const BACKEND_URL = 'http://localhost:5000/api/auth';
      const res = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (data.status === 'success') {
        if (isLogin) {
          onLoginSuccess(data.user);
        } else {
          alert("Account created! Please login.");
          setIsLogin(true);
        }
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert("Server connection failed.");
    }
  };

  return (
    <div className="w-full min-h-[100dvh] md:fixed md:inset-0 md:h-full flex flex-col md:flex-row overflow-y-auto md:overflow-hidden bg-slate-50 font-sans antialiased">
      <div className="w-full h-[45dvh] shrink-0 md:h-full md:w-1/2 bg-slate-900 flex flex-col justify-center text-white relative overflow-hidden transition-all duration-300">
        <div className="absolute inset-0 z-0 pointer-events-none">
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                index === currentSlide ? 'opacity-50' : 'opacity-0'
              }`}
            >
              <img src={slide} alt="Background" className="h-full w-full object-cover scale-105 animate-slow-zoom" />
              <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/30 to-slate-900/90 md:bg-gradient-to-br" />
            </div>
          ))}
        </div>

        <div className="relative z-10 px-5 py-3 sm:px-10 md:p-12 lg:p-16 flex flex-col justify-end md:justify-center h-full">
          <div className="flex items-center gap-1.5 mb-1 md:mb-4">
            <div className="bg-green-500 p-1 rounded-lg text-white shadow-md shadow-green-500/20">
              <Sprout size={14} className="md:w-6 md:h-6" />
            </div>
            <h1 className="text-xs sm:text-sm md:text-xl font-black uppercase tracking-tighter italic">Agri-Go</h1>
          </div>
          <h2 className="text-sm sm:text-lg md:text-3xl lg:text-4xl font-black tracking-tighter leading-tight mb-0.5 uppercase italic">
            Empowering <span className="text-green-400 underline decoration-white/10">Ghanaian</span> Farmers.
          </h2>
          <p className="text-slate-300 text-[9px] sm:text-xs md:text-base max-w-md font-medium leading-relaxed italic drop-shadow-sm">
            Join the smart agricultural ecosystem. Detect diseases for both <span className="text-green-400 font-bold">crops and poultry</span>.
          </p>
        </div>
      </div>

      <div className="w-full min-h-[55dvh] md:h-full md:flex-1 bg-white flex flex-col justify-center items-center px-5 py-6 sm:p-10 md:p-12 lg:p-16 border-t border-slate-100 md:border-t-0 md:overflow-y-auto">
        <div className="w-full max-w-sm my-auto flex flex-col justify-center animate-fadeIn py-2">
          
          <div className="mb-4 sm:mb-6 text-center sm:text-left shrink-0">
            <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-black text-slate-900 tracking-tighter uppercase italic leading-none mb-1">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h3>
            <p className="text-slate-400 font-bold text-[9px] sm:text-xs">
              {isLogin ? 'Access your dashboard' : 'Join the precision farming movement'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-3.5 min-h-0">
            {!isLogin && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                <div className="relative group">
                  <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-green-600 transition-colors" size={13} />
                  <input required type="text" placeholder="Farmer Name" className="w-full bg-slate-50 py-2 sm:py-2.5 pl-9 pr-3 rounded-lg border border-slate-200/60 font-semibold text-xs focus:bg-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all text-slate-800 placeholder:text-slate-400" onChange={(e) => setFormData({...formData, fullname: e.target.value})} />
                </div>
                
                <div className="relative group">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-green-600 transition-colors" size={13} />
                  <input required type="text" placeholder="Location" className="w-full bg-slate-50 py-2 sm:py-2.5 pl-9 pr-3 rounded-lg border border-slate-200/60 font-semibold text-xs focus:bg-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all text-slate-800 placeholder:text-slate-400" onChange={(e) => setFormData({...formData, location: e.target.value})} />
                </div>
                
                <div className="grid grid-cols-2 gap-2.5 col-span-1 sm:col-span-2">
                  <label className={`cursor-pointer border p-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${formData.farm_type === 'poultry' ? 'border-red-500 bg-red-50/60 text-red-600 font-bold shadow-sm' : 'border-slate-200/80 bg-slate-50/50 text-slate-400 font-semibold hover:opacity-100 hover:bg-slate-50'}`}>
                    <input type="radio" name="farm_type" value="poultry" className="hidden" onChange={() => setFormData({...formData, farm_type: 'poultry'})} />
                    <Bird size={13} /><span className="text-[9px] uppercase tracking-wider">Poultry</span>
                  </label>
                  <label className={`cursor-pointer border p-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${formData.farm_type === 'crop' ? 'border-green-500 bg-green-50/60 text-green-600 font-bold shadow-sm' : 'border-slate-200/80 bg-slate-50/50 text-slate-400 font-semibold hover:opacity-100 hover:bg-slate-50'}`}>
                    <input type="radio" name="farm_type" value="crop" className="hidden" onChange={() => setFormData({...formData, farm_type: 'crop'})} />
                    <Wheat size={13} /><span className="text-[9px] uppercase tracking-wider">Crops</span>
                  </label>
                </div>
                
                <div className="relative group col-span-1 sm:col-span-2">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-green-600 transition-colors" size={13} />
                  <input required type="tel" placeholder="Telephone Number" className="w-full bg-slate-50 py-2 sm:py-2.5 pl-9 pr-3 rounded-lg border border-slate-200/60 font-semibold text-xs focus:bg-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all text-slate-800 placeholder:text-slate-400" onChange={(e) => setFormData({...formData, telephone: e.target.value})} />
                </div>
              </div>
            )}

            <div className="relative group">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-green-600 transition-colors" size={13} />
              <input required type="email" placeholder="Email Address" className="w-full bg-slate-50 py-2 sm:py-2.5 pl-9 pr-3 rounded-lg border border-slate-200/60 font-semibold text-xs focus:bg-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all text-slate-800 placeholder:text-slate-400" onChange={(e) => setFormData({...formData, email: e.target.value})} />
            </div>

            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-green-600 transition-colors" size={13} />
              <input required type="password" placeholder="Password" className="w-full bg-slate-50 py-2 sm:py-2.5 pl-9 pr-3 rounded-lg border border-slate-200/60 font-semibold text-xs focus:bg-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all text-slate-800 placeholder:text-slate-400" onChange={(e) => setFormData({...formData, password: e.target.value})} />
            </div>

            <button type="submit" className="w-full bg-slate-900 text-white py-2.5 rounded-lg font-bold uppercase tracking-wider text-[10px] sm:text-xs shadow-md shadow-slate-900/10 flex items-center justify-center gap-2 hover:bg-slate-800 active:scale-[0.99] transition-all mt-1">
              {isLogin ? <LogIn size={13} /> : <UserPlus size={13} />}
              {isLogin ? 'Sign In' : 'Register Account'}
            </button>
          </form>

          <div className="mt-4 text-center shrink-0">
            <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-slate-400 font-bold text-[9px] sm:text-xs uppercase tracking-widest hover:text-green-600 transition-colors py-1.5 outline-none focus:text-green-600">
              {isLogin ? "New here? Create account" : "Have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slow-zoom { from { transform: scale(1); } to { transform: scale(1.04); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        .animate-slow-zoom { animation: slow-zoom 20s infinite alternate linear; }
        .animate-fadeIn { animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @media (min-width: 768px) {
          html, body, #root { overflow: hidden !important; height: 100vh !important; }
        }
        @media (max-width: 767px) {
          html, body, #root { min-height: 100dvh !important; height: auto !important; }
        }
        html, body, #root { width: 100% !important; margin: 0; padding: 0; background-color: #f8fafc; }
      `}} />
    </div>
  );
};

export default Auth;