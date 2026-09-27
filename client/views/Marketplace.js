import React, { useState, useEffect, useRef } from 'react';
import {
  Search, MapPin, ShoppingCart, Phone, X,
  CheckCircle, Loader2, User, ShieldCheck,
  Info, SlidersHorizontal,
  AlertCircle, Tag
} from 'lucide-react';

import slide1 from './slides/slide1.webp';
import slide2 from './slides/slide2.webp';
import slide3 from './slides/slide3.jpg';
import slide4 from './slides/slide4.webp';

const SLIDES = [
  { src: slide1, caption: 'Fresh from the Farm', sub: 'Direct from verified Ghanaian farmers.' },
  { src: slide2,  caption: 'Organic Harvests',     sub: 'No middlemen. Fair prices. Real farmers.' },
  { src: slide3, caption: 'Premium Quality Produce', sub: 'Inspected, verified and freshly harvested.' },
  { src: slide4,  caption: 'Support Local Farmers', sub: 'Every purchase empowers a local farmer.' },
];

const CATEGORIES = ["All", "Grains", "Vegetables", "Poultry", "Livestock", "Tubers"];

const sanitize = (str) =>
  typeof str === 'string' ? str.replace(/[<>'";&]/g, '').trim().slice(0, 120) : '';

const HeroSlideshow = () => {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);

  const next = () => setCurrent(p => (p + 1) % SLIDES.length);

  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(next, 5000);
    return () => clearInterval(timerRef.current);
  }, [paused, current]);

  return (
    <div
      className="relative overflow-hidden bg-slate-900 h-[400px] md:h-[500px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {SLIDES.map((slide, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            i === current ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          <img
            src={slide.src}
            alt={slide.caption}
            className="w-full h-full object-cover"
            onError={e => { 
              e.target.src = 'https://images.unsplash.com/photo-1500937386604-563958af8827?auto=format&fit=crop&q=80&w=1600'; 
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/40 to-slate-900/20 z-20 flex flex-col justify-center px-8 md:px-16">
             <h2 className="text-white text-4xl md:text-6xl font-black uppercase italic tracking-tighter mb-2">{slide.caption}</h2>
             <p className="text-slate-200 text-lg md:text-xl font-bold italic">{slide.sub}</p>
          </div>
        </div>
      ))}
      </div>
  );
};

