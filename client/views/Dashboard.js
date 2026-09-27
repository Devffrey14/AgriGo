import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, Cell
} from 'recharts';
import {
  Sprout, BarChart3, Package, LogOut, ShoppingCart,
  Settings, RefreshCcw, ScanLine, Info, MessageSquare, Search,
  Menu, X, TrendingUp, Clock, CheckCircle, Trash2, Lock, Upload,
  ChevronRight, Bell, AlertCircle, User, Phone, Activity,
  ImageIcon, Loader2, PlusCircle, XCircle, Table2, Grid3X3,
  ChevronLeft, Edit2, Save, Camera, ScanSearch, ArrowUpRight,
  ArrowDownRight, Calendar, CheckSquare, AlertTriangle, Heart,
  Microscope, BarChart2, Award, Download, DownloadCloud, UserMinus, ShieldAlert
} from 'lucide-react';

import Chatbot from '../components/Chatbot';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const SESSION_TIMEOUT_MS = 10 * 60 * 1000;
const WARNING_BEFORE_MS  =  2 * 60 * 1000;
const SYNC_INTERVAL_MS   =  5 * 60 * 1000;
const INV_PAGE_SIZE = 8;
const ORD_PAGE_SIZE = 8;
const LOG_PAGE_SIZE = 12;
const STATS_PAGE_SIZE = 4;
const BASE = 'http://localhost:5000';
const SESSION_KEY = 'agri_go_user';

const sanitize = s =>
  typeof s === 'string' ? s.replace(/[<>'";&]/g, '').trim().slice(0, 200) : '';

const saveSession = u => { try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(u)); } catch {} };
const clearSession = () => { try { sessionStorage.removeItem(SESSION_KEY); } catch {} };

const fmtDate = ts => {
  if (!ts) return '—';
  try {
    return new Date(ts).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  } catch { return '—'; }
};

const fmtShort = ts => {
  if (!ts) return '—';
  try {
    return new Date(ts).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  } catch { return '—'; }
};

// ─── SESSION HOOK ─────────────────────────────────────────────────────────────
const useSessionTimeout = (onTimeout, onWarn) => {
  const tRef = useRef(null);
  const wRef = useRef(null);

  const reset = useCallback(() => {
    clearTimeout(tRef.current);
    clearTimeout(wRef.current);
    wRef.current = setTimeout(onWarn, SESSION_TIMEOUT_MS - WARNING_BEFORE_MS);
    tRef.current = setTimeout(onTimeout, SESSION_TIMEOUT_MS);
  }, [onTimeout, onWarn]);

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];
    events.forEach(e => window.addEventListener(e, reset, { passive: true }));
    reset();

    return () => {
      events.forEach(e => window.removeEventListener(e, reset));
      clearTimeout(tRef.current);
      clearTimeout(wRef.current);
    };
  }, [reset]);
};

// ─── PAGINATION ───────────────────────────────────────────────────────────────
const Pagination = ({ page, total, pageSize, onChange }) => {
  const tp = Math.max(1, Math.ceil(total / pageSize));
  if (tp <= 1) return null;

  const pages = Array.from({ length: tp }, (_, i) => i + 1)
    .filter(p => p === 1 || p === tp || Math.abs(p - page) <= 1)
    .reduce((acc, p, i, arr) => {
      if (i > 0 && p - arr[i - 1] > 1) acc.push('…');
      acc.push(p);
      return acc;
    }, []);

  return (
    <div className="flex items-center justify-between mt-4 w-full">
      <span className="text-xs text-stone-400 font-medium">
        {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} of {total}
      </span>
      <div className="flex items-center gap-1">
        <PgBtn onClick={() => onChange(Math.max(1, page - 1))} disabled={page === 1}>
          <ChevronLeft size={13} />
        </PgBtn>
        {pages.map((p, i) =>
          p === '…'
            ? <span key={`e${i}`} className="w-7 h-7 flex items-center justify-center text-stone-400 text-xs">…</span>
            : <PgBtn key={p} onClick={() => onChange(p)} active={p === page}>{p}</PgBtn>
        )}
        <PgBtn onClick={() => onChange(Math.min(tp, page + 1))} disabled={page === tp}>
          <ChevronRight size={13} />
        </PgBtn>
      </div>
    </div>
  );
};

const PgBtn = ({ children, onClick, disabled, active }) => (
  <button onClick={onClick} disabled={disabled}
    className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-semibold transition-all
      ${active ? 'bg-emerald-600 text-white' : 'bg-white border border-stone-200 text-stone-600 hover:border-emerald-400 hover:text-emerald-600'}
      disabled:opacity-30 disabled:cursor-not-allowed`}>
    {children}
  </button>
);

// ─── CHART TOOLTIP ────────────────────────────────────────────────────────────
const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-stone-900 text-white px-3 py-2 rounded-xl shadow-xl text-xs border border-stone-700">
      <p className="text-stone-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || '#10b981' }} className="font-semibold">
          ₵{Number(p.value || 0).toLocaleString()}
        </p>
      ))}
    </div>
  );
};

// ─── BADGE ────────────────────────────────────────────────────────────────────
const Badge = ({ status }) => {
  const map = {
    Pending: 'bg-amber-50 text-amber-700 border-amber-200',
    Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
    'In Stock': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Low Stock': 'bg-amber-50 text-amber-700 border-amber-200',
    'Sold Out': 'bg-stone-100 text-stone-500 border-stone-200',
    Healthy: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Disease: 'bg-rose-50 text-rose-700 border-rose-200',
    Warning: 'bg-amber-50 text-amber-700 border-amber-200',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border ${map[status] || 'bg-stone-50 text-stone-600 border-stone-200'}`}>
      {status || '—'}
    </span>
  );
};

// ─── SESSION BANNER ───────────────────────────────────────────────────────────
const SessionBanner = ({ visible, onStay, onLeave }) => visible ? (
  <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[300] w-72">
    <div className="bg-stone-900 border border-stone-700 rounded-2xl p-4 shadow-2xl flex items-start gap-3">
      <div className="w-7 h-7 bg-amber-500/15 rounded-lg flex items-center justify-center shrink-0">
        <AlertCircle size={14} className="text-amber-400" />
      </div>
      <div className="flex-1">
        <p className="text-xs font-semibold text-white">Session expiring soon</p>
        <p className="text-[11px] text-stone-400 mt-0.5">Auto-logout in ~2 minutes</p>
        <div className="flex gap-2 mt-2.5">
          <button onClick={onStay} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold transition-colors">Stay in</button>
          <button onClick={onLeave} className="px-3 py-1.5 bg-stone-700 hover:bg-stone-600 text-stone-200 rounded-lg text-[11px] font-semibold transition-colors">Sign out</button>
        </div>
      </div>
    </div>
  </div>
) : null;

