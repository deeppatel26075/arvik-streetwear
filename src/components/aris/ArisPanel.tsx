'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { X, ArrowUp, RotateCcw, Ruler, Shirt, Repeat, Truck } from 'lucide-react';
import { ArisMark } from './ArisLauncher';
import { whatsappLink, WHATSAPP_DISPLAY } from '@/lib/contact';

type Turn = { role: 'user' | 'assistant'; content: string };

const STORAGE_KEY = 'arviik_aris_chat';
const MAX_CHARS = 1000;
const QUICK_ACTIONS = [
  { icon: Ruler, label: 'Find my size', hint: 'Get a size from your weight', prompt: 'Which size should I get?' },
  { icon: Shirt, label: 'Shop the drop', hint: "See what's in stock now", prompt: "What's in the shop right now?" },
  { icon: Repeat, label: 'Exchanges', hint: 'How size swaps work', prompt: 'How do exchanges work?' },
  { icon: Truck, label: 'Delivery', hint: 'When your order arrives', prompt: 'When will my order arrive?' },
];


function loadHistory(): Turn[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.slice(-30) : [];
  } catch {
    return [];
  }
}

export default function ArisPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [turns, setTurns] = useState<Turn[]>(() => (typeof window === 'undefined' ? [] : loadHistory()));
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [closing, setClosing] = useState(false);

  // Close with the shrink-back-to-the-corner animation, then hide.
  // `clearChat`: closing Aris (✕ / Esc) starts the next visit fresh. Tapping
  // a link in a reply also tucks the panel away on phones, but keeps the
  // conversation, since the customer is following Aris's suggestion.
  const requestClose = useCallback(
    (clearChat = true) => {
      if (closing) return;
      const finish = () => {
        if (clearChat) {
          abortRef.current?.abort();
          setTurns([]);
          setInput('');
          setBusy(false);
        }
        onClose();
      };
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        finish();
        return;
      }
      setClosing(true);
      setTimeout(() => {
        setClosing(false);
        finish();
      }, 320);
    },
    [closing, onClose]
  );

  // Remember the conversation for this visit (survives page changes).
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(turns.slice(-30)));
    } catch {
      // storage unavailable (private mode) — chat still works
    }
  }, [turns]);

  // Keep the newest message in view.
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [turns, busy]);

  // Focus the box on open; Esc closes; lock page scroll behind the
  // full-screen sheet on phones.
  useEffect(() => {
    if (!open) return;
    // Desktop: ready to type. Phones: don't pop the keyboard over the
    // welcome screen; it opens when the customer taps the box.
    const t = setTimeout(() => {
      if (window.matchMedia('(min-width: 640px) and (pointer: fine)').matches) inputRef.current?.focus();
    }, 50);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && requestClose();
    window.addEventListener('keydown', onKey);
    const isPhone = window.matchMedia('(max-width: 639px)').matches;
    const prevOverflow = document.body.style.overflow;
    if (isPhone) document.body.style.overflow = 'hidden';
    return () => {
      clearTimeout(t);
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, requestClose]);

  // Stop any reply in flight if the panel unmounts.
  useEffect(() => () => abortRef.current?.abort(), []);

  const send = useCallback(
    async (text: string) => {
      const question = text.trim().slice(0, MAX_CHARS);
      if (!question || busy) return;

      const history: Turn[] = [...turns, { role: 'user', content: question }];
      setTurns([...history, { role: 'assistant', content: '' }]);
      setInput('');
      setBusy(true);

      const controller = new AbortController();
      abortRef.current = controller;
      const setReply = (content: string) =>
        setTurns((prev) => {
          const next = prev.slice();
          next[next.length - 1] = { role: 'assistant', content };
          return next;
        });

      try {
        const res = await fetch('/api/aris', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: history.filter((t) => t.content) }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          setReply(
            res.status === 429
              ? "You're sending messages a little fast. Please try again in a few minutes."
              : res.status === 503
                ? `I'm offline right now. For help, message us on [WhatsApp](${whatsappLink('Hi ARVIIK!')}) at ${WHATSAPP_DISPLAY}.`
                : 'Something went wrong on my side. Please try again.'
          );
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let reply = '';
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          reply += decoder.decode(value, { stream: true });
          setReply(reply);
        }
        if (!reply.trim()) setReply('Sorry, I could not answer that. Please try asking another way.');
      } catch (err) {
        if ((err as Error)?.name !== 'AbortError') {
          setReply("I couldn't connect just now. Please check your connection and try again.");
        }
      } finally {
        setBusy(false);
        abortRef.current = null;
      }
    },
    [busy, turns]
  );

  const reset = () => {
    abortRef.current?.abort();
    setTurns([]);
    setBusy(false);
  };

  const onLinkClick = () => {
    if (window.matchMedia('(max-width: 639px)').matches) requestClose(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Chat with Aris"
      hidden={!open}
      className={`fixed z-[95] inset-0 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-[400px] sm:h-[min(640px,calc(100vh-6rem))] flex flex-col bg-[#f6f5f2] sm:rounded-[28px] sm:ring-1 sm:ring-black/10 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.55)] overflow-hidden ${closing ? 'aris-panel-out' : 'aris-panel-in'}`}
    >
      {/* Header — black, lime glow, live status */}
      <div className="relative bg-stone-950 text-white pt-[max(0.875rem,env(safe-area-inset-top))] pb-4 px-4 overflow-hidden">
        <div aria-hidden="true" className="absolute -top-16 -left-10 h-40 w-40 rounded-full bg-lime-400/25 blur-3xl" />
        <div aria-hidden="true" className="absolute -bottom-20 right-0 h-32 w-48 rounded-full bg-lime-300/10 blur-3xl" />
        <div className="aris-rise relative flex items-center gap-3" style={{ animationDelay: '120ms' }}>
          <span className="relative">
            <span aria-hidden="true" className="absolute inset-0 rounded-full bg-lime-400/40 blur-md" />
            <ArisMark className="relative h-11 w-11 text-base ring-2 ring-lime-300/40" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-syne font-extrabold text-base tracking-[0.28em] uppercase leading-none">Aris</p>
            <p className="mt-1.5 flex items-center gap-1.5 text-[10px] font-semibold text-stone-400 tracking-wide">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75 animate-ping" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-lime-400" />
              </span>
              Online · replies instantly
            </p>
          </div>
          {turns.length > 0 && (
            <button
              type="button"
              onClick={reset}
              className="h-9 w-9 flex items-center justify-center rounded-full text-stone-300 ring-1 ring-white/15 hover:bg-white/10 hover:text-white transition-colors"
              aria-label="Start a new chat"
              title="New chat"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => requestClose()}
            className="h-9 w-9 flex items-center justify-center rounded-full text-stone-200 ring-1 ring-white/15 hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Close chat"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      {/* Conversation */}
      <div
        ref={listRef}
        className="relative flex-1 overflow-y-auto overscroll-contain px-4 py-5 space-y-4 bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.045)_1px,transparent_0)] [background-size:18px_18px]"
        aria-live="polite"
      >
        {turns.length === 0 ? (
          <div className="space-y-6">
            <div className="aris-rise pt-2 space-y-2" style={{ animationDelay: '200ms' }}>
              <span className="text-[10px] font-extrabold uppercase tracking-[0.32em] text-stone-400">ARVIIK Concierge</span>
              <h2 className="font-syne font-extrabold text-[26px] leading-[1.05] uppercase text-stone-950">
                Hey, I&apos;m Aris.
                <br />
                <span className="text-stone-400">What can I help you find?</span>
              </h2>
              <p className="text-[13px] text-stone-500 leading-relaxed max-w-[300px]">
                Sizing, the latest drop, delivery or exchanges. Ask anything, or start here.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {QUICK_ACTIONS.map((a, i) => {
                const Icon = a.icon;
                return (
                  <button
                    key={a.label}
                    type="button"
                    onClick={() => send(a.prompt)}
                    style={{ animationDelay: `${300 + i * 70}ms` }}
                    className="aris-rise group text-left p-3.5 rounded-2xl bg-white ring-1 ring-black/[0.06] shadow-[0_6px_20px_-12px_rgba(0,0,0,0.35)] hover:-translate-y-0.5 hover:shadow-[0_14px_28px_-14px_rgba(0,0,0,0.45)] hover:ring-black/15 transition-all"
                  >
                    <span className="h-9 w-9 rounded-xl bg-stone-950 flex items-center justify-center mb-3 group-hover:bg-lime-400 transition-colors">
                      <Icon className="h-4 w-4 text-lime-400 group-hover:text-stone-950 transition-colors" />
                    </span>
                    <span className="block text-[12px] font-extrabold uppercase tracking-wider text-stone-950">{a.label}</span>
                    <span className="block text-[11px] text-stone-500 mt-0.5 leading-snug">{a.hint}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          turns.map((t, i) => {
            const firstOfRun = t.role === 'assistant' && turns[i - 1]?.role !== 'assistant';
            return t.role === 'assistant' && !t.content && busy && i === turns.length - 1 ? (
              <TypingDots key={i} />
            ) : (
              <Bubble key={i} role={t.role} content={t.content} showAvatar={firstOfRun} onLinkClick={onLinkClick} />
            );
          })
        )}
      </div>

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="relative px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-[#f6f5f2] via-[#f6f5f2] to-[#f6f5f2]/0"
      >
        <div className="flex items-end gap-2 bg-white rounded-[22px] pl-4 pr-1.5 py-1.5 ring-1 ring-black/[0.08] shadow-[0_10px_30px_-14px_rgba(0,0,0,0.4)] focus-within:ring-2 focus-within:ring-lime-400 transition-shadow">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            maxLength={MAX_CHARS}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder="Ask Aris anything…"
            aria-label="Message Aris"
            className="flex-1 resize-none bg-transparent py-2 text-base sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none max-h-28"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            aria-label="Send"
            className="h-9 w-9 flex-shrink-0 rounded-full bg-lime-400 text-stone-950 flex items-center justify-center shadow-[0_6px_14px_-6px_rgba(132,204,22,0.9)] hover:bg-lime-300 active:scale-90 disabled:bg-stone-200 disabled:text-stone-400 disabled:shadow-none transition-all"
          >
            <ArrowUp className="h-4 w-4 stroke-[2.5]" />
          </button>
        </div>
        <p className="text-[9px] text-stone-400 font-semibold text-center mt-2 tracking-wide">
          ARVIIK · Answers from our store info · For order help, WhatsApp us
        </p>
      </form>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-end gap-2" aria-label="Aris is typing">
      <ArisMark className="h-7 w-7 text-[11px] flex-shrink-0" />
      <div className="flex items-center gap-1.5 bg-white ring-1 ring-black/[0.06] shadow-[0_6px_18px_-12px_rgba(0,0,0,0.35)] rounded-[20px] rounded-bl-md px-4 py-3.5">
        {[0, 1, 2].map((i) => (
          <span key={i} className="aris-dot h-1.5 w-1.5 rounded-full bg-stone-950" style={{ animationDelay: `${i * 140}ms` }} />
        ))}
      </div>
    </div>
  );
}

function Bubble({ role, content, showAvatar = false, onLinkClick }: Turn & { showAvatar?: boolean; onLinkClick: () => void }) {
  const mine = role === 'user';
  if (mine) {
    return (
      <div className="aris-msg flex justify-end">
        <div className="max-w-[82%] text-[13.5px] leading-relaxed px-4 py-2.5 rounded-[20px] rounded-br-md break-words whitespace-pre-wrap text-white bg-gradient-to-br from-stone-800 to-stone-950 shadow-[0_10px_24px_-14px_rgba(0,0,0,0.7)]">
          {content}
        </div>
      </div>
    );
  }
  return (
    <div className="aris-msg flex items-end gap-2">
      {showAvatar ? <ArisMark className="h-7 w-7 text-[11px] flex-shrink-0" /> : <span className="w-7 flex-shrink-0" />}
      <div className="max-w-[82%] text-[13.5px] leading-relaxed px-4 py-3 rounded-[20px] rounded-bl-md break-words text-stone-800 bg-white ring-1 ring-black/[0.06] shadow-[0_8px_22px_-14px_rgba(0,0,0,0.35)]">
        <RichText text={content} onLinkClick={onLinkClick} />
      </div>
    </div>
  );
}

// Tiny, safe renderer for Aris's replies: **bold**, [text](link) and "- "
// bullet lines. Builds React elements (no HTML injection). Only site paths,
// mailto:, tel: and WhatsApp links become clickable.
function RichText({ text, onLinkClick }: { text: string; onLinkClick: () => void }) {
  const blocks: React.ReactNode[] = [];
  let bullets: string[] = [];
  const flush = () => {
    if (bullets.length) {
      blocks.push(
        <ul key={`ul-${blocks.length}`} className="list-disc pl-4 space-y-1 my-1">
          {bullets.map((b, i) => (
            <li key={i}>{inline(b, onLinkClick)}</li>
          ))}
        </ul>
      );
      bullets = [];
    }
  };

  text.split('\n').forEach((line) => {
    const bullet = line.match(/^\s*[-*•]\s+(.*)$/);
    if (bullet) {
      bullets.push(bullet[1]);
      return;
    }
    flush();
    if (line.trim()) blocks.push(<p key={`p-${blocks.length}`} className="my-1 first:mt-0 last:mb-0">{inline(line, onLinkClick)}</p>);
  });
  flush();
  return <>{blocks}</>;
}

function safeHref(href: string): string | null {
  if (/^\/(?![\/\\])/.test(href)) return href;
  if (/^(mailto:|tel:)/i.test(href)) return href;
  if (/^https:\/\/(wa\.me|api\.whatsapp\.com)\//i.test(href)) return href;
  const own = href.match(/^https:\/\/(www\.)?arviik\.in(\/[^\s]*)?$/i);
  if (own) return own[2] || '/';
  return null;
}

function inline(text: string, onLinkClick: () => void): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1]) {
      out.push(<strong key={m.index} className="font-bold text-stone-950">{m[1]}</strong>);
    } else {
      const href = safeHref(m[3]);
      if (!href) out.push(m[2]);
      else if (href.startsWith('/'))
        out.push(
          <Link key={m.index} href={href} onClick={onLinkClick} className="font-bold text-stone-950 underline underline-offset-2">
            {m[2]}
          </Link>
        );
      else
        out.push(
          <a key={m.index} href={href} target="_blank" rel="noopener noreferrer" className="font-bold text-stone-950 underline underline-offset-2">
            {m[2]}
          </a>
        );
    }
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}
