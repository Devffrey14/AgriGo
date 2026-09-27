import React, { useState, useEffect } from 'react';
import { ShoppingBag } from 'lucide-react';

// Assets imported from the local views/assets directory
import slide1 from './assets/slide1.jpg';
import slide2 from './assets/slide2.jpeg';
import slide3 from './assets/slide3.jpg';
import slide9 from './assets/slide9.avif';
import slide10 from './assets/slide10.jpg';

const Home = ({ onNavigate }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = [slide1, slide2, slide3, slide9, slide10];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000); 
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    /* 
      CRITICAL: 'h-screen' and 'overflow-hidden' on the parent 
      and 'max-h-screen' on the section ensure zero scrolling.
    */
    <div className="relative h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-slate-900">
      
      {/* --- BACKGROUND SLIDESHOW LAYER --- */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentSlide ? 'opacity-40' : 'opacity-0'
            }`}
          >
            <img 
              src={slide} 
              alt="Agricultural background" 
              className="h-full w-full object-cover scale-105 animate-slow-zoom" 
            />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-transparent to-slate-900/80" />
          </div>
        ))}
      </div>

      {/* --- NON-SCROLLABLE COMPACT CONTENT LAYER --- */}
      <section className="relative z-10 w-full max-w-4xl px-8 flex flex-col items-center justify-between h-full max-h-screen py-8 md:py-12 text-center animate-in fade-in zoom-in-95 duration-1000">
        
    
        {/* Center Elements Group - Centered within available space */}
        <div className="flex flex-col items-center justify-center flex-grow overflow-hidden">
          <h1 className="text-5xl md:text-[72px] lg:text-[85px] font-black text-white leading-[0.8] mb-4 tracking-tighter uppercase">
            Farming <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-200">
              Smarter.
            </span>
          </h1>

          <p className="text-slate-200 text-sm md:text-base lg:text-lg mb-6 max-w-lg leading-snug font-medium drop-shadow-md">
           The digital gateway for the modern farmer. 
            Trade directly or deploy AI diagnostics for your <span className="text-green-400">crops and poultry</span> in seconds.
          </p>

          <div className="relative group inline-block">
            <div className="absolute -inset-1 bg-green-500 rounded-[1.2rem] blur opacity-25 group-hover:opacity-40 transition duration-500"></div>
            
            <button 
              onClick={() => onNavigate('market')} 
              className="relative bg-white text-slate-900 px-10 py-3.5 rounded-[1.2rem] font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 shadow-2xl hover:bg-green-600 hover:text-white transition-all duration-500 active:scale-95"
            >
              Access Marketplace 
              <ShoppingBag size={14} className="group-hover:rotate-12 transition-transform" />
            </button>
          </div>
        </div>

        {/* Bottom Element */}
        <div className="flex-none pb-2">
          <div className="flex items-center justify-center gap-2">
            {slides.map((_, idx) => (
              <div 
                key={idx} 
                className={`h-1 transition-all duration-500 rounded-full ${
                  idx === currentSlide ? 'w-6 bg-green-400' : 'w-1.5 bg-white/20'
                }`}
              />
            ))}
          </div>
        </div>

      </section>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slow-zoom {
          from { transform: scale(1); }
          to { transform: scale(1.05); }
        }
        .animate-slow-zoom {
          animation: slow-zoom 20s infinite alternate linear;
        }
        /* Global override to ensure body doesn't scroll */
        body {
          overflow: hidden !important;
          height: 100vh !important;
        }
      `}} />
    </div>
  );
};

export default Home;