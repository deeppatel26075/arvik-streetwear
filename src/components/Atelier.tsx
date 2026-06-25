'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, Send, Compass, Lock, User, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SoundPlayer } from '@/components/SoundExperience';
import Link from 'next/link';

interface Message {
  id: string;
  sender: 'atelier' | 'user';
  text: string;
  products?: any[]; // Suggested products
}

export default function Atelier() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [typing, setTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Curated premium mock catalog for suggestion mapping
  const catalog = [
    {
      id: 'prod-001',
      name: 'FAREBI OVERSIZED OLIVE TEE',
      slug: 'farebi-oversized-olive-tee',
      price: 1499,
      image: '/products/farebi-olive.jpg',
      sku: 'ARVIIK/001',
      details: '240 GSM Olive Heavyweight Terry'
    },
    {
      id: 'prod-002',
      name: 'POLARIZE VINTAGE CREAM TEE',
      slug: 'polarize-vintage-cream-tee',
      price: 1299,
      image: '/products/polarize-cream.jpg',
      sku: 'ARVIIK/002',
      details: '240 GSM Cream Ring-Spun Cotton'
    },
    {
      id: 'prod-003',
      name: 'MARD PAISA BURGUNDY TEE',
      slug: 'mard-paisa-burgundy-tee',
      price: 1499,
      image: '/products/mard-paisa-maroon.jpg',
      sku: 'ARVIIK/003',
      details: '240 GSM Burgundy Premium Terry'
    },
    {
      id: 'prod-004',
      name: 'POLARIZE NAVY BLUE TEE',
      slug: 'polarize-navy-blue-tee',
      price: 1299,
      image: '/products/polarize-navy.jpg',
      sku: 'ARVIIK/004',
      details: '240 GSM Navy Combed Cotton'
    }
  ];

  // Initialize with greeting
  useEffect(() => {
    setMessages([
      {
        id: 'msg-welcome',
        sender: 'atelier',
        text: 'Welcome to the ARVIIK ATELIER. I am your personal design counselor. What defines your moment?'
      }
    ]);
  }, []);

  // Auto scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const toggleAtelier = () => {
    SoundPlayer.playTick();
    setIsOpen(!isOpen);
  };

  const handleSendPrompt = (prompt: string) => {
    SoundPlayer.playTick();
    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: prompt.toUpperCase()
    };
    setMessages(prev => [...prev, userMsg]);
    triggerStylistResponse(prompt);
  };

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    SoundPlayer.playTick();
    const text = inputText.trim();
    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text
    };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    triggerStylistResponse(text);
  };

  const triggerStylistResponse = (query: string) => {
    setTyping(true);
    const q = query.toLowerCase();

    let reply = '';
    let suggestions: any[] = [];

    // Local styling logic
    if (q.includes('cafe') || q.includes('casual') || q.includes('coffee')) {
      reply = 'For your cafe presence: ARVIIK/002 Vintage Cream Oversized Tee. Its heavyweight structured cotton holds its shape in relaxed postures. Pair with washed denim cargos and soft leather sneakers. Confidence without noise.';
      suggestions = [catalog[1]];
    } else if (q.includes('evening') || q.includes('date') || q.includes('night') || q.includes('party')) {
      reply = 'For your evening presence: ARVIIK/003 Burgundy Maroon Tee. The rich boxy drape adds architectural structure under dim lighting. Offset its warm hue with charcoal tailored trousers and minimal metal chains. Bold details. Silence first.';
      suggestions = [catalog[2]];
    } else if (q.includes('street') || q.includes('travel') || q.includes('transit') || q.includes('outdoor')) {
      reply = 'For your street transit: ARVIIK/001 Olive Oversized Tee. Built with double-hemmed 240 GSM Terry to endure heavy movement. Pair with vintage denim and dark utility chest rigs. Structured durability.';
      suggestions = [catalog[0]];
    } else if (q.includes('minimal') || q.includes('business') || q.includes('work') || q.includes('studio')) {
      reply = 'For your studio presence: ARVIIK/004 Navy Blue Tee. Engineered from premium combed fibers for a clean drop-shoulder look. Pair with dark beige utility pants. Focus on the craft, no compromises.';
      suggestions = [catalog[3]];
    } else {
      reply = 'To anchor your streetwear lookbook, I suggest building around the ARVIIK/001 FAREBI Olive Tee or the ARVIIK/003 Burgundy. Choose your tone below to inspect drapes.';
      suggestions = [catalog[0], catalog[2]];
    }

    setTimeout(() => {
      setTyping(false);
      setMessages(prev => [...prev, {
        id: `reply-${Date.now()}`,
        sender: 'atelier',
        text: reply,
        products: suggestions
      }]);
      SoundPlayer.playUnlock();
    }, 1500);
  };

  const prompts = [
    { label: '○ EVENING PRESENCE', value: 'evening' },
    { label: '○ STREET TRANSIT', value: 'street' },
    { label: '○ CAFE ESCAPE', value: 'cafe' },
    { label: '○ STUDIO MINIMAL', value: 'minimal' }
  ];

  return (
    <>
      {/* Floating Circular Toggle Button */}
      <div className="fixed bottom-6 right-6 z-40 select-none">
        <button
          onClick={toggleAtelier}
          className="flex items-center space-x-2 bg-stone-950 hover:bg-stone-900 border border-stone-850 hover:border-stone-700 text-white p-4 rounded-full shadow-2xl transition-all duration-300 sound-click sound-hover group"
        >
          <Sparkles className="h-5 w-5 text-lime-400 group-hover:rotate-12 transition-transform duration-300" />
          <span className="hidden md:inline text-[9px] font-bold tracking-[0.25em] uppercase pr-2">
            ARVIIK ATELIER
          </span>
        </button>
      </div>

      {/* Atelier Chat Sidebar Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleAtelier}
              className="fixed inset-0 bg-stone-950/45 backdrop-blur-xs z-40"
            />

            {/* Sidebar drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.35, ease: 'easeOut' }}
              className="fixed top-0 right-0 h-full w-full max-w-sm bg-stone-950 text-stone-300 border-l border-stone-880 z-50 flex flex-col shadow-2xl font-sans"
            >
              {/* Header */}
              <div className="p-6 border-b border-stone-900 flex justify-between items-center bg-stone-980">
                <div>
                  <span className="text-[9px] text-stone-550 font-bold uppercase tracking-[0.3em] block">
                    DESIGN SYSTEM
                  </span>
                  <span className="font-syne font-extrabold text-sm text-white tracking-[0.2em] uppercase">
                    ARVIIK ATELIER
                  </span>
                </div>
                <button
                  onClick={toggleAtelier}
                  className="text-stone-500 hover:text-white transition-colors"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Chat Messages Log */}
              <div className="flex-grow overflow-y-auto p-6 space-y-6">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col space-y-2 max-w-[85%] ${
                      msg.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
                    }`}
                  >
                    <div
                      className={`text-[11px] leading-relaxed p-3.5 rounded-sm border ${
                        msg.sender === 'user'
                          ? 'bg-stone-900 border-stone-800 text-white font-mono'
                          : 'bg-stone-980 border-stone-900 text-stone-300 font-light'
                      }`}
                    >
                      {msg.text}
                    </div>

                    {/* Embeded outfit suggestions */}
                    {msg.products && msg.products.length > 0 && (
                      <div className="w-full space-y-2 pt-1">
                        <span className="text-[8px] text-stone-500 font-bold uppercase tracking-wider block">
                          Suggested Pieces:
                        </span>
                        {msg.products.map((p) => (
                          <Link
                            key={p.id}
                            href={`/shop/${p.slug}`}
                            onClick={toggleAtelier}
                            className="flex items-center space-x-3 bg-stone-900/40 border border-stone-850 hover:border-stone-700 p-2 rounded-xs transition-colors group text-left"
                          >
                            <div className="relative w-8 h-10 bg-stone-950 flex-shrink-0">
                              <img src={p.image} alt={p.name} className="object-cover w-full h-full" />
                            </div>
                            <div className="flex-grow text-[10px] truncate">
                              <p className="font-bold text-white uppercase tracking-wide group-hover:text-lime-400 transition-colors">{p.sku}</p>
                              <p className="text-stone-500 font-light truncate uppercase">{p.name}</p>
                            </div>
                            <span className="text-[10px] font-mono text-stone-400 pr-1">
                              ₹{p.price}
                            </span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Typing status indicator */}
                {typing && (
                  <div className="flex flex-col items-start space-y-1 mr-auto max-w-[85%]">
                    <div className="flex space-x-1 p-3.5 bg-stone-980 border border-stone-900 rounded-sm">
                      <div className="h-1.5 w-1.5 bg-stone-500 rounded-full animate-bounce" />
                      <div className="h-1.5 w-1.5 bg-stone-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="h-1.5 w-1.5 bg-stone-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* Fast styling prompt buttons */}
              {messages.length === 1 && (
                <div className="px-6 pb-2 space-y-2 flex flex-col font-sans select-none">
                  <span className="text-[8px] text-stone-600 font-bold uppercase tracking-wider block">
                    Select styling moment
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {prompts.map((item) => (
                      <button
                        key={item.value}
                        onClick={() => handleSendPrompt(item.value)}
                        className="text-left border border-stone-900 hover:border-stone-800 bg-stone-950 p-2 rounded-xs hover:text-white transition-colors text-[9px] font-bold tracking-wider"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat Input Area */}
              <form onSubmit={handleSendText} className="p-4 border-t border-stone-900 bg-stone-980 flex space-x-2">
                <input
                  type="text"
                  placeholder="Define your moment (e.g. cafe, party)..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-grow bg-stone-950 border border-stone-900 focus:border-stone-700 px-3 py-2 text-xs focus:outline-none rounded-xs text-white"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="bg-white hover:bg-stone-200 disabled:bg-stone-900 disabled:text-stone-600 p-2.5 rounded-xs text-stone-950 transition-colors sound-click"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