// ─── TOAST NOTIFICATIONS ──────────────────────────────────────────────────────
const NotifToast = ({ notifications, onDismiss }) => {
  if (!notifications.length) return null;
  return (
    <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 w-64">
      {notifications.slice(0, 3).map(n => (
        <div key={n.notifId}
          className="bg-white/95 backdrop-blur-sm border border-stone-200 rounded-xl p-3 shadow-lg flex items-start gap-2.5">
          <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0">
            <ShoppingCart size={12} className="text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-stone-900">New Order</p>
            <p className="text-[10px] text-stone-500 truncate">{n.buyer_name} · {n.produce_name}</p>
            <p className="text-[10px] font-semibold text-emerald-600">₵{n.total_price?.toLocaleString()}</p>
          </div>
          <button onClick={() => onDismiss(n.notifId)} className="text-stone-400 hover:text-stone-600 shrink-0">
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  );
};

// ─── EDIT MODAL ───────────────────────────────────────────────────────────────
const EditModal = ({ item, onClose, onSaved }) => {
  const [form, setForm] = useState({
    name: item.name || '', price: item.price || '', unit: item.unit || '',
    quantity: item.quantity || 0, category: item.category || 'Grains',
    contact: item.contact || '', location: item.location || ''
  });
  const [img, setImg] = useState(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, sanitize(String(v))));
      if (img) fd.append('image', img);
      const res = await fetch(`${BASE}/api/update-produce/${item.id}`, { method: 'PATCH', body: fd });
      if (res.ok) {
        onSaved();
        onClose();
      } else {
        alert('Update failed.');
      }
    } catch {
      alert('Server error.');
    } finally {
      setSaving(false);
    }
  };

  const iCls = "w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900 outline-none focus:border-emerald-500 focus:bg-white transition-all placeholder:text-stone-400";

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden border border-stone-200">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-100">
          <div>
            <p className="text-xs font-semibold text-stone-900">Edit Listing</p>
            <p className="text-[10px] text-stone-400 mt-0.5">{item.name}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-stone-100 text-stone-400 transition-colors">
            <X size={14} />
          </button>
        </div>
        <div className="p-5 space-y-3 max-h-[65vh] overflow-y-auto">
          <div className="flex gap-3 items-center">
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-stone-100 shrink-0 border border-stone-200">
              <img
                src={img ? URL.createObjectURL(img) : item.image_url}
                className="w-full h-full object-cover"
                alt=""
                onError={e => { e.target.src = 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=200'; }}
              />
            </div>
            <label className="flex-1 flex items-center gap-2 px-3 py-2 bg-stone-50 border border-dashed border-stone-300 rounded-lg cursor-pointer hover:bg-stone-100 transition-colors">
              <Upload size={12} className="text-stone-400 shrink-0" />
              <span className="text-[11px] text-stone-500 truncate">{img ? img.name : 'Change photo'}</span>
              <input type="file" accept="image/*" className="hidden" onChange={e => setImg(e.target.files[0])} />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              ['Name', 'name', 'text', 'col-span-2'],
              ['Price (₵)', 'price', 'number'],
              ['Qty', 'quantity', 'number'],
              ['Unit', 'unit', 'text'],
              ['Contact', 'contact', 'tel']
            ].map(([lbl, key, type, cls]) => (
              <div key={key} className={`flex flex-col gap-1 ${cls || ''}`}>
                <label className="text-[10px] font-semibold text-stone-500">{lbl}</label>
                <input
                  type={type}
                  value={form[key]}
                  onChange={e => setForm({ ...form, [key]: e.target.value })}
                  className={iCls}
                />
              </div>
            ))}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-stone-500">Category</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className={iCls}>
                {['Grains', 'Vegetables', 'Poultry', 'Livestock', 'Tubers'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="flex gap-2 px-5 py-3.5 border-t border-stone-100 bg-stone-50">
          <button onClick={onClose} className="flex-1 py-2 bg-white border border-stone-200 text-stone-600 rounded-lg text-[11px] font-semibold hover:bg-stone-100 transition-colors">
            Cancel
          </button>
          <button onClick={save} disabled={saving}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold transition-colors disabled:opacity-50">
            {saving ? <Loader2 className="animate-spin" size={12} /> : <Save size={12} />}
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── NAV BUTTON ───────────────────────────────────────────────────────────────
const NavBtn = ({ active, collapsed, icon, label, onClick, badge }) => (
  <button onClick={onClick} title={label}
    className={`w-full flex items-center rounded-xl text-[12px] font-medium transition-all duration-150 group
      ${collapsed ? 'p-2.5 justify-center' : 'px-3 py-2 gap-2.5'}
      ${active
        ? 'bg-emerald-600 text-white shadow-sm'
        : 'text-stone-500 hover:bg-stone-100 hover:text-stone-800'}`}>
    <span className={`shrink-0 ${active ? 'text-white' : 'text-stone-400 group-hover:text-stone-600 transition-colors'}`}>{icon}</span>
    {!collapsed && <span className="flex-1 text-left truncate">{label}</span>}
    {!collapsed && badge > 0 && (
      <span className="min-w-[16px] h-[16px] px-1 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
        {badge > 9 ? '9+' : badge}
      </span>
    )}
    {!collapsed && active && <ChevronRight size={12} className="ml-auto opacity-40" />}
  </button>
);

// ─── STAT CARD ────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, icon: Icon, iconBg, onClick, trend, trendUp }) => (
  <div onClick={onClick}
    className={`bg-white border border-stone-200 rounded-2xl p-4 transition-all duration-200 ${onClick ? 'cursor-pointer hover:border-emerald-300 hover:shadow-md hover:-translate-y-0.5' : ''}`}>
    <div className="flex items-start justify-between mb-3">
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white ${iconBg}`}>
        <Icon size={14} />
      </div>
      {trend && (
        <div className={`flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
          {trendUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
          {trend}
        </div>
      )}
    </div>
    <p className="text-xl font-bold text-stone-900 tracking-tight">{value}</p>
    <p className="text-[11px] text-stone-500 font-medium mt-0.5">{label}</p>
    {sub && <p className="text-[10px] text-stone-400 mt-0.5">{sub}</p>}
  </div>
);

// ─── FIELD ──────────────────────────────────────────────────────────────────
const Field = ({ label, children }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[10px] font-semibold text-stone-500 uppercase tracking-wide">{label}</label>
    {children}
  </div>
);

const fCls = "w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 outline-none focus:border-emerald-500 focus:bg-white transition-all placeholder:text-stone-400";

// ─── SYNC INDICATOR ─────────────────────────────────────────────────────────
const SyncStatus = ({ lastSync, nextSync }) => {
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, nextSync - Date.now());
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(`${m}:${String(s).padStart(2, '0')}`);
    };

    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [nextSync]);

  return (
    <div className="hidden lg:flex items-center gap-1.5 text-[10px] text-stone-400 font-medium">
      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
      <span>Next sync {countdown}</span>
    </div>
  );
};

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
const Dashboard = ({ user, onLogout, onNavigateToLogin }) => {
  const [tab, setTab] = useState('overview');
  const [chatOpen, setChatOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [addForm, setAddForm] = useState(false);
  const [sessWarn, setSessWarn] = useState(false);
  const [invView, setInvView] = useState('grid');
  const [invPage, setInvPage] = useState(1);
  const [ordPage, setOrdPage] = useState(1);
  const [logPage, setLogPage] = useState(1);
  const [editItem, setEditItem] = useState(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [lastSync, setLastSync] = useState(Date.now());
  const [nextSync, setNextSync] = useState(Date.now() + SYNC_INTERVAL_MS);
  
  // Analytics sub-tabs & timeframe states
  const [analyticsTab, setAnalyticsTab] = useState('business');
  const [businessTimeframe, setBusinessTimeframe] = useState('month');
  const [customBusinessDate, setCustomBusinessDate] = useState('');
  const [healthTimeframe, setHealthTimeframe] = useState('month');
  
  // Custom isolated pagination boundaries for sub-tabs to prevent Fab collision
  const [businessPage, setBusinessPage] = useState(1);
  const [healthPage, setHealthPage] = useState(1);

  // Verification states for delete sequence
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleteVerified, setIsDeleteVerified] = useState(false);

  const isPoultry = user?.farm_type === 'poultry';
  const prevIdsRef = useRef(new Set());

  // ── DATA STATE ─────────────────────────────────────────────────────────────
  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [chart, setChart] = useState([]);
  const [topProd, setTopProd] = useState([]);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ inventory_count: 0, inventory_value: 0, total_revenue: 0, pending_orders: 0 });
  const [notifs, setNotifs] = useState([]);
  const [allNotifs, setAllNotifs] = useState([]);
  const [scanHistory, setScanHistory] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('agri_scan_history') || '[]'); } catch { return []; }
  });

  // ── SCANNER ────────────────────────────────────────────────────────────────
  const [scanMode, setScanMode] = useState('upload');
  const [scanImg, setScanImg] = useState(null);
  const [scanPrev, setScanPrev] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanRes, setScanRes] = useState(null);
  const [camStream, setCamStream] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // ── SEARCH / SORT ──────────────────────────────────────────────────────────
  const [invSearch, setInvSearch] = useState('');
  const [ordSearch, setOrdSearch] = useState('');
  const [ordSort, setOrdSort] = useState('newest');
  const [logSearch, setLogSearch] = useState('');
  const [logSort, setLogSort] = useState('newest');
  const [logFilter, setLogFilter] = useState('all');
  const [settTab, setSettTab] = useState('profile');
  const [profForm, setProfForm] = useState({ fullname: user?.fullname || '', location: user?.location || '', phone: user?.phone || user?.telephone || '' });
  const [passForm, setPassForm] = useState({ old: '', new: '', confirm: '' });
  const [newProd, setNewProd] = useState({ name: '', price: '', unit: '', location: user?.location || '', category: 'Grains', image: null, contact: '', quantity: 0 });

  useEffect(() => { if (user) saveSession(user); }, [user]);

  const doLogout = useCallback(() => {
    clearSession();
    if (onNavigateToLogin) onNavigateToLogin();
    else if (onLogout) onLogout();
  }, [onLogout, onNavigateToLogin]);

  useSessionTimeout(
    useCallback(() => { setSessWarn(false); doLogout(); }, [doLogout]),
    useCallback(() => setSessWarn(true), [])
  );

  const sendSms = useCallback(async o => {
    const ph = user?.phone || user?.telephone;
    if (!ph) return;
    try {
      await fetch(`${BASE}/api/send-sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: ph,
          message: `New order: ${o.buyer_name} ordered ${o.produce_name} (₵${o.total_price}). Check dashboard.`,
          farmer_id: user.fullname,
          order_id: o.id
        })
      });
    } catch {}
  }, [user]);

  const fetchData = useCallback(async () => {
    if (!user?.fullname) return;
    setRefreshing(true);

    try {
      const n = encodeURIComponent(user.fullname);
      const rs = await Promise.allSettled([
        fetch(`${BASE}/api/my-produce/${n}`),
        fetch(`${BASE}/api/farmer-stats/${n}`),
        fetch(`${BASE}/api/farmer-orders/${n}`),
        fetch(`${BASE}/api/sales-chart/${n}`),
        fetch(`${BASE}/api/top-produce/${n}`),
        fetch(`${BASE}/api/audit-log/${n}`)
      ]);

      const parse = async r => (r.status === 'fulfilled' && r.value.ok) ? r.value.json().catch(() => null) : null;
      const [it, st, or, ch, tp, lg] = await Promise.all(rs.map(parse));

      setItems(Array.isArray(it) ? it : []);
      setStats(st && typeof st === 'object' ? st : { inventory_count: 0, inventory_value: 0, total_revenue: 0, pending_orders: 0 });
      setLogs(Array.isArray(lg) ? lg : []);
      setTopProd(Array.isArray(tp) ? tp : []);

      const normOrds = (Array.isArray(or) ? or : []).map(o => ({
        ...o,
        created_at: o.created_at || o.order_date || null,
        fulfilled_at: o.fulfilled_at || o.completed_at || (o.status === 'Completed' ? o.updated_at : null) || null,
        produce_name: o.produce_name || '—',
        buyer_name: o.buyer_name || '—',
        buyer_contact: o.buyer_contact || '—',
        quantity: o.quantity ?? '—',
        total_price: o.total_price ?? null,
        delivery_method: o.delivery_method || '—',
        status: o.status || 'Pending'
      }));
      setOrders(normOrds);

      const normChart = (Array.isArray(ch) ? ch : []).map(d => ({
        name: d.name || d.date || d.label || '',
        sales: Number(d.sales || d.revenue || d.total || 0),
        timestamp: d.timestamp || d.created_at || Date.now()
      }));
      setChart(normChart);

      const prevIds = prevIdsRef.current;
      if (normOrds.length) {
        const fresh = normOrds.filter(o => !prevIds.has(o.id));
        if (fresh.length && prevIds.size > 0) {
          const toasts = fresh.map(o => ({ ...o, notifId: `${Date.now()}-${o.id}` }));
          setNotifs(p => [...toasts, ...p]);
          setAllNotifs(p => [...toasts, ...p]);
          fresh.forEach(o => sendSms(o));
        }
        prevIdsRef.current = new Set(normOrds.map(o => o.id));
      }

      const now = Date.now();
      setLastSync(now);
      setNextSync(now + SYNC_INTERVAL_MS);
    } catch (e) {
      console.error('Fetch error:', e);
    } finally {
      setRefreshing(false);
    }
  }, [user?.fullname, sendSms]);

  useEffect(() => {
    fetchData();
    const iv = setInterval(fetchData, SYNC_INTERVAL_MS);
    return () => clearInterval(iv);
  }, [fetchData]);

  const stopCam = useCallback(() => {
    if (camStream) {
      camStream.getTracks().forEach(t => t.stop());
      setCamStream(null);
    }
  }, [camStream]);

  const startCam = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setCamStream(stream);
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      alert('Camera unavailable.');
      setScanMode('upload');
    }
  }, []);

  useEffect(() => {
    if (scanMode === 'camera') startCam();
    return stopCam;
  }, [scanMode, startCam, stopCam]);

  const capture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current;
    const c = canvasRef.current;
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext('2d').drawImage(v, 0, 0);
    c.toBlob(blob => {
      if (blob) {
        const file = new File([blob], 'cap.jpg', { type: 'image/jpeg' });
        setScanImg(file);
        if (scanPrev) URL.revokeObjectURL(scanPrev);
        setScanPrev(URL.createObjectURL(blob));
        setScanMode('upload');
        stopCam();
      }
    }, 'image/jpeg');
  };

  const selFile = e => {
    const f = e.target.files[0];
    if (!f) return;
    if (scanPrev) URL.revokeObjectURL(scanPrev);
    setScanImg(f);
    setScanPrev(URL.createObjectURL(f));
    setScanRes(null);
  };

  const clearScan = () => {
    if (scanPrev) URL.revokeObjectURL(scanPrev);
    setScanImg(null);
    setScanPrev(null);
    setScanRes(null);
  };

  const doScan = async () => {
    if (!scanImg) return;
    setScanning(true);
    setScanRes(null);
    const fd = new FormData();
    fd.append('image', scanImg);
    const ep = `${BASE}/api/${isPoultry ? 'identify-poultry' : 'identify-crops'}`;
    try {
      const r = await fetch(ep, { method: 'POST', body: fd });
      const result = await r.json();
      setScanRes(result);

      const entry = {
        id: Date.now(),
        date: new Date().toISOString(),
        condition: result.condition || 'Unknown',
        severity: result.severity || 'low',
        type: isPoultry ? 'poultry' : 'crop',
        advice: result.advice || '',
        confidence: result.confidence || '—'
      };
      const updated = [entry, ...scanHistory].slice(0, 50);
      setScanHistory(updated);
      try { sessionStorage.setItem('agri_scan_history', JSON.stringify(updated)); } catch {}
    } catch {
      alert('AI service unreachable.');
    } finally {
      setScanning(false);
    }
  };

  const doUpload = async () => {
    if (!newProd.image || !newProd.name || !newProd.price) {
      alert('Name, price, and image required.');
      return;
    }

    const fd = new FormData();
    Object.entries(newProd).forEach(([k, v]) => {
      if (k !== 'image') fd.append(k, sanitize(String(v)));
    });
    fd.append('image', newProd.image);
    fd.append('farmer_id', user.fullname);

    try {
      const res = await fetch(`${BASE}/api/add-produce`, { method: 'POST', body: fd });
      if (res.ok) {
        setAddForm(false);
        setNewProd({
          name: '',
          price: '',
          unit: '',
          location: user?.location || '',
          category: 'Grains',
          image: null,
          contact: '',
          quantity: 0
        });
        fetchData();
      } else {
        alert('Upload failed.');
      }
    } catch {
      alert('Server error.');
    }
  };

  const doDelete = async id => {
    if (!window.confirm('Remove this listing?')) return;
    try {
      const res = await fetch(`${BASE}/api/delete-produce/${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch {}
  };

  const doComplete = async id => {
    try {
      const res = await fetch(`${BASE}/api/complete-order/${id}`, { method: 'PATCH' });
      if (res.ok) fetchData();
    } catch {}
  };

  const doCancel = async id => {
    if (!window.confirm('Cancel this order?')) return;
    try {
      const res = await fetch(`${BASE}/api/cancel-order/${id}`, { method: 'PATCH' });
      if (res.ok) fetchData();
    } catch {}
  };

  const doSaveProf = async e => {
    e.preventDefault();
    try {
      const res = await fetch(`${BASE}/api/update-profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ farmer_id: user.fullname, ...profForm })
      });
      if (res.ok) alert('Profile saved.');
      else alert('Failed.');
    } catch {
      alert('Server error.');
    }
  };

  const doChangePass = async e => {
    e.preventDefault();
    if (passForm.new !== passForm.confirm) {
      alert('Passwords do not match.');
      return;
    }
    if (passForm.new.length < 6) {
      alert('Password too short.');
      return;
    }

    try {
      const res = await fetch(`${BASE}/api/change-password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmer_id: user.fullname,
          old_password: passForm.old,
          new_password: passForm.new
        })
      });
      if (res.ok) {
        alert('Password changed.');
        setPassForm({ old: '', new: '', confirm: '' });
      } else {
        alert('Incorrect current password.');
      }
    } catch {
      alert('Server error.');
    }
  };

  // ─── DATA EXPORT UTILITIES (FIXED DOCUMENT PREVIEW INTEGRATION) ──────────────
  const mockExportFile = (filename, columns, dataRows, formatType = 'csv') => {
    try {
      const headerRow = columns.join(',');
      const contentRows = dataRows.map(row => columns.map(col => `"${String(row[col] || '').replace(/"/g, '""')}"`).join(','));
      const outputData = [headerRow, ...contentRows].join('\n');
      
      if (formatType === 'pdf') {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
          alert('Popup blocker prevented document generation view.');
          return;
        }
        printWindow.document.write(`
          <html>
            <head>
              <title>${filename.replace('.pdf', '')}</title>
              <style>
                body { font-family: 'Georgia', serif; padding: 30px; color: #292524; background-color: #fafaf9; }
                h2 { color: #065f46; border-bottom: 2px solid #e7e5e4; padding-bottom: 8px; font-size: 20px; }
                p { font-size: 11px; color: #78716c; margin-bottom: 20px; }
                table { w-full; border-collapse: collapse; margin-top: 15px; font-size: 12px; }
                th { background-color: #f5f5f4; text-align: left; padding: 10px; font-weight: bold; border: 1px solid #e7e5e4; color: #57534e; text-transform: uppercase; font-size: 10px; }
                td { padding: 10px; border: 1px solid #e7e5e4; }
                tr:nth-child(even) { background-color: #fafaf9; }
              </style>
            </head>
            <body>
              <h2>${filename.replace('.pdf', '').replace(/_/g, ' ')}</h2>
              <p>Generated on ${new Date().toLocaleString('en-GB')}</p>
              <table>
                <thead>
                  <tr>${columns.map(c => `<th>${c.replace(/_/g, ' ')}</th>`).join('')}</tr>
                </thead>
                <tbody>
                  ${dataRows.map(row => `<tr>${columns.map(c => `<td>${row[c] !== null && row[c] !== undefined ? row[c] : '—'}</td>`).join('')}</tr>`).join('')}
                </tbody>
              </table>
              <script>window.print();</script>
            </body>
          </html>
        `);
        printWindow.document.close();
      } else {
        const blob = new Blob([outputData], { type: 'text/csv;charset=utf-8;' });
        const anchor = document.createElement('a');
        anchor.href = URL.createObjectURL(blob);
        anchor.setAttribute('download', filename);
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
      }
    } catch {
      alert('Failed to execute file stream output compilation.');
    }
  };

  // ─── BACKUP & RESTORE UTILITIES ─────────────────────────────────────────────
  const triggerDataBackup = () => {
    const dataSet = {
      systemSnapshot: 'AgriGo_Local_Vault_Snapshot',
      savedProduce: items,
      loggedOrders: orders,
      telemetryHistory: scanHistory,
      profileConfiguration: profForm
    };
    const payload = JSON.stringify(dataSet, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `AgriGo_Vault_Backup_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const processDataRestore = e => {
    const reader = new FileReader();
    const file = e.target.files[0];
    if (!file) return;

    reader.onload = event => {
      try {
        const payload = JSON.parse(event.target.result);
        if (payload.savedProduce) setItems(payload.savedProduce);
        if (payload.loggedOrders) setOrders(payload.loggedOrders);
        if (payload.telemetryHistory) {
          setScanHistory(payload.telemetryHistory);
          sessionStorage.setItem('agri_scan_history', JSON.stringify(payload.telemetryHistory));
        }
        if (payload.profileConfiguration) setProfForm(payload.profileConfiguration);
        alert('System configuration restored successfully.');
      } catch {
        alert('Invalid data block or corrupted file signature.');
      }
    };
    reader.readAsText(file);
  };

  const executeAccountDeletion = e => {
    e.preventDefault();
    if (deleteConfirmText !== user?.fullname) {
      alert('Verification failure. Text match expected.');
      return;
    }
    alert('Account removal command requested. Session terminating.');
    doLogout();
  };

  const go = t => { setTab(t); setMobileOpen(false); };

  const fItems = items.filter(i => !invSearch || (i.name || '').toLowerCase().includes(invSearch.toLowerCase()));
  const fOrders = [...orders]
    .filter(o => !ordSearch
      || (o.produce_name || '').toLowerCase().includes(ordSearch.toLowerCase())
      || (o.buyer_name || '').toLowerCase().includes(ordSearch.toLowerCase()))
    .sort((a, b) => {
      if (ordSort === 'newest') return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      if (ordSort === 'oldest') return new Date(a.created_at || 0) - new Date(b.created_at || 0);
      if (ordSort === 'value') return (b.total_price || 0) - (a.total_price || 0);
      return 0;
    });

  const fLogs = [...logs]
    .filter(l => {
      const q = logSearch.toLowerCase();
      return (logFilter === 'all' || l.type === logFilter) &&
        (!q || (l.action || '').toLowerCase().includes(q) || (l.details || '').toLowerCase().includes(q));
    })
    .sort((a, b) => logSort === 'newest'
      ? new Date(b.timestamp || 0) - new Date(a.timestamp || 0)
      : new Date(a.timestamp || 0) - new Date(b.timestamp || 0));

  const iItems = fItems.slice((invPage - 1) * INV_PAGE_SIZE, invPage * INV_PAGE_SIZE);
  const iOrders = fOrders.slice((ordPage - 1) * ORD_PAGE_SIZE, ORD_PAGE_SIZE * ordPage);
  const iLogs = fLogs.slice((logPage - 1) * LOG_PAGE_SIZE, logPage * LOG_PAGE_SIZE);
  const pending = orders.filter(o => o.status === 'Pending').length;
  const unread = notifs.filter(n => !n.read).length;

  useEffect(() => setInvPage(1), [invSearch]);
  useEffect(() => setOrdPage(1), [ordSearch, ordSort]);
  useEffect(() => setLogPage(1), [logSearch, logSort, logFilter]);

  // ─── TIMEFRAME PARSING CALCULATORS ──────────────────────────────────────────
  const verifyTimeframeMatch = (targetDate, filterType, customSelectedDate = '') => {
    if (!targetDate) return false;
    
    // Explicit single calendar date sorting filter matching hook
    if (customSelectedDate) {
      const targetShortStr = new Date(targetDate).toISOString().slice(0, 10);
      return targetShortStr === customSelectedDate;
    }

    const recordTime = new Date(targetDate).getTime();
    const now = Date.now();
    if (isNaN(recordTime)) return true;
    
    switch(filterType) {
      case 'day': return (now - recordTime) <= 24 * 60 * 60 * 1000;
      case 'week': return (now - recordTime) <= 7 * 24 * 60 * 60 * 1000;
      case 'month': return (now - recordTime) <= 30 * 24 * 60 * 60 * 1000;
      case 'year': return (now - recordTime) <= 365 * 24 * 60 * 60 * 1000;
      default: return true;
    }
  };

  const filteredBusinessOrders = useMemo(() => {
    return orders.filter(o => verifyTimeframeMatch(o.created_at, businessTimeframe, customBusinessDate));
  }, [orders, businessTimeframe, customBusinessDate]);

  const sortedBusinessStats = useMemo(() => {
    const completed = filteredBusinessOrders.filter(o => o.status === 'Completed');
    const totalRev = completed.reduce((sum, o) => sum + (Number(o.total_price) || 0), 0);
    
    const countMap = {};
    completed.forEach(o => {
      if(o.produce_name) countMap[o.produce_name] = (countMap[o.produce_name] || 0) + 1;
    });
    
    let bestItem = '—';
    let macroCount = 0;
    Object.entries(countMap).forEach(([name, count]) => {
      if(count > macroCount) {
        macroCount = count;
        bestItem = name;
      }
    });

    return { totalRev, bestItem };
  }, [filteredBusinessOrders]);

  const pagedBusinessOrders = useMemo(() => {
    return filteredBusinessOrders.slice((businessPage - 1) * STATS_PAGE_SIZE, businessPage * STATS_PAGE_SIZE);
  }, [filteredBusinessOrders, businessPage]);

  // FIX: Isolate farm health telemetry scanning vectors by user farm type context profile matching signature rules
  const filteredHealthScans = useMemo(() => {
    const requiredType = isPoultry ? 'poultry' : 'crop';
    return scanHistory.filter(s => s.type === requiredType && verifyTimeframeMatch(s.date, healthTimeframe));
  }, [scanHistory, healthTimeframe, isPoultry]);

  const sortedHealthStats = useMemo(() => {
    const localTotal = filteredHealthScans.length;
    if (!localTotal) return { rate: 0, statusLabel: 'No Scans Map' };
    const healthyCount = filteredHealthScans.filter(s => (s.condition || '').toLowerCase().includes('healthy')).length;
    const computedRate = Math.round((healthyCount / localTotal) * 100);
    
    let statusLabel = 'High Concern';
    if (computedRate >= 70) statusLabel = 'Good Health';
    else if (computedRate >= 40) statusLabel = 'Moderate Risk';

    return { rate: computedRate, statusLabel };
  }, [filteredHealthScans]);

  const pagedHealthScans = useMemo(() => {
    return filteredHealthScans.slice((healthPage - 1) * STATS_PAGE_SIZE, healthPage * STATS_PAGE_SIZE);
  }, [filteredHealthScans, healthPage]);

  const analyticsScanHealth = useMemo(() => {
    const requiredType = isPoultry ? 'poultry' : 'crop';
    const localizedScans = scanHistory.filter(s => s.type === requiredType);
    const total = localizedScans.length;
    if (!total) return null;
    const healthy = localizedScans.filter(s => (s.condition || '').toLowerCase().includes('healthy')).length;
    const diseased = localizedScans.filter(s => s.severity === 'high').length;
    const medium = localizedScans.filter(s => s.severity === 'medium').length;
    const low = total - healthy - diseased - medium;
    return { total, healthy, diseased, medium, low: Math.max(0, low), rate: Math.round((healthy / total) * 100) };
  }, [scanHistory, isPoultry]);

  const analyticsProduce = useMemo(() => {
    if (!topProd.length) return null;
    const total = topProd.reduce((sum, p) => sum + (p.revenue || 0), 0);
    return topProd.slice(0, 5).map(p => ({
      ...p,
      share: total ? Math.round(((p.revenue || 0) / total) * 100) : 0
    }));
  }, [topProd]);

  const analyticsOrdersMetrics = useMemo(() => {
    if (!orders.length) return null;
    const completed = orders.filter(o => o.status === 'Completed').length;
    const cancelled = orders.filter(o => o.status === 'Cancelled').length;
    const totalRev = orders.filter(o => o.status === 'Completed').reduce((sum, o) => sum + (o.total_price || 0), 0);
    const avgOrder = completed ? Math.round(totalRev / completed) : 0;
    return { total: orders.length, completed, cancelled, pending, totalRev, avgOrder };
  }, [orders, pending]);

  const NAV = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 size={15} /> },
    { id: 'scanner', label: 'AI Scanner', icon: <ScanSearch size={15} /> },
    { id: 'inventory', label: 'Marketplace', icon: <Package size={15} /> },
    { id: 'orders', label: 'Orders', icon: <ShoppingCart size={15} />, badge: pending },
    { id: 'analytics', label: 'Analytics', icon: <BarChart2 size={15} /> },
    { id: 'audit', label: 'Audit Log', icon: <Activity size={15} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={15} /> },
  ];

  return (
    <div className="h-screen bg-stone-50 flex overflow-hidden antialiased"
      style={{ fontFamily: "'Georgia', 'Palatino', 'Times New Roman', serif" }}>

      <SessionBanner visible={sessWarn} onStay={() => setSessWarn(false)} onLeave={doLogout} />
      <NotifToast notifications={notifs} onDismiss={id => setNotifs(p => p.filter(n => n.notifId !== id))} />
      {editItem && <EditModal item={editItem} onClose={() => setEditItem(null)} onSaved={fetchData} />}

      {mobileOpen && <div className="fixed inset-0 bg-stone-900/30 backdrop-blur-sm z-[90] md:hidden" onClick={() => setMobileOpen(false)} />}

      <div className="fixed top-0 inset-x-0 h-13 bg-white/90 backdrop-blur-sm border-b border-stone-200 flex items-center justify-between px-4 z-[70] md:hidden" style={{ height: 50 }}>
        <button onClick={() => setMobileOpen(true)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-stone-100 text-stone-600">
          <Menu size={17} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-emerald-600 rounded-lg flex items-center justify-center"><Sprout size={12} className="text-white" /></div>
          <span className="font-semibold text-sm text-stone-900" style={{ fontFamily: 'Georgia,serif' }}>Agri-Go</span>
        </div>
        <button onClick={() => setNotifOpen(!notifOpen)} className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-stone-100 text-stone-600">
          <Bell size={16} />
          {unread > 0 && <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-rose-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">{unread}</span>}
        </button>
      </div>

      <aside className={`
        fixed inset-y-0 left-0 z-[100] bg-white border-r border-stone-200 flex flex-col
        transition-all duration-200 shadow-lg md:shadow-none
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:sticky md:top-0 md:h-screen md:flex-shrink-0
        ${collapsed ? 'md:w-[56px]' : 'md:w-52'}
      `}>
        <div className="flex items-center justify-between px-3 py-3.5 border-b border-stone-100 shrink-0">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center shadow-sm">
                <Sprout size={13} className="text-white" />
              </div>
              <span className="font-bold text-sm text-stone-900" style={{ fontFamily: 'Georgia,serif' }}>Agri-Go</span>
            </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className="hidden md:flex w-7 h-7 items-center justify-center rounded-lg hover:bg-stone-100 text-stone-400 transition-colors ml-auto">
            {collapsed ? <ChevronRight size={13} /> : <X size={13} />}
          </button>
          <button onClick={() => setMobileOpen(false)} className="md:hidden w-7 h-7 flex items-center justify-center rounded-lg hover:bg-stone-100 text-stone-400">
            <X size={15} />
          </button>
        </div>

        {!collapsed && (
          <div className="mx-2.5 mt-3 mb-2 p-2.5 bg-emerald-50/60 border border-emerald-100 rounded-xl">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center font-bold text-white text-xs shrink-0">
                {user?.fullname?.charAt(0)?.toUpperCase() || 'F'}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-stone-800 truncate leading-tight">{user?.fullname?.split(' ')[0] || 'Farmer'}</p>
                <p className="text-[10px] text-stone-400 capitalize">{user?.farm_type} Farm</p>
              </div>
            </div>
          </div>
        )}

        <nav className="flex-1 px-2 py-1.5 space-y-0.5 overflow-y-auto">
          {NAV.map(n => (
            <NavBtn
              key={n.id}
              active={tab === n.id}
              collapsed={collapsed}
              icon={n.icon}
              label={n.label}
              badge={n.badge}
              onClick={() => go(n.id)}
            />
          ))}
          <div className="border-t border-stone-100 pt-1.5 mt-1">
            <NavBtn active={false} collapsed={collapsed} icon={<LogOut size={15} />} label="Sign Out" onClick={doLogout} />
          </div>
        </nav>

        {!collapsed && (
          <div className="mx-2.5 mb-2.5 flex items-center gap-2 px-2.5 py-1.5 bg-stone-50 rounded-xl border border-stone-100 shrink-0">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shrink-0" />
            <span className="text-[9px] text-stone-400 font-medium uppercase tracking-wider">Active</span>
          </div>
        )}
      </aside>

      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <header className="shrink-0 bg-white/90 backdrop-blur-sm border-b border-stone-200 px-4 md:px-5 flex items-center justify-between gap-3 z-30"
          style={{ paddingTop: 50, paddingBottom: 0 }}>
          <div className="hidden md:block py-3" style={{ paddingTop: 0 }}>
            <p className="text-[9px] text-stone-400 font-medium uppercase tracking-wider">{user?.farm_type} Farm</p>
            <h1 className="text-sm font-semibold text-stone-900 leading-tight" style={{ fontFamily: 'Georgia,serif' }}>
              {NAV.find(n => n.id === tab)?.label}
            </h1>
          </div>
          <div className="md:hidden py-2">
            <h1 className="text-xs font-semibold text-stone-900" style={{ fontFamily: 'Georgia,serif' }}>
              {NAV.find(n => n.id === tab)?.label}
            </h1>
          </div>

          <div className="flex items-center gap-2 ml-auto py-2.5">
            <SyncStatus lastSync={lastSync} nextSync={nextSync} />

            <div className="relative">
              <button onClick={() => setNotifOpen(!notifOpen)}
                className="relative w-8 h-8 flex items-center justify-center rounded-xl bg-white border border-stone-200 text-stone-500 hover:border-emerald-400 hover:text-emerald-600 transition-all">
                <Bell size={14} />
                {unread > 0 && <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-rose-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">{unread}</span>}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-72 bg-white border border-stone-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-stone-100 bg-stone-50/50">
                    <h3 className="text-xs font-semibold text-stone-800">Notifications</h3>
                    {allNotifs.length > 0 && (
                      <button onClick={() => setAllNotifs([])} className="text-[10px] text-emerald-600 hover:underline font-medium">Clear all</button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-stone-50">
                    {allNotifs.length > 0 ? allNotifs.map((n, i) => (
                      <div key={n.notifId || i} className="flex items-start gap-2.5 px-4 py-2.5 hover:bg-stone-50 transition-colors">
                        <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                          <ShoppingCart size={12} className="text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-semibold text-stone-900">New Order</p>
                          <p className="text-[10px] text-stone-500 truncate">{n.buyer_name} · {n.produce_name}</p>
                          <p className="text-[10px] font-semibold text-emerald-600">₵{n.total_price?.toLocaleString()}</p>
                        </div>
                      </div>
                    )) : (
                      <div className="py-8 text-center">
                        <Bell size={18} className="mx-auto text-stone-300 mb-1.5" />
                        <p className="text-xs text-stone-400">No notifications yet</p>
                      </div>
                    )}
                  </div>
                  {pending > 0 && (
                    <div className="px-4 py-2.5 border-t border-stone-100">
                      <button onClick={() => { go('orders'); setNotifOpen(false); }}
                        className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors">
                        View {pending} pending order{pending > 1 ? 's' : ''}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button onClick={fetchData} disabled={refreshing}
              className="flex items-center gap-1.5 bg-white border border-stone-200 px-2.5 py-1.5 rounded-xl text-[11px] font-medium text-stone-600 hover:border-emerald-400 hover:text-emerald-600 transition-all disabled:opacity-50">
              <RefreshCcw size={12} className={refreshing ? 'animate-spin text-emerald-600' : ''} />
              <span className="hidden sm:inline">{refreshing ? 'Syncing…' : 'Sync'}</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto" onClick={() => notifOpen && setNotifOpen(false)}>
          <div className="px-4 md:px-5 py-4 pb-20 md:pb-6 space-y-4 max-w-[1400px] mx-auto">

            {tab === 'overview' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="bg-emerald-700 rounded-2xl px-5 py-4 flex items-center justify-between relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute -right-6 -top-6 w-32 h-32 bg-emerald-300 rounded-full" />
                    <div className="absolute -left-3 -bottom-4 w-24 h-24 bg-emerald-300 rounded-full" />
                  </div>
                  <div className="relative z-10">
                    <p className="text-[10px] text-emerald-200 font-medium uppercase tracking-wider mb-1">Welcome back</p>
                    <h2 className="text-lg font-bold text-white" style={{ fontFamily: 'Georgia,serif' }}>
                      {user?.fullname?.split(' ')[0] || 'Farmer'}
                    </h2>
                    <p className="text-xs text-emerald-200 mt-0.5 capitalize">{user?.farm_type} Farm Dashboard</p>
                  </div>
                  <div className="relative z-10 w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center font-bold text-white text-lg backdrop-blur-sm">
                    {user?.fullname?.charAt(0)?.toUpperCase() || 'F'}
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <StatCard label="Total Revenue" value={`₵${(stats.total_revenue || 0).toLocaleString()}`} icon={TrendingUp} iconBg="bg-emerald-600" trend="+12%" trendUp />
                  <StatCard label="Items in Stock" value={stats.inventory_count || 0} icon={Package} iconBg="bg-stone-700" sub="Active listings" onClick={() => go('inventory')} />
                  <StatCard label="Stock Value" value={`₵${(stats.inventory_value || 0).toLocaleString()}`} icon={BarChart3} iconBg="bg-stone-600" onClick={() => go('inventory')} />
                  <StatCard label="Pending Orders" value={stats.pending_orders || 0} icon={Clock} iconBg={stats.pending_orders > 0 ? 'bg-amber-500' : 'bg-stone-400'} sub={stats.pending_orders > 0 ? 'Needs action' : 'All clear'} onClick={() => go('orders')} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2 bg-white border border-stone-200 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xs font-semibold text-stone-800" style={{ fontFamily: 'Georgia,serif' }}>Revenue Over Time</h3>
                        <p className="text-[10px] text-stone-400 mt-0.5">From completed orders · ₵Ghana Cedis</p>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-stone-500 bg-stone-50 px-2 py-1 rounded-lg border border-stone-100">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                        Revenue
                      </div>
                    </div>
                    {chart.length > 0 ? (
                      <div className="h-40">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chart} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                            <defs>
                              <linearGradient id="emeraldGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.18} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false}
                              tick={{ fontSize: 9, fill: '#a8a29e', fontFamily: 'Georgia,serif' }} />
                            <YAxis axisLine={false} tickLine={false}
                              tick={{ fontSize: 9, fill: '#a8a29e' }}
                              tickFormatter={v => v >= 1000 ? `₵${(v / 1000).toFixed(0)}k` : `₵${v}`} />
                            <Tooltip content={<ChartTip />} />
                            <Area type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={2}
                              fill="url(#emeraldGrad)" dot={false}
                              activeDot={{ r: 4, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-40 flex flex-col items-center justify-center text-stone-300 border-2 border-dashed border-stone-100 rounded-xl">
                        <BarChart3 size={22} className="mb-2" />
                        <p className="text-[11px] font-medium text-stone-400">No sales data yet</p>
                        <p className="text-[10px] text-stone-300 mt-0.5">Complete orders will appear here</p>
                      </div>
                    )}
                  </div>

                  <div className="bg-white border border-stone-200 rounded-2xl p-4">
                    <div className="mb-4">
                      <h3 className="text-xs font-semibold text-stone-800" style={{ fontFamily: 'Georgia,serif' }}>Top Produce</h3>
                      <p className="text-[10px] text-stone-400 mt-0.5">By revenue earned</p>
                    </div>
                    {topProd.length > 0 ? (
                      <div className="h-40">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={topProd.slice(0, 5)} layout="vertical" margin={{ left: -5, right: 8, top: 2, bottom: 2 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f5f5f4" />
                            <XAxis type="number" axisLine={false} tickLine={false}
                              tick={{ fontSize: 9, fill: '#a8a29e' }}
                              tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false}
                              tick={{ fontSize: 9, fill: '#57534e', fontFamily: 'Georgia,serif' }} width={52} />
                            <Tooltip content={<ChartTip />} />
                            <Bar dataKey="revenue" radius={[0, 5, 5, 0]}>
                              {topProd.map((_, i) => <Cell key={i} fill={i === 0 ? '#059669' : i === 1 ? '#10b981' : '#a7f3d0'} />)}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-40 flex flex-col items-center justify-center text-stone-300 border-2 border-dashed border-stone-100 rounded-xl">
                        <BarChart3 size={22} className="mb-2" />
                        <p className="text-[11px] text-stone-400">No data yet</p>
                      </div>
                    )}
                  </div>
                </div>

                {topProd.length > 0 && (
                  <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-stone-100">
                      <h3 className="text-xs font-semibold text-stone-800" style={{ fontFamily: 'Georgia,serif' }}>Best Performing Produce</h3>
                      <p className="text-[10px] text-stone-400 mt-0.5">Ranked by total revenue</p>
                    </div>
                    <div className="divide-y divide-stone-50">
                      {topProd.slice(0, 5).map((p, i) => (
                        <div key={i} className="flex items-center gap-3 px-4 py-2.5 hover:bg-stone-50 transition-colors">
                          <div className={`w-5 h-5 rounded-lg flex items-center justify-center text-[9px] font-bold text-white shrink-0 ${i === 0 ? 'bg-emerald-600' : i === 1 ? 'bg-emerald-500' : 'bg-stone-400'}`}>{i + 1}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-stone-800 truncate">{p.name}</p>
                            <p className="text-[10px] text-stone-400">{p.units_sold} units sold</p>
                          </div>
                          <p className="text-xs font-semibold text-stone-800">₵{p.revenue?.toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {tab === 'scanner' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-in fade-in duration-200">
                <div className="bg-stone-900 rounded-2xl p-4 flex flex-col gap-3 border border-stone-800">
                  <div>
                    <p className="text-[9px] text-emerald-400 font-medium uppercase tracking-widest mb-1">AI Detection Engine</p>
                    <h3 className="text-sm font-semibold text-white" style={{ fontFamily: 'Georgia,serif' }}>
                      {isPoultry ? 'Poultry Health Scan' : 'Crop Disease Scan'}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1 bg-stone-800 rounded-xl p-1">
                    {[['upload', 'Upload', <ImageIcon size={12} />], ['camera', 'Camera', <Camera size={12} />]].map(([m, l, ic]) => (
                      <button
                        key={m}
                        onClick={() => { setScanMode(m); clearScan(); }}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-medium transition-all ${scanMode === m ? 'bg-white text-stone-900' : 'text-stone-400 hover:text-white'}`}
                      >
                        {ic}{l}
                      </button>
                    ))}
                  </div>

                  {scanMode === 'upload' && (
                    <div className="relative rounded-xl overflow-hidden bg-stone-950 border border-stone-800 flex items-center justify-center" style={{ minHeight: 180 }}>
                      {scanPrev ? (
                        <>
                          <img src={scanPrev} alt="Sample" className={`max-w-full ${scanning ? 'opacity-30 animate-pulse' : ''}`}
                            style={{ objectFit: 'contain', maxHeight: 220, display: 'block' }} />
                          {scanning && <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="animate-spin text-emerald-400" size={28} /></div>}
                          <button onClick={clearScan} className="absolute top-2.5 right-2.5 w-7 h-7 bg-stone-900/80 hover:bg-rose-600 rounded-full flex items-center justify-center text-white transition-colors"><X size={12} /></button>
                        </>
                      ) : (
                        <label className="flex flex-col items-center justify-center cursor-pointer py-10 text-stone-500 hover:text-stone-300 transition-colors">
                          <Upload size={22} className="mb-2" />
                          <span className="text-xs font-medium">Select image</span>
                          <input type="file" accept="image/*" className="hidden" onChange={selFile} />
                        </label>
                      )}
                    </div>
                  )}

                  {scanMode === 'camera' && (
                    <div className="relative rounded-xl overflow-hidden bg-black flex items-center justify-center border border-stone-800" style={{ minHeight: 180 }}>
                      <video ref={videoRef} autoPlay playsInline className="max-w-full" style={{ objectFit: 'contain', maxHeight: 220, display: 'block' }} />
                      <canvas ref={canvasRef} className="hidden" />
                      <button onClick={capture} className="absolute bottom-3 left-1/2 -translate-x-1/2 w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-xl active:scale-90 transition-all">
                        <Camera size={17} className="text-stone-900" />
                      </button>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button onClick={doScan} disabled={!scanImg || scanning}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-xs text-white bg-emerald-600 hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                      {scanning ? <><Loader2 className="animate-spin" size={13} /> Analysing…</> : <><ScanLine size={13} /> Run Scan</>}
                    </button>
                    {(scanPrev || scanRes) && (
                      <button onClick={clearScan} className="px-3 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 rounded-xl text-xs font-medium transition-colors">Clear</button>
                    )}
                  </div>
                </div>

                <div className="bg-white border border-stone-200 rounded-2xl p-4 flex flex-col">
                  <div className="flex items-center gap-2.5 mb-3 pb-3 border-b border-stone-100">
                    <div className="w-8 h-8 bg-stone-100 rounded-xl flex items-center justify-center"><Info size={14} className="text-stone-500" /></div>
                    <div>
                      <h3 className="text-xs font-semibold text-stone-800" style={{ fontFamily: 'Georgia,serif' }}>Diagnostic Result</h3>
                      <p className="text-[10px] text-stone-400 mt-0.5">AI-powered analysis</p>
                    </div>
                  </div>
                  {scanRes ? (
                    <div className="space-y-2.5 animate-in fade-in duration-200 flex-1">
                      <div className={`p-3.5 rounded-xl border ${isPoultry ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'}`}>
                        <p className="text-[9px] font-semibold uppercase tracking-wider opacity-60 mb-1">Classification</p>
                        <h4 className="text-sm font-bold" style={{ fontFamily: 'Georgia,serif' }}>{scanRes.condition}</h4>
                        {scanRes.confidence && <p className="text-[10px] opacity-60 mt-1">Confidence: {scanRes.confidence}</p>}
                      </div>
                      <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200">
                        <p className="text-[9px] font-semibold uppercase tracking-wider text-stone-400 mb-1.5">Recommendation</p>
                        <p className="text-xs text-stone-700 leading-relaxed">{scanRes.advice}</p>
                      </div>
                      {scanRes.severity && (
                        <div className={`px-3 py-2 rounded-xl border text-[10px] font-semibold uppercase tracking-wide ${scanRes.severity === 'high' ? 'bg-rose-50 border-rose-200 text-rose-700' : scanRes.severity === 'medium' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                          Severity: {scanRes.severity}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-stone-300 py-10">
                      <ScanSearch size={26} className="mb-2" />
                      <p className="text-xs text-stone-400 font-medium">Upload or capture a sample to begin</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {tab === 'inventory' && (
              <div className="space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-stone-900" style={{ fontFamily: 'Georgia,serif' }}>{items.length} listing{items.length !== 1 ? 's' : ''}</h3>
                    <p className="text-[10px] text-stone-400 mt-0.5">Your marketplace catalog</p>
                  </div>
                  <button onClick={() => setAddForm(!addForm)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${addForm ? 'bg-stone-100 text-stone-700 hover:bg-stone-200' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'}`}>
                    {addForm ? <X size={12} /> : <PlusCircle size={12} />}
                    {addForm ? 'Cancel' : 'Add Item'}
                  </button>
                </div>

                {addForm && (
                  <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="px-4 py-3 border-b border-stone-100 bg-stone-50">
                      <h3 className="text-xs font-semibold text-stone-800" style={{ fontFamily: 'Georgia,serif' }}>New Listing</h3>
                    </div>
                    <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="col-span-2 sm:col-span-3">
                        <Field label="Product Name">
                          <input type="text" value={newProd.name} onChange={e => setNewProd({ ...newProd, name: sanitize(e.target.value) })} placeholder="e.g. Fresh Maize" className={fCls} />
                        </Field>
                      </div>
                      <Field label="Price (₵)">
                        <input type="number" value={newProd.price} onChange={e => setNewProd({ ...newProd, price: e.target.value })} placeholder="0.00" className={fCls} />
                      </Field>
                      <Field label="Quantity">
                        <input type="number" value={newProd.quantity} onChange={e => setNewProd({ ...newProd, quantity: e.target.value })} placeholder="0" className={fCls} />
                      </Field>
                      <Field label="Unit">
                        <input type="text" value={newProd.unit} onChange={e => setNewProd({ ...newProd, unit: sanitize(e.target.value) })} placeholder="kg, bag…" className={fCls} />
                      </Field>
                      <Field label="Category">
                        <select value={newProd.category} onChange={e => setNewProd({ ...newProd, category: e.target.value })} className={fCls}>
                          {['Grains', 'Vegetables', 'Poultry', 'Livestock', 'Tubers'].map(c => <option key={c}>{c}</option>)}
                        </select>
                      </Field>
                      <Field label="Contact">
                        <input type="tel" value={newProd.contact} onChange={e => setNewProd({ ...newProd, contact: sanitize(e.target.value) })} placeholder="0540000000" className={fCls} />
                      </Field>
                      <div className="col-span-2 sm:col-span-3">
                        <Field label="Product Image">
                          <label className="flex items-center gap-2.5 px-3 py-2.5 bg-stone-50 border border-dashed border-stone-300 rounded-xl cursor-pointer hover:bg-stone-100 hover:border-emerald-400 transition-all">
                            <Upload size={13} className="text-stone-400 shrink-0" />
                            <span className="text-xs text-stone-500 truncate flex-1">{newProd.image ? newProd.image.name : 'Click to upload photo'}</span>
                            {newProd.image && <img src={URL.createObjectURL(newProd.image)} className="w-8 h-8 rounded-lg object-cover shrink-0" alt="" />}
                            <input type="file" accept="image/*" className="hidden" onChange={e => setNewProd({ ...newProd, image: e.target.files[0] })} />
                          </label>
                        </Field>
                      </div>
                      <div className="col-span-2 sm:col-span-3">
                        <button onClick={doUpload} className="w-full flex items-center justify-center gap-2 bg-stone-900 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-xs font-semibold transition-colors">
                          <Upload size={12} /> Publish to Marketplace
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <div className="relative w-44 shrink-0">
                    <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                    <input type="text" placeholder="Search…" value={invSearch} onChange={e => setInvSearch(e.target.value)}
                      className="w-full pl-8 pr-6 py-2 bg-white border border-stone-200 rounded-xl text-xs placeholder:text-stone-400 outline-none focus:border-emerald-400 transition-all" />
                    {invSearch && <button onClick={() => setInvSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400"><X size={11} /></button>}
                  </div>
                  <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-xl p-1">
                    <button onClick={() => setInvView('grid')} className={`p-1.5 rounded-lg transition-all ${invView === 'grid' ? 'bg-stone-900 text-white' : 'text-stone-400 hover:text-stone-700'}`}><Grid3X3 size={13} /></button>
                    <button onClick={() => setInvView('table')} className={`p-1.5 rounded-lg transition-all ${invView === 'table' ? 'bg-stone-900 text-white' : 'text-stone-400 hover:text-stone-700'}`}><Table2 size={13} /></button>
                  </div>
                  <span className="text-[10px] text-stone-400 font-medium ml-auto">{fItems.length} result{fItems.length !== 1 ? 's' : ''}</span>
                </div>

                {invView === 'grid' && (
                  iItems.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                      {iItems.map(item => {
                        const sold = !item.quantity || item.quantity === 0;
                        const low = item.quantity > 0 && item.quantity < 5;
                        return (
                          <div key={item.id} className={`group bg-white rounded-2xl border overflow-hidden transition-all hover:shadow-md ${sold ? 'opacity-60 border-stone-200' : low ? 'border-amber-200' : 'border-stone-200 hover:border-emerald-300'}`}>
                            <div className="h-24 relative overflow-hidden bg-stone-100">
                              <img src={item.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={item.name}
                                onError={e => { e.target.src = 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400'; }} />
                              <span className={`absolute top-2 right-2 px-1.5 py-0.5 rounded-md text-[9px] font-bold text-white ${sold ? 'bg-stone-700' : low ? 'bg-amber-500' : 'bg-emerald-600'}`}>
                                {sold ? 'Out' : item.quantity}
                              </span>
                            </div>
                            <div className="p-2.5">
                              <h4 className="text-[11px] font-semibold text-stone-800 truncate mb-0.5">{item.name}</h4>
                              <p className={`text-[10px] font-medium mb-2 ${sold ? 'text-stone-400' : low ? 'text-amber-600' : 'text-emerald-600'}`}>
                                {sold ? 'Sold out' : `${item.quantity} ${item.unit || 'units'}`}
                              </p>
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-bold text-stone-900">₵{item.price}</p>
                                <div className="flex items-center gap-0.5">
                                  <button onClick={() => setEditItem(item)} className="w-5 h-5 flex items-center justify-center text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-all"><Edit2 size={10} /></button>
                                  <button onClick={() => doDelete(item.id)} className="w-5 h-5 flex items-center justify-center text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all"><Trash2 size={10} /></button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-white border-2 border-dashed border-stone-200 rounded-2xl py-12 text-center">
                      <Package size={24} className="mx-auto text-stone-200 mb-2" />
                      <p className="text-xs text-stone-400">{invSearch ? 'No items match' : 'No produce listed yet'}</p>
                    </div>
                  )
                )}

                {invView === 'table' && (
                  <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left" style={{ minWidth: 460 }}>
                        <thead>
                          <tr className="border-b border-stone-100 bg-stone-50">
                            {['', 'Name', 'Category', 'Price', 'Stock', ''].map((h, i) => (
                              <th key={i} className="px-3.5 py-2.5 text-[10px] font-semibold text-stone-400 uppercase tracking-wider">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-50">
                          {iItems.length > 0 ? iItems.map(item => {
                            const sold = !item.quantity || item.quantity === 0;
                            const low = item.quantity > 0 && item.quantity < 5;
                            return (
                              <tr key={item.id} className="hover:bg-stone-50 transition-colors">
                                <td className="px-3.5 py-2.5">
                                  <div className="w-8 h-8 rounded-xl overflow-hidden bg-stone-100">
                                    <img src={item.image_url} className="w-full h-full object-cover" alt=""
                                      onError={e => { e.target.src = 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=100'; }} />
                                  </div>
                                </td>
                                <td className="px-3.5 py-2.5 text-xs font-medium text-stone-800">{item.name}</td>
                                <td className="px-3.5 py-2.5">
                                  <span className="text-[10px] text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded-md">{item.category || '—'}</span>
                                </td>
                                <td className="px-3.5 py-2.5 text-xs font-semibold text-stone-900">₵{item.price}</td>
                                <td className="px-3.5 py-2.5"><Badge status={sold ? 'Sold Out' : low ? 'Low Stock' : 'In Stock'} /></td>
                                <td className="px-3.5 py-2.5">
                                  <div className="flex items-center gap-1">
                                    <button onClick={() => setEditItem(item)} className="w-6 h-6 flex items-center justify-center text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"><Edit2 size={11} /></button>
                                    <button onClick={() => doDelete(item.id)} className="w-6 h-6 flex items-center justify-center text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"><Trash2 size={11} /></button>
                                  </div>
                                </td>
                              </tr>
                            );
                          }) : (
                            <tr><td colSpan={6} className="py-10 text-center text-xs text-stone-400">No produce listed</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                <Pagination page={invPage} total={fItems.length} pageSize={INV_PAGE_SIZE} onChange={setInvPage} />
              </div>
            )}

            {tab === 'orders' && (
              <div className="space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-stone-900" style={{ fontFamily: 'Georgia,serif' }}>{orders.length} order{orders.length !== 1 ? 's' : ''}</h3>
                    <p className="text-[10px] text-stone-400 mt-0.5">{pending} pending · {orders.filter(o => o.status === 'Completed').length} completed</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative w-48 shrink-0">
                    <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                    <input type="text" placeholder="Search orders…" value={ordSearch} onChange={e => setOrdSearch(e.target.value)}
                      className="w-full pl-8 pr-7 py-2 bg-white border border-stone-200 rounded-xl text-xs placeholder:text-stone-400 outline-none focus:border-emerald-400 transition-all" />
                    {ordSearch && <button onClick={() => setOrdSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400"><X size={11} /></button>}
                  </div>
                  <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-xl p-1">
                    {[{ id: 'newest', l: 'Newest' }, { id: 'oldest', l: 'Oldest' }, { id: 'value', l: 'Value' }].map(s => (
                      <button key={s.id} onClick={() => setOrdSort(s.id)}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${ordSort === s.id ? 'bg-stone-900 text-white' : 'text-stone-500 hover:text-stone-800'}`}>{s.l}</button>
                    ))}
                  </div>
                  <span className="text-[10px] text-stone-400 ml-auto">{fOrders.length} result{fOrders.length !== 1 ? 's' : ''}</span>
                </div>

                <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left" style={{ minWidth: 680 }}>
                      <thead>
                        <tr className="border-b border-stone-100 bg-stone-50">
                          {['Product', 'Buyer', 'Qty', 'Total', 'Method', 'Status', 'Order Date', 'Fulfilled', 'Actions'].map(h => (
                            <th key={h} className="px-3.5 py-2.5 text-[10px] font-semibold text-stone-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-50">
                        {iOrders.length > 0 ? iOrders.map(o => (
                          <tr key={o.id} className="hover:bg-stone-50 transition-colors">
                            <td className="px-3.5 py-3 text-xs font-semibold text-stone-800 whitespace-nowrap max-w-[100px] truncate">{o.produce_name}</td>
                            <td className="px-3.5 py-3 text-xs text-stone-700 whitespace-nowrap">
                              <div>
                                <p className="font-medium">{o.buyer_name}</p>
                                <p className="text-[10px] text-stone-400">{o.buyer_contact}</p>
                              </div>
                            </td>
                            <td className="px-3.5 py-3 text-xs font-medium text-stone-600">{o.quantity}</td>
                            <td className="px-3.5 py-3 text-xs font-semibold text-stone-900 whitespace-nowrap">
                              ₵{o.total_price != null ? Number(o.total_price).toLocaleString() : '—'}
                            </td>
                            <td className="px-3.5 py-3 text-[10px] text-stone-500 whitespace-nowrap">{o.delivery_method}</td>
                            <td className="px-3.5 py-3 whitespace-nowrap"><Badge status={o.status} /></td>
                            <td className="px-3.5 py-3 whitespace-nowrap">
                              <div className="flex items-center gap-1 text-[10px] text-stone-500">
                                <Calendar size={9} className="text-stone-300 shrink-0" />
                                {fmtShort(o.created_at)}
                              </div>
                            </td>
                            <td className="px-3.5 py-3 whitespace-nowrap">
                              {o.status === 'Completed' ? (
                                <div className="flex items-center gap-1 text-[10px] text-emerald-600">
                                  <CheckSquare size={9} className="shrink-0" />
                                  {fmtShort(o.fulfilled_at) !== '—' ? fmtShort(o.fulfilled_at) : <span className="text-stone-400">—</span>}
                                </div>
                              ) : (
                                <span className="text-[10px] text-stone-300">—</span>
                              )}
                            </td>
                            <td className="px-3.5 py-3 whitespace-nowrap">
                              {o.status === 'Pending' && (
                                <div className="flex items-center gap-1">
                                  <button onClick={() => doComplete(o.id)}
                                    className="w-6 h-6 flex items-center justify-center text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="Mark complete">
                                    <CheckCircle size={13} />
                                  </button>
                                  <button onClick={() => doCancel(o.id)}
                                    className="w-6 h-6 flex items-center justify-center text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="Cancel">
                                    <XCircle size={13} />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={9} className="py-12 text-center">
                              <ShoppingCart size={22} className="mx-auto text-stone-200 mb-2" />
                              <p className="text-xs text-stone-400">{ordSearch ? 'No orders match' : 'No orders yet'}</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                <Pagination page={ordPage} total={fOrders.length} pageSize={ORD_PAGE_SIZE} onChange={setOrdPage} />
              </div>
            )}

            {tab === 'analytics' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="bg-stone-900 rounded-2xl px-5 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] text-emerald-400 font-medium uppercase tracking-widest mb-1">Intelligence Hub</p>
                    <h2 className="text-base font-bold text-white" style={{ fontFamily: 'Georgia,serif' }}>Farm Analytics & Health Insights</h2>
                    <p className="text-[11px] text-stone-400 mt-0.5">Detailed performance data and scan-based health status</p>
                  </div>
                  <div className="w-10 h-10 bg-emerald-600/20 rounded-xl flex items-center justify-center">
                    <BarChart2 size={18} className="text-emerald-400" />
                  </div>
                </div>

                {/* Sub-tab selection menu bar */}
                <div className="flex items-center gap-1.5 bg-white border border-stone-200 rounded-2xl p-1.5 max-w-md">
                  <button 
                    onClick={() => setAnalyticsTab('business')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-semibold transition-all ${analyticsTab === 'business' ? 'bg-stone-900 text-white shadow-sm' : 'text-stone-500 hover:text-stone-800'}`}
                  >
                    <BarChart3 size={12} /> Business Analytics
                  </button>
                  <button 
                    onClick={() => setAnalyticsTab('health')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-semibold transition-all ${analyticsTab === 'health' ? 'bg-stone-900 text-white shadow-sm' : 'text-stone-500 hover:text-stone-800'}`}
                  >
                    <Heart size={12} /> {isPoultry ? 'Flock Health' : 'Crop Health'} Analytics
                  </button>
                </div>

                {/* Tab Window 1: Business Analytics Content */}
                {analyticsTab === 'business' && (
                  <div className="space-y-5 animate-in fade-in duration-200">
                    <div className="bg-white border border-stone-200 rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 shadow-sm">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-semibold text-stone-600">Period Interval:</label>
                          <select 
                            value={businessTimeframe} 
                            disabled={!!customBusinessDate}
                            onChange={e => { setBusinessTimeframe(e.target.value); setBusinessPage(1); }} 
                            className="px-2.5 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-xl font-medium outline-none text-stone-800 disabled:opacity-40"
                          >
                            <option value="day">Past 24 Hours</option>
                            <option value="week">Past Week</option>
                            <option value="month">Past Month</option>
                            <option value="year">Past Year</option>
                          </select>
                        </div>
                        
                        <div className="flex items-center gap-2 border-l border-stone-200 pl-3">
                          <label className="text-xs font-semibold text-stone-600">Or Specific Date:</label>
                          <div className="relative flex items-center">
                            <input 
                              type="date" 
                              value={customBusinessDate}
                              onChange={e => { setCustomBusinessDate(e.target.value); setBusinessPage(1); }}
                              className="px-2.5 py-1 text-xs bg-stone-50 border border-stone-200 rounded-xl font-medium outline-none text-stone-800 tracking-tight"
                            />
                            {customBusinessDate && (
                              <button onClick={() => setCustomBusinessDate('')} className="absolute right-7 text-stone-400 hover:text-stone-600">
                                <X size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => mockExportFile(`business_ledger.csv`, ['id', 'buyer_name', 'produce_name', 'quantity', 'total_price', 'status', 'created_at'], filteredBusinessOrders, 'csv')}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold bg-stone-900 text-white rounded-xl hover:bg-stone-800 transition-colors"
                        >
                          <Download size={12} /> Export CSV
                        </button>
                        <button 
                          onClick={() => mockExportFile(`Business_Operational_Report.pdf`, ['buyer_name', 'produce_name', 'quantity', 'total_price', 'status'], filteredBusinessOrders, 'pdf')}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold border border-stone-200 bg-white text-stone-700 rounded-xl hover:bg-stone-50 transition-colors"
                        >
                          <DownloadCloud size={12} /> Export PDF
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-emerald-600 text-white rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                        <div>
                          <p className="text-[10px] uppercase font-bold tracking-wider text-emerald-200">Total Revenue</p>
                          <h3 className="text-3xl font-black mt-1 tracking-tight">₵{sortedBusinessStats.totalRev.toLocaleString()}</h3>
                        </div>
                        <p className="text-xs text-emerald-100 mt-4 font-medium">Bolding total revenue aggregate compiled for chosen interval layer.</p>
                      </div>

                      <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                        <div>
                          <p className="text-[10px] uppercase font-bold tracking-wider text-stone-400">Most Bought Produce</p>
                          <h3 className="text-2xl font-bold text-stone-900 mt-1 truncate" style={{ fontFamily: 'Georgia,serif' }}>{sortedBusinessStats.bestItem}</h3>
                        </div>
                        <p className="text-xs text-stone-500 mt-4">Most bought stock listing calculated from closed invoice data pools.</p>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-1 h-5 bg-emerald-600 rounded-full" />
                        <h3 className="text-sm font-semibold text-stone-800" style={{ fontFamily: 'Georgia,serif' }}>Produce Performance</h3>
                      </div>

                      {analyticsProduce ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div className="bg-white border border-stone-200 rounded-2xl p-4">
                            <h4 className="text-xs font-semibold text-stone-700 mb-1">Revenue Share by Produce</h4>
                            <p className="text-[10px] text-stone-400 mb-4">Percentage contribution to total revenue</p>
                            <div className="space-y-3">
                              {analyticsProduce.map((p, i) => (
                                <div key={i}>
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-[11px] font-medium text-stone-700 truncate max-w-[140px]">{p.name}</span>
                                    <span className="text-[11px] font-semibold text-stone-900">{p.share}%</span>
                                  </div>
                                  <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                                    <div
                                      className="h-full rounded-full transition-all duration-500"
                                      style={{ width: `${p.share}%`, background: i === 0 ? '#059669' : i === 1 ? '#10b981' : i === 2 ? '#34d399' : '#a7f3d0' }}
                                    />
                                  </div>
                                  <div className="flex items-center justify-between mt-0.5">
                                    <span className="text-[9px] text-stone-400">{p.units_sold} units sold</span>
                                    <span className="text-[9px] text-emerald-600 font-medium">₵{p.revenue?.toLocaleString()}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="bg-white border border-stone-200 rounded-2xl p-4">
                            <h4 className="text-xs font-semibold text-stone-700 mb-1">Revenue per Produce</h4>
                            <p className="text-[10px] text-stone-400 mb-3">Completed order revenue breakdown</p>
                            <div className="h-44">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={analyticsProduce} margin={{ left: -5, right: 8, top: 2, bottom: 2 }}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                                  <XAxis dataKey="name" axisLine={false} tickLine={false}
                                    tick={{ fontSize: 9, fill: '#a8a29e', fontFamily: 'Georgia,serif' }}
                                    tickFormatter={v => v.length > 8 ? v.slice(0, 8) + '…' : v} />
                                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#a8a29e' }}
                                    tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                                  <Tooltip content={<ChartTip />} />
                                  <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                                    {analyticsProduce.map((_, i) => <Cell key={i} fill={i === 0 ? '#059669' : i === 1 ? '#10b981' : i === 2 ? '#34d399' : '#a7f3d0'} />)}
                                  </Bar>
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white border-2 border-dashed border-stone-200 rounded-2xl py-10 text-center">
                          <Award size={22} className="mx-auto text-stone-200 mb-2" />
                          <p className="text-xs text-stone-400">No produce performance data yet</p>
                          <p className="text-[10px] text-stone-300 mt-0.5">Complete orders to see produce analytics</p>
                        </div>
                      )}
                    </div>

                    <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden p-4">
                      <h4 className="text-xs font-semibold text-stone-800 mb-2">Ledger Stream for Interval</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="border-b border-stone-100 bg-stone-50 text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                              <th className="p-2">Date & Time</th>
                              <th className="p-2">Buyer Name</th>
                              <th className="p-2">Item Group</th>
                              <th className="p-2">Quantity</th>
                              <th className="p-2">Invoice Total</th>
                              <th className="p-2">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stone-50 text-xs text-stone-700">
                            {pagedBusinessOrders.length > 0 ? pagedBusinessOrders.map((o, idx) => (
                              <tr key={o.id || idx}>
                                <td className="p-2 whitespace-nowrap text-stone-400">{fmtDate(o.created_at)}</td>
                                <td className="p-2 font-medium">{o.buyer_name}</td>
                                <td className="p-2 font-semibold text-stone-900">{o.produce_name}</td>
                                <td className="p-2">{o.quantity}</td>
                                <td className="p-2 text-emerald-600 font-bold">₵{Number(o.total_price || 0).toLocaleString()}</td>
                                <td className="p-2"><Badge status={o.status} /></td>
                              </tr>
                            )) : (
                              <tr><td colSpan={6} className="p-4 text-center text-stone-400 text-xs">No transaction records mapped to this calendar loop.</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                      
                      {/* Centered sub-tab pagination positioning footer container explicitly styled away from chat context block layout */}
                      <div className="flex justify-center items-center w-full border-t border-stone-100 pt-3 mt-2 max-w-md mx-auto">
                        <Pagination page={businessPage} total={filteredBusinessOrders.length} pageSize={STATS_PAGE_SIZE} onChange={setBusinessPage} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab Window 2: Farm Health Analytics Content */}
                {analyticsTab === 'health' && (
                  <div className="space-y-5 animate-in fade-in duration-200">
                    <div className="bg-white border border-stone-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-semibold text-stone-600">Period Interval:</label>
                        <select 
                          value={healthTimeframe} 
                          onChange={e => { setHealthTimeframe(e.target.value); setHealthPage(1); }} 
                          className="px-2.5 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-xl font-medium outline-none text-stone-800"
                        >
                          <option value="day">Past 24 Hours</option>
                          <option value="week">Past Week</option>
                          <option value="month">Past Month</option>
                          <option value="year">Past Year</option>
                        </select>
                      </div>
                      <button 
                        onClick={() => mockExportFile(`Health_Diagnostic_Log.pdf`, ['date', 'condition', 'severity', 'confidence'], filteredHealthScans, 'pdf')}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold bg-stone-900 text-white rounded-xl hover:bg-stone-800 transition-colors"
                      >
                        <DownloadCloud size={12} /> Export Health PDF
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black text-white ${sortedHealthStats.rate >= 70 ? 'bg-emerald-600' : sortedHealthStats.rate >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`}>
                          {sortedHealthStats.rate}%
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Overall Farm Health</p>
                          <h4 className="text-sm font-bold text-stone-900 mt-0.5">{sortedHealthStats.statusLabel}</h4>
                        </div>
                      </div>

                      <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm">
                        <p className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Total Scans Count</p>
                        <h4 className="text-xl font-black text-stone-900 mt-1">{filteredHealthScans.length} Scans</h4>
                      </div>

                      <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm">
                        <p className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Farm Domain</p>
                        <h4 className="text-sm font-bold text-emerald-700 capitalize mt-1.5">{isPoultry ? 'Birds' : 'Crops'} Section</h4>
                      </div>
                    </div>

                    <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden p-4">
                      <h4 className="text-xs font-semibold text-stone-800 mb-2">Detailed Scan Diagnosis Records</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="border-b border-stone-100 bg-stone-50 text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                              <th className="p-2">Date Scanned</th>
                              <th className="p-2">Condition Analysis</th>
                              <th className="p-2">Confidence Level</th>
                              <th className="p-2">Health Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stone-50 text-xs text-stone-700">
                            {pagedHealthScans.length > 0 ? pagedHealthScans.map((s, idx) => (
                              <tr key={s.id || idx}>
                                <td className="p-2 whitespace-nowrap text-stone-400">{fmtShort(s.date)}</td>
                                <td className="p-2 font-semibold text-stone-900">{s.condition}</td>
                                <td className="p-2 text-stone-500">{s.confidence}</td>
                                <td className="p-2">
                                  <Badge status={s.condition?.toLowerCase().includes('healthy') ? 'Healthy' : s.severity === 'high' ? 'Disease' : 'Warning'} />
                                </td>
                              </tr>
                            )) : (
                              <tr><td colSpan={4} className="p-4 text-center text-stone-400 text-xs">No diagnostics mapped to this calendar framework.</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                      
                      {/* Centered sub-tab pagination positioning footer container explicitly styled away from chat context block layout */}
                      <div className="flex justify-center items-center w-full border-t border-stone-100 pt-3 mt-2 max-w-md mx-auto">
                        <Pagination page={healthPage} total={filteredHealthScans.length} pageSize={STATS_PAGE_SIZE} onChange={setHealthPage} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {tab === 'audit' && (
              <div className="space-y-3 animate-in fade-in duration-200 pb-12">
                <div>
                  <h3 className="text-sm font-semibold text-stone-900" style={{ fontFamily: 'Georgia,serif' }}>Activity Audit Log</h3>
                  <p className="text-[10px] text-stone-400 mt-0.5">Immutable read-only record of all activity</p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative w-48 shrink-0">
                    <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                    <input type="text" placeholder="Search logs…" value={logSearch} onChange={e => setLogSearch(e.target.value)}
                      className="w-full pl-8 pr-7 py-2 bg-white border border-stone-200 rounded-xl text-xs placeholder:text-stone-400 outline-none focus:border-emerald-400 transition-all" />
                    {logSearch && <button onClick={() => setLogSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400"><X size={11} /></button>}
                  </div>
                  <div className="flex gap-1 bg-white border border-stone-200 rounded-xl p-1">
                    {['all', 'order', 'inventory', 'auth'].map(f => (
                      <button key={f} onClick={() => setLogFilter(f)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium capitalize transition-all ${logFilter === f ? 'bg-stone-900 text-white' : 'text-stone-500 hover:text-stone-800'}`}>{f}</button>
                    ))}
                  </div>
                  <div className="flex gap-1 bg-white border border-stone-200 rounded-xl p-1">
                    {['newest', 'oldest'].map(s => (
                      <button key={s} onClick={() => setLogSort(s)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium capitalize transition-all ${logSort === s ? 'bg-stone-900 text-white' : 'text-stone-500 hover:text-stone-800'}`}>{s}</button>
                    ))}
                  </div>
                  <span className="text-[10px] text-stone-400 ml-auto">{fLogs.length} result{fLogs.length !== 1 ? 's' : ''}</span>
                </div>

                <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left" style={{ minWidth: 760 }}>
                      <thead>
                        <tr className="border-b border-stone-100 bg-stone-50">
                          {['Date', 'Action', 'Details', 'Type', 'User'].map(h => (
                            <th key={h} className="px-3.5 py-2.5 text-[10px] font-semibold text-stone-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-50">
                        {iLogs.length > 0 ? iLogs.map((l, idx) => (
                          <tr key={l.id || l.timestamp || idx} className="hover:bg-stone-50 transition-colors">
                            <td className="px-3.5 py-3 text-[10px] text-stone-500">{fmtDate(l.timestamp || l.date || l.created_at)}</td>
                            <td className="px-3.5 py-3 text-xs font-semibold text-stone-800">{l.action || '—'}</td>
                            <td className="px-3.5 py-3 text-[10px] text-stone-500">{l.details || '—'}</td>
                            <td className="px-3.5 py-3 text-[10px] text-stone-500 capitalize">{l.type || '—'}</td>
                            <td className="px-3.5 py-3 text-[10px] text-stone-500">{l.user || l.actor || user?.fullname || '—'}</td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={5} className="py-12 text-center text-xs text-stone-400">
                              <Activity size={22} className="mx-auto text-stone-200 mb-2" />
                              {logSearch ? 'No logs match' : 'No audit records available'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="flex justify-center w-full max-w-xl mx-auto px-4">
                  <div className="w-full">
                    <Pagination page={logPage} total={fLogs.length} pageSize={LOG_PAGE_SIZE} onChange={setLogPage} />
                  </div>
                </div>
              </div>
            )}

            {tab === 'settings' && (
              <div className="max-w-md space-y-4 animate-in fade-in duration-200">
                <div className="grid grid-cols-2 gap-1 bg-white border border-stone-200 rounded-2xl p-1.5 sm:flex sm:flex-wrap">
                  {[
                    { id: 'profile', l: 'Profile', ic: <User size={12} /> },
                    { id: 'security', l: 'Security', ic: <Lock size={12} /> },
                    { id: 'backup', l: 'Backup & Restore', ic: <RefreshCcw size={12} /> },
                    { id: 'delete', l: 'Account Deletion', ic: <UserMinus size={12} /> }
                  ].map(t => (
                    <button key={t.id} onClick={() => setSettTab(t.id)}
                      className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-[11px] font-semibold transition-all ${settTab === t.id ? 'bg-stone-900 text-white shadow-sm' : 'text-stone-500 hover:text-stone-800'}`}>
                      {t.ic} <span className="truncate">{t.l}</span>
                    </button>
                  ))}
                </div>

                {settTab === 'profile' && (
                  <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
                    <div className="px-4 py-3.5 border-b border-stone-100 flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center">
                        <User size={14} className="text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="text-xs font-semibold text-stone-800" style={{ fontFamily: 'Georgia,serif' }}>Farm Profile</h3>
                        <p className="text-[10px] text-stone-400 mt-0.5">Your public farm information</p>
                      </div>
                    </div>
                    <form onSubmit={doSaveProf} className="p-4 space-y-3">
                      <Field label="Farm / Full Name">
                        <input type="text" value={profForm.fullname} onChange={e => setProfForm({ ...profForm, fullname: sanitize(e.target.value) })} className={fCls} />
                      </Field>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Field label="Location">
                          <input type="text" value={profForm.location} onChange={e => setProfForm({ ...profForm, location: sanitize(e.target.value) })} className={fCls} />
                        </Field>
                        <Field label="Phone Number">
                          <div className="relative">
                            <Phone size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                            <input type="tel" value={profForm.phone} onChange={e => setProfForm({ ...profForm, phone: sanitize(e.target.value) })} placeholder="+233 XX XXX XXXX" className={`${fCls} pl-8`} />
                          </div>
                        </Field>
                      </div>
                      <button type="submit" className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors">
                        Save Profile
                      </button>
                    </form>
                  </div>
                )}

                {settTab === 'security' && (
                  <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
                    <div className="px-4 py-3.5 border-b border-stone-100 flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-rose-50 rounded-xl flex items-center justify-center">
                        <Lock size={14} className="text-rose-500" />
                      </div>
                      <div>
                        <h3 className="text-xs font-semibold text-stone-800" style={{ fontFamily: 'Georgia,serif' }}>Change Password</h3>
                        <p className="text-[10px] text-stone-400 mt-0.5">Minimum 6 characters</p>
                      </div>
                    </div>
                    <form onSubmit={doChangePass} className="p-4 space-y-3">
                      <Field label="Current Password">
                        <input
                          type="password"
                          value={passForm.old}
                          onChange={e => setPassForm({ ...passForm, old: e.target.value })}
                          className={fCls}
                        />
                      </Field>
                      <Field label="New Password">
                        <input
                          type="password"
                          value={passForm.new}
                          onChange={e => setPassForm({ ...passForm, new: e.target.value })}
                          className={fCls}
                        />
                      </Field>
                      <Field label="Confirm Password">
                        <>
                          <input
                            type="password"
                            value={passForm.confirm}
                            onChange={e => setPassForm({ ...passForm, confirm: e.target.value })}
                            className={`${fCls} ${passForm.confirm && passForm.new !== passForm.confirm ? 'border-rose-300 focus:border-rose-400' : passForm.confirm && passForm.new === passForm.confirm ? 'border-emerald-300' : ''}`}
                          />
                          {passForm.confirm && (
                            <p className={`text-[10px] mt-1 font-medium ${passForm.new === passForm.confirm ? 'text-emerald-600' : 'text-rose-500'}`}>
                              {passForm.new === passForm.confirm ? 'Passwords match' : 'Passwords do not match'}
                            </p>
                          )}
                        </>
                      </Field>
                      <button
                        type="submit"
                        disabled={passForm.new !== passForm.confirm || passForm.new.length < 6}
                        className="flex items-center gap-2 bg-stone-900 hover:bg-rose-600 text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Lock size={11} />
                        Update Password
                      </button>
                    </form>
                  </div>
                )}

                {/* Data Redundancy Terminal sub-tab layout wrapper block */}
                {settTab === 'backup' && (
                  <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden p-4 shadow-sm space-y-4 animate-in fade-in duration-150">
                    <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
                      <RefreshCcw size={14} className="text-stone-500" />
                      <h4 className="text-xs font-bold text-stone-800" style={{ fontFamily: 'Georgia,serif' }}>Data Redundancy Vault</h4>
                    </div>
                    <p className="text-[11px] text-stone-500 leading-relaxed">
                      Export local databases into an external JSON manifest to generate redundant snapshots, or reload existing manifests to reset states.
                    </p>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                      <button 
                        onClick={triggerDataBackup}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 transition-colors"
                      >
                        <Download size={13} /> Export Vault File
                      </button>
                      <label className="flex items-center justify-center gap-1.5 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold hover:bg-stone-100 cursor-pointer text-stone-700 transition-colors">
                        <Upload size={13} /> Load Redundant Snapshot
                        <input type="file" accept=".json" onChange={processDataRestore} className="hidden" />
                      </label>
                    </div>
                  </div>
                )}

                {/* Account Self-Destruction Sequence sub-tab layout wrapper block */}
                {settTab === 'delete' && (
                  <div className="bg-white border border-rose-200 rounded-2xl overflow-hidden p-4 shadow-sm space-y-4 animate-in fade-in duration-150">
                    <div className="flex items-center gap-2 pb-2 border-b border-rose-100">
                      <UserMinus size={14} className="text-rose-600" />
                      <h4 className="text-xs font-bold text-rose-800" style={{ fontFamily: 'Georgia,serif' }}>Account Purge Sequence</h4>
                    </div>
                    <div className="bg-rose-50/50 rounded-xl p-3 border border-rose-100 flex items-start gap-2.5">
                      <ShieldAlert size={14} className="text-rose-600 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-rose-700 leading-relaxed">
                        Warning: This operation drops all marketplace tokens and local indexes permanently. Type your full username validation sequence <span className="font-bold underline">({user?.fullname || '—'})</span> to verify execution authority.
                      </p>
                    </div>
                    <form onSubmit={executeAccountDeletion} className="space-y-3">
                      <input 
                        type="text" 
                        placeholder="Verify Username String Value"
                        value={deleteConfirmText}
                        onChange={e => {
                          setDeleteConfirmText(e.target.value);
                          setIsDeleteVerified(e.target.value === user?.fullname);
                        }}
                        className="w-full px-3 py-2 bg-rose-50/50 border border-rose-200 rounded-xl text-xs text-rose-900 outline-none focus:bg-white placeholder:text-rose-300 font-sans"
                      />
                      <button 
                        type="submit"
                        disabled={!isDeleteVerified}
                        className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        Confirm Account Deletion
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}        

          </div>
        </div>
      </main>

      {/* ─── CHATBOT INTEGRATION DESK ─── */}
      {!chatOpen && (
        <button 
          onClick={() => setChatOpen(true)}
          className="fixed right-4 bottom-20 md:bottom-5 md:right-5 flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2.5 rounded-2xl shadow-xl text-xs font-semibold z-[70] hover:scale-105 active:scale-95 transition-all font-sans"
        >
          <MessageSquare size={14} />
          <span className="hidden sm:inline">AgriGo AI</span>
          <span className="w-1.5 h-1.5 bg-emerald-200 rounded-full animate-pulse" />
        </button>
      )}
      
      {chatOpen && (
        <Chatbot farmType={user?.farm_type} onClose={() => setChatOpen(false)} />
      )}

    </div>
  );
};

export default Dashboard;