const OrderModal = ({ item, onClose }) => {
  const [orderData,   setOrderData]   = useState({ buyerName: '', buyerPhone: '', quantity: 1, method: 'Pickup' });
  const [orderStatus, setOrderStatus] = useState('idle');

  if (!item) return null;

  const total = item.price * orderData.quantity;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setOrderStatus('loading');
    try {
      // Adjusted purchase request pipeline configuration layout to port 3000
      const res = await fetch('http://localhost:5000/api/place-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          produce_id:      item.id,
          produce_name:    item.name,
          buyer_name:      sanitize(orderData.buyerName),
          buyer_contact:   sanitize(orderData.buyerPhone),
          farmer_id:       item.farmer_id,
          farmer_contact: item.contact,
          quantity:        orderData.quantity,
          total_price:     total,
          delivery_method: orderData.method,
        }),
      });
      if (res.ok) {
        setOrderStatus('success');
        setTimeout(() => { onClose(); }, 2800);
      } else {
        setOrderStatus('error');
        setTimeout(() => setOrderStatus('idle'), 2500);
      }
    } catch {
      setOrderStatus('error');
      setTimeout(() => setOrderStatus('idle'), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-5">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg bg-white rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl overflow-hidden">
        <div className="bg-slate-900 px-6 py-5 flex items-center justify-between">
          <div>
            <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">
              Purchase Request
            </p>
            <h3 className="text-lg font-black text-white leading-tight">{item.name}</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors">
            <X size={15} />
          </button>
        </div>

        <div className="bg-emerald-50 border-b border-emerald-100 px-6 py-3 flex items-center gap-4">
          <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center shrink-0">
            <User size={14} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">Seller</p>
            <p className="text-sm font-black text-slate-900 truncate">
              {item.farmer_id || 'Agri-Go Verified Farmer'}
            </p>
          </div>
          <a href={`tel:${item.contact}`}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all active:scale-95 shrink-0"
          >
            <Phone size={11} /> {item.contact || 'Call'}
          </a>
        </div>

        <div className="p-5">
          {orderStatus === 'success' ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-emerald-600" />
              </div>
              <h4 className="text-lg font-black text-slate-900 mb-1">Order Sent!</h4>
              <p className="text-slate-500 text-sm font-medium">
                The farmer will contact you shortly.
              </p>
            </div>
          ) : orderStatus === 'error' ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={32} className="text-rose-500" />
              </div>
              <h4 className="text-lg font-black text-slate-900 mb-1">Order Failed</h4>
              <p className="text-slate-500 text-sm font-medium">Please try again.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <MktField label="Your Name">
                  <input required type="text" placeholder="Full name" value={orderData.buyerName}
                    onChange={e => setOrderData({ ...orderData, buyerName: e.target.value })}
                    maxLength={80} className="mkt-in" />
                </MktField>
                <MktField label="Your Phone">
                  <input required type="tel" placeholder="05XXXXXXXX" value={orderData.buyerPhone}
                    onChange={e => setOrderData({ ...orderData, buyerPhone: e.target.value })}
                    maxLength={15} className="mkt-in" />
                </MktField>
                <MktField label="Quantity">
                  <input type="number" min="1" max={item.quantity} value={orderData.quantity}
                    onChange={e => setOrderData({ ...orderData, quantity: Math.min(parseInt(e.target.value)||1, item.quantity) })}
                    className="mkt-in" />
                </MktField>
                <MktField label="Delivery">
                  <select value={orderData.method} onChange={e => setOrderData({ ...orderData, method: e.target.value })} className="mkt-in">
                    <option value="Pickup">Pickup at Farm</option>
                    <option value="Delivery">Local Delivery</option>
                  </select>
                </MktField>
              </div>

              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black text-emerald-700 uppercase tracking-widest mb-0.5">Total</p>
                  <p className="text-2xl font-black text-emerald-800">₵{total.toLocaleString()}</p>
                </div>
                <div className="text-right text-[10px] font-bold text-emerald-600">
                  {orderData.quantity} {item.unit} x ₵{item.price}
                </div>
              </div>

              <button
                type="submit"
                disabled={orderStatus === 'loading'}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-emerald-700 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50 active:scale-[0.98] shadow-lg"
              >
                {orderStatus === 'loading'
                  ? <><Loader2 className="animate-spin" size={14} /> Processing...</>
                  : <><ShoppingCart size={14} /> Confirm Purchase Request</>
                }
              </button>
            </form>
          )}
        </div>
      </div>
      <style>{`
        .mkt-in { width:100%; padding:10px 14px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; font-size:13px; font-weight:600; color:#1e293b; outline:none; transition:all .15s; }
        .mkt-in:focus { border-color:#10b981; box-shadow:0 0 0 3px rgba(16,185,129,.1); }
        .mkt-in::placeholder { color:#94a3b8; }
      `}</style>
    </div>
  );
};

const FarmerModal = ({ seller, onClose, onOrder }) => {
  if (!seller) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-5">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-sm bg-white rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl overflow-hidden">
        <div className="bg-emerald-600 px-6 py-8 text-center relative">
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors">
            <X size={15} />
          </button>
          <div className="w-16 h-16 bg-white/20 border-4 border-white/30 rounded-full flex items-center justify-center mx-auto mb-3 shadow-xl">
            <User size={28} className="text-white" />
          </div>
          <p className="text-[9px] font-black text-emerald-200 uppercase tracking-widest mb-1">
            Verified Farmer Profile
          </p>
          <h3 className="text-lg font-black text-white leading-tight">
            {seller.farmer_id || 'Agri-Go Certified Seller'}
          </h3>
          <p className="text-emerald-200 text-[10px] font-medium mt-0.5">
            ID: #{seller.id || 'AGR-VERIFIED'}
          </p>
        </div>

        <div className="p-5 space-y-3">
          <InfoRow
            icon={<User size={14} className="text-emerald-600" />}
            label="Full Name"
            value={seller.farmer_id || 'Agri-Go Certified Seller'}
          />
          <InfoRow
            icon={<Phone size={14} className="text-emerald-600" />}
            label="Phone Number"
            value={seller.contact || 'Contact not available'}
            isPhone
            phone={seller.contact}
          />
          <InfoRow
            icon={<MapPin size={14} className="text-emerald-600" />}
            label="Location"
            value={seller.location || 'Ghana'}
          />
          <InfoRow
            icon={<Tag size={14} className="text-emerald-600" />}
            label="Category"
            value={seller.category || 'Mixed Produce'}
          />

          <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
            <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
            <p className="text-[10px] font-bold text-emerald-800">
              This farmer is verified by the Agri-Go network.
            </p>
          </div>

          <button
            onClick={() => { onClose(); onOrder(seller); }}
            disabled={!seller.quantity || seller.quantity === 0}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-emerald-700 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-[0.98] shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ShoppingCart size={14} />
            {!seller.quantity || seller.quantity === 0 ? 'Out of Stock' : 'Proceed to Purchase'}
          </button>
        </div>
      </div>
    </div>
  );
};

