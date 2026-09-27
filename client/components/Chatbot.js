import React, { useState, useEffect, useRef } from 'react';
import { Send, X, Bot, ShieldCheck } from 'lucide-react';

const Chatbot = ({ farmType, onClose }) => {
  const [messages, setMessages] = useState([
    { 
      role: 'bot', 
      text: farmType === 'poultry' 
        ? "Greetings. I am Agri-Bot, your specialized poultry health assistant. How can I assist with your flock today?" 
        : "Greetings. I am Agri-Bot, your specialized agrricultural advisor. How can I assist you today?" 
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [lastTopic, setLastTopic] = useState("");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // --- REFINED TABLE & CONTENT RENDERING ENGINE (Logic Unchanged) ---
  const renderContent = (text) => {
    const lines = text.split('\n');
    const tableRows = lines.filter(line => line.trim().startsWith('|'));

    if (tableRows.length > 0) {
      const beforeTable = lines.slice(0, lines.indexOf(tableRows[0])).join('\n');
      const afterTable = lines.slice(lines.indexOf(tableRows[tableRows.length - 1]) + 1).join('\n');

      return (
        <div className="space-y-3.5">
          {beforeTable && (
            <div className="whitespace-pre-wrap text-slate-800 text-[14px] font-medium leading-relaxed tracking-normal">
              {beforeTable.replace(/###/g, '').replace(/●/g, '').replace(/\*\*/g, '')}
            </div>
          )}
          
          <div className="overflow-x-auto my-3 border border-slate-200/80 rounded-xl bg-white shadow-none">
            <table className="w-full text-[12px] text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 text-slate-700 font-semibold border-b border-slate-200/80">
                  {tableRows[0].split('|').filter(cell => cell.trim() !== '').map((header, i) => (
                    <th key={i} className="px-4 py-2.5 font-medium tracking-tight">{header.trim()}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tableRows.slice(2).map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50/40 transition-colors">
                    {row.split('|').filter(cell => cell.trim() !== '').map((cell, j) => (
                      <td key={j} className="px-4 py-2.5 text-slate-600 font-normal leading-normal">
                        {cell.trim().replace(/\*\*/g, '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {afterTable && (
            <div className="whitespace-pre-wrap text-[13px] text-slate-500 border-l-2 border-slate-200 pl-3 leading-relaxed">
              {afterTable.replace(/\*\*/g, '')}
            </div>
          )}
        </div>
      );
    }
    return (
      <div className="whitespace-pre-wrap text-[14px] leading-relaxed text-slate-800 font-normal">
        {text.replace(/###/g, '').replace(/●/g, '•').replace(/\*\*/g, '')}
      </div>
    );
  };

  const suggestions = farmType === 'poultry' 
    ? ["Feed Calculator", "Newcastle signs?", "Coccidiosis help"]
    : ["Best crops for Ghana?", "Maize fertilizer?", "Yellow leaves help"];

  const calculateFeed = (birdCount) => {
    const ratio = birdCount / 1000;
    return `### Feed Formulation for ${birdCount} Birds (Weeks 1-6)
• Maize: ${(600 * ratio).toFixed(1)} kg
• Soya: ${(250 * ratio).toFixed(1)} kg
• Wheat: ${(60 * ratio).toFixed(1)} kg
• Fish Meal: ${(50 * ratio).toFixed(1)} kg
• Vitalac: ${(25 * ratio).toFixed(1)} kg
• Shells: ${(10 * ratio).toFixed(1)} kg
• Total Weight: ${(1000 * ratio).toFixed(1)} kg

*Calculated matching standard regional precision feed protocols.*`;
  };

  const sendMessage = async (textToSend) => {
    const messageText = textToSend || input;
    if (!messageText.trim()) return;
    
    const userMsg = { role: 'user', text: messageText };
    setMessages(prev => [...prev, userMsg]);
    setInput("");

    if (messageText === "Feed Calculator") {
      setIsTyping(true);
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          role: 'bot', 
          text: "Precision calculation protocol active. Please specify the target bird count to map out your feed formulation matrices (e.g., '500')." 
        }]);
        setIsTyping(false);
      }, 600);
      return;
    }

    const numMatch = messageText.match(/\d+/);
    if (farmType === 'poultry' && (messageText.toLowerCase().includes('calculate') || messageText.toLowerCase().includes('bird') || (numMatch && messageText.length < 6))) {
      setIsTyping(true);
      setTimeout(() => {
        const count = numMatch ? parseInt(numMatch[0]) : 100;
        setMessages(prev => [...prev, { role: 'bot', text: calculateFeed(count) }]);
        setIsTyping(false);
      }, 700);
      return; 
    }

    setIsTyping(true);
    try {
    const res = await fetch(`http://localhost:5000/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText, farm_type: farmType, last_topic: lastTopic }),
      });
      const data = await res.json();
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'bot', text: data.response }]);
        if (data.intent) setLastTopic(data.intent);
        setIsTyping(false);
      }, 500);
    } catch (error) {
      setIsTyping(false);
      setMessages(prev => [...prev, { role: 'bot', text: "### Connection Sync Interrupted\nUnable to establish backend handshake. Verify local server execution arrays." }]);
    }
  };

  // --- DIMENSIONS ---
  const chatbotWidth = "560px"; // PC width
  const chatbotHeight = "750px"; // PC height
  const maxChatbotHeight = "90vh"; // Max PC height
  // --- END DIMENSIONS ---

  return (
    <div
      style={{
        width: chatbotWidth,
        height: chatbotHeight,
        maxHeight: maxChatbotHeight,
      }}
      className="fixed bottom-0 right-0 md:bottom-6 md:right-6 w-full md:w-[440px] h-full md:h-[680px] max-h-full md:max-h-[85vh] bg-white md:shadow-xl md:rounded-2xl flex flex-col border border-slate-200/80 overflow-hidden z-[100] animate-in slide-in-from-bottom-6 duration-300 font-sans"
    >
      
      {/* ─── STICKY HEADER (Bono Emerald & Deep Forest Green Scheme) ─── */}
      <div className={`px-5 py-4 border-b border-transparent flex justify-between items-center shrink-0 text-white shadow-sm ${farmType === 'poultry' ? 'bg-emerald-800' : 'bg-green-900'}`}>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white/10 border border-white/20 text-white">
            <Bot size={18} strokeWidth={2} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-[14px] tracking-tight text-white">
                {farmType === 'poultry' ? 'Agri-Bot' : 'Agri-Bot'}
              </h2>
              <div className="flex items-center gap-1.5 bg-white/20 px-2 py-0.5 rounded-full border border-white/10">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full shadow-[0_0_6px_rgba(74,222,128,1)]" />
                <span className="text-[10px] font-medium text-white uppercase tracking-tight">Active</span>
              </div>
            </div>
            <span className="text-[11px] text-white/80 font-normal tracking-wide mt-0.5 block">Agri-GO's Ecosystem Intelligence Agent</span>
          </div>
        </div>
        <button 
          onClick={onClose} 
          className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white"
          aria-label="Close Chat"
        >
          <X size={18} />
        </button>
      </div>

      {/* ─── SCROLLABLE CONVERSATION SURFACE ─── */}
      <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/60 scroll-smooth">
        {messages.map((m, i) => (
          <div key={i} className={`flex w-full ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-4 py-3 rounded-xl text-[14px] shadow-sm tracking-normal ${
              m.role === 'user' 
                ? 'bg-slate-900 text-white rounded-tr-none font-medium' 
                : 'bg-white text-slate-800 rounded-tl-none border border-slate-200/80'
            }`}>
              {m.role === 'user' ? (
                <div className="flex items-center gap-2 whitespace-pre-wrap">
                  {m.text}
                </div>
              ) : (
                renderContent(m.text)
              )}
            </div>
          </div>
        ))}
        
        {/* Loading Indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200/80 px-4 py-3 rounded-xl rounded-tl-none shadow-sm">
              <div className="flex items-center gap-1.5 h-4">
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-duration:1s]"></div>
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-duration:1s] [animation-delay:0.2s]"></div>
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-duration:1s] [animation-delay:0.4s]"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ─── CHIPS INTERFACE (Clean Emerald Outlines) ─── */}
      <div className="px-5 py-2.5 bg-slate-50/60 flex gap-2 overflow-x-auto border-t border-slate-100 scrollbar-none shrink-0">
        {suggestions.map((hint, idx) => (
          <button 
            key={idx}
            onClick={() => sendMessage(hint)}
            className={`whitespace-nowrap px-3.5 py-1.5 bg-white border rounded-lg text-[11px] font-medium tracking-tight transition-all shadow-sm shrink-0 ${
              farmType === 'poultry'
                ? 'border-emerald-200 hover:border-emerald-600 text-emerald-700 hover:text-emerald-800'
                : 'border-green-200 hover:border-green-700 text-green-700 hover:text-green-800'
            }`}
          >
            {hint}
          </button>
        ))}
      </div>

      {/* ─── ACTIONS / CONTROL INPUT FIELD ─── */}
      <div className="p-4 bg-white border-t border-slate-200/60 shrink-0">
        <div className={`relative flex items-center bg-slate-50 border rounded-xl transition-all duration-200 overflow-hidden pr-1.5 ${
          farmType === 'poultry' 
            ? 'focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500/20' 
            : 'focus-within:border-green-600 focus-within:ring-1 focus-within:ring-green-600/20'
        }`}>
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask a technical or operational question..."
            className="flex-1 bg-transparent py-3.5 pl-4 pr-12 text-[14px] text-slate-800 placeholder:text-slate-400/90 outline-none font-normal"
          />
          <button 
            onClick={() => sendMessage()} 
            disabled={!input.trim()}
            className={`p-2 rounded-lg transition-all duration-150 shrink-0 ${
              !input.trim() 
                ? 'text-slate-300 bg-transparent' 
                : farmType === 'poultry'
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                  : 'bg-green-700 text-white hover:bg-green-800 shadow-sm'
            }`}
          >
            <Send size={15} strokeWidth={2.5} />
          </button>
        </div>
        
        {/* Footnote Branding Meta */}
        <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] font-medium text-slate-400 uppercase tracking-wider select-none">
          <ShieldCheck size={12} className="text-slate-400" />
          <span>Agri-Bot powered by JENPACK Technologies</span>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;