const InfoRow = ({ icon, label, value, isPhone, phone }) => (
  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
    <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center shrink-0 shadow-sm">
      {icon}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-xs font-bold text-slate-800 truncate">{value}</p>
    </div>
    {isPhone && phone && (
      <a href={`tel:${phone}`}
        className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shrink-0"
      >
        <Phone size={10} /> Call
      </a>
    )}
  </div>
);

const MktField = ({ label, children }) => (
  <div className="space-y-1">
    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block pl-0.5">
      {label}
    </label>
    {children}
  </div>
);

const ProduceCard = ({ item, onOrder, onViewSeller }) => {
  const isSoldOut = !item.quantity || item.quantity === 0;
  const isLow     = item.quantity > 0 && item.quantity <= 5;

  return (
    <div className={`group bg-white rounded-2xl border overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex flex-col h-full ${
      isLow && !isSoldOut ? 'border-rose-200' : 'border-slate-200'
    }`}>
      <div className="h-44 relative overflow-hidden bg-slate-100 shrink-0">
        <img
          src={item.image_url}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          alt={item.name}
          onError={e => { e.target.src = 'https://images.unsplash.com/photo-1500937386604-563958af8827?auto=format&fit=crop&q=80&w=800'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

        <div className="absolute top-3 left-3 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm">
          <MapPin size={9} className="text-emerald-600 shrink-0" />
          <span className="text-[8px] font-black text-slate-800 uppercase tracking-wide truncate max-w-[80px]">
            {item.location}
          </span>
        </div>

        <div className={`absolute top-3 right-3 text-[8px] font-black uppercase px-2 py-1 rounded-full ${
          isSoldOut ? 'bg-slate-900 text-white' :
          isLow     ? 'bg-rose-600 text-white animate-pulse' :
                      'bg-emerald-600 text-white'
        }`}>
          {isSoldOut ? 'Sold Out' : isLow ? `${item.quantity} left!` : 'In Stock'}
        </div>

        <button
          onClick={() => onViewSeller(item)}
          className="absolute bottom-3 right-3 w-8 h-8 bg-black/50 hover:bg-black/80 backdrop-blur-sm text-white rounded-full flex items-center justify-center transition-all active:scale-90"
          title="View seller profile"
        >
          <Info size={13} />
        </button>
      </div>

      <div className="flex-1 flex flex-col p-4">
        <div className="mb-1">
          <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">{item.category}</span>
        </div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="text-sm font-black text-slate-900 leading-tight truncate flex-1">{item.name}</h3>
          <div className="text-right shrink-0">
            <p className="text-base font-black text-slate-900 leading-none">₵{item.price}</p>
            <p className="text-[8px] text-slate-400 font-bold uppercase">/{item.unit}</p>
          </div>
        </div>

        <div className="mt-auto flex gap-2">
          {!isSoldOut ? (
            <>
              <button
                onClick={() => onOrder(item)}
                className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all active:scale-95 shadow-sm shadow-emerald-100"
              >
                <ShoppingCart size={11} /> Order
              </button>
               <a href={`tel:${item.contact}`}
                title={item.contact || 'Call farmer'}
                className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-700 text-white px-3 py-2.5 rounded-xl transition-all active:scale-90 shadow-sm"
              >
                <Phone size={13} />
                <span className="text-[8px] font-black hidden sm:block truncate max-w-[70px]">
                  {item.contact || 'Call'}
                </span>
              </a>
            </>
          ) : (
            <button disabled className="w-full py-2.5 bg-slate-100 text-slate-400 rounded-xl font-black text-[9px] uppercase tracking-widest cursor-not-allowed">
              Out of Stock
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const Marketplace = () => {
  const [listings,         setListings]         = useState([]);
  const [searchTerm,       setSearchTerm]       = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading,          setLoading]          = useState(true);
  const [selectedItem,     setSelectedItem]     = useState(null);
  const [viewingSeller,    setViewingSeller]    = useState(null);
  const [showFilters,      setShowFilters]      = useState(false);
  const [sortBy,           setSortBy]           = useState('default');

  useEffect(() => {
    // Adjusted harvest load endpoint index context back to localhost port 3000
    fetch(`http://localhost:5000/api/produce`)
      .then(res => res.json())
      .then(data => {
        setListings(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Marketplace fetch error:", err);
        setListings([]);
        setLoading(false);
      });
  }, []);

  const safe = Array.isArray(listings) ? listings : [];

  const filtered = safe
    .filter(item => {
      const q   = sanitize(searchTerm).toLowerCase();
      const name = (item.name     || '').toLowerCase();
      const loc  = (item.location || '').toLowerCase();
      const cat  = item.category  || '';
      return (
        (!q || name.includes(q) || loc.includes(q)) &&
        (selectedCategory === 'All' || cat === selectedCategory)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'price_lo') return (a.price || 0) - (b.price || 0);
      if (sortBy === 'price_hi') return (b.price || 0) - (a.price || 0);
      if (sortBy === 'qty')      return (b.quantity || 0) - (a.quantity || 0);
      return 0;
    });

  const inStock  = safe.filter(i => (i.quantity || 0) > 0).length;
  const hasFilter = selectedCategory !== 'All' || sortBy !== 'default';

  return (
    <div className="min-h-screen bg-[#f8faf8] font-sans">
      <div className="relative">
        <HeroSlideshow />

        <div className="absolute bottom-0 left-0 right-0 translate-y-1/2 z-30 px-4 sm:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col sm:flex-row overflow-hidden">
              <div className="flex-1 flex items-center gap-3 px-5 py-3.5 border-b sm:border-b-0 sm:border-r border-slate-100">
                <Search size={16} className="text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search maize, yams, poultry..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(sanitize(e.target.value))}
                  maxLength={60}
                  className="flex-1 text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none bg-transparent"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="text-slate-400 hover:text-slate-600 transition-colors">
                    <X size={14} />
                  </button>
                )}
              </div>
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="px-5 py-3.5 text-xs font-black uppercase text-slate-600 bg-slate-50 outline-none cursor-pointer hover:bg-slate-100 transition-colors"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-5 py-3.5 text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-colors ${
                  hasFilter ? 'bg-emerald-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50 border-t sm:border-t-0 sm:border-l border-slate-100'
                }`}
              >
                <SlidersHorizontal size={14} />
                <span className="hidden sm:inline">Sort</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="h-16 sm:h-12" />

      {showFilters && (
        <div className="bg-white border-b border-slate-200 px-4 sm:px-8 py-4">
          <div className="max-w-6xl mx-auto flex flex-wrap items-center gap-3">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Sort By</p>
            {[
              { id: 'default',  label: 'Default' },
              { id: 'price_lo', label: 'Lowest Price' },
              { id: 'price_hi', label: 'Highest Price' },
              { id: 'qty',      label: 'Most Stock' },
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => setSortBy(opt.id)}
                className={`px-3 py-1.5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${
                  sortBy === opt.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
            {hasFilter && (
              <button
                onClick={() => { setSortBy('default'); setSelectedCategory('All'); }}
                className="flex items-center gap-1.5 text-rose-500 bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-xl font-black text-[9px] uppercase tracking-widest ml-auto"
              >
                <X size={10} /> Clear
              </button>
            )}
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
        {!loading && (
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-black text-slate-900">
                {searchTerm
                  ? `Results for "${searchTerm}"`
                  : selectedCategory === 'All' ? 'All Produce' : selectedCategory}
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                {filtered.length} listing{filtered.length !== 1 ? 's' : ''} · {inStock} in stock
              </p>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-xs sm:max-w-none">
              {CATEGORIES.map(c => (
                <button
                  key={c}
                  onClick={() => setSelectedCategory(c)}
                  className={`px-3 py-1.5 rounded-full font-black text-[9px] uppercase tracking-widest whitespace-nowrap transition-all ${
                    selectedCategory === c
                      ? 'bg-slate-900 text-white'
                      : 'bg-white border border-slate-200 text-slate-500 hover:border-emerald-400 hover:text-emerald-600'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
            <Loader2 className="animate-spin text-emerald-500" size={30} />
            <span className="text-[10px] font-black uppercase tracking-widest">Syncing Local Harvests...</span>
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map(item => (
              <ProduceCard
                key={item.id}
                item={item}
                onOrder={setSelectedItem}
                onViewSeller={setViewingSeller}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-20 text-center">
            <ShoppingCart size={36} className="mx-auto text-slate-200 mb-3" />
            <p className="text-slate-600 font-black text-lg mb-1">No Produce Found</p>
            <p className="text-slate-400 text-sm font-medium mb-5">
              Try adjusting your search or category.
            </p>
            <button
              onClick={() => { setSearchTerm(''); setSelectedCategory('All'); }}
              className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {viewingSeller && (
        <FarmerModal
          seller={viewingSeller}
          onClose={() => setViewingSeller(null)}
          onOrder={(item) => setSelectedItem(item)}
        />
      )}

      {selectedItem && (
        <OrderModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
};

export default Marketplace;