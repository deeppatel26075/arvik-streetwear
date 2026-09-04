'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Mail, Phone, MapPin, Clock, HelpCircle, ArrowRight } from 'lucide-react';

// Lucide has no brand-specific marks — these mirror the same inline SVGs
// already used for the site's social icons in Footer.tsx, plus WhatsApp.
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12.001 2C6.478 2 2 6.477 2 12c0 1.876.52 3.63 1.42 5.13L2 22l4.995-1.393A9.943 9.943 0 0 0 12.001 22C17.523 22 22 17.523 22 12S17.523 2 12.001 2zm0 18.164a8.13 8.13 0 0 1-4.146-1.136l-.297-.177-3.096.864.828-3.024-.194-.31A8.13 8.13 0 0 1 3.836 12c0-4.508 3.657-8.164 8.165-8.164 4.507 0 8.164 3.656 8.164 8.164 0 4.508-3.657 8.164-8.164 8.164z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="5" /><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

const WHATSAPP_NUMBER = '919876543210'; // TODO: replace with the real WhatsApp Business number

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;
    setSubmitting(true);
    setError(null);

    const { error: insertError } = await supabase
      .from('contact_messages')
      .insert({ name, email, subject: subject || null, message });

    setSubmitting(false);
    if (insertError) {
      console.error('Failed to save contact message:', insertError);
      setError('Something went wrong sending your message. Please try again or reach us on WhatsApp.');
      return;
    }

    setSuccess(true);
    setName('');
    setEmail('');
    setSubject('');
    setMessage('');
    setTimeout(() => setSuccess(false), 4000);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2 max-w-md mx-auto">
        <span className="text-[10px] text-stone-400 font-extrabold tracking-[0.3em] uppercase block">
          We&apos;re Here to Help
        </span>
        <h1 className="font-syne font-extrabold text-2xl sm:text-3xl uppercase tracking-wider text-stone-950">
          Get In Touch
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 font-medium">
          Questions about an order, sizing, or anything else — drop us a message and we&apos;ll get back to you.
        </p>
      </div>

      {/* WhatsApp-first CTA */}
      <a
        href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hi%20ARVIIK!`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-4 p-5 sm:p-6 bg-stone-950 hover:bg-stone-900 rounded-xl transition-colors group"
      >
        <div className="w-12 h-12 rounded-full bg-[#25D366] flex items-center justify-center flex-shrink-0">
          <WhatsAppIcon className="h-6 w-6 text-white" />
        </div>
        <div className="flex-grow min-w-0">
          <p className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-white">
            Chat With Us on WhatsApp
          </p>
          <p className="text-[11px] sm:text-xs text-stone-400 font-medium mt-0.5">
            Fastest way to reach us — send &quot;Hi&quot; and we usually reply within a few hours.
          </p>
        </div>
        <ArrowRight className="h-5 w-5 text-white flex-shrink-0 group-hover:translate-x-1 transition-transform" />
      </a>

      {/* Info grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="flex items-start gap-3.5 p-4 bg-stone-50 border border-stone-200/80 rounded-xl">
          <Mail className="h-5 w-5 text-stone-700 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[9px] text-stone-400 font-extrabold uppercase tracking-wider">Email</p>
            <a href="mailto:support@arviik.com" className="text-xs sm:text-sm font-bold text-stone-900 hover:underline">
              support@arviik.com
            </a>
          </div>
        </div>

        <div className="flex items-start gap-3.5 p-4 bg-stone-50 border border-stone-200/80 rounded-xl">
          <Phone className="h-5 w-5 text-stone-700 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[9px] text-stone-400 font-extrabold uppercase tracking-wider">Phone</p>
            <p className="text-xs sm:text-sm font-bold text-stone-900">+91 98765 43210</p>
          </div>
        </div>

        <div className="flex items-start gap-3.5 p-4 bg-stone-50 border border-stone-200/80 rounded-xl">
          <Clock className="h-5 w-5 text-stone-700 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[9px] text-stone-400 font-extrabold uppercase tracking-wider">Support Hours</p>
            <p className="text-xs sm:text-sm font-bold text-stone-900">Mon–Sat, 10 AM – 6 PM</p>
          </div>
        </div>

        <div className="flex items-start gap-3.5 p-4 bg-stone-50 border border-stone-200/80 rounded-xl">
          <MapPin className="h-5 w-5 text-stone-700 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[9px] text-stone-400 font-extrabold uppercase tracking-wider">Address</p>
            <p className="text-xs sm:text-sm font-bold text-stone-900">ARVIIK HQ, Ahmedabad, Gujarat, India</p>
          </div>
        </div>
      </div>

      {/* Social row */}
      <div className="flex items-center justify-center gap-3">
        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-stone-200 flex items-center justify-center text-stone-500 hover:text-stone-950 hover:border-stone-950 transition-colors">
          <InstagramIcon className="h-4.5 w-4.5" />
        </a>
        <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-stone-200 flex items-center justify-center text-stone-500 hover:text-stone-950 hover:border-stone-950 transition-colors">
          <FacebookIcon className="h-4.5 w-4.5" />
        </a>
        <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-stone-200 flex items-center justify-center text-stone-500 hover:text-stone-950 hover:border-stone-950 transition-colors">
          <YoutubeIcon className="h-4.5 w-4.5" />
        </a>
      </div>

      {/* FAQ cross-link — self-service before the form */}
      <Link
        href="/faq"
        className="flex items-center justify-between gap-4 p-4 sm:p-5 bg-stone-50/80 border border-stone-200/80 rounded-xl hover:bg-stone-100/80 transition-colors"
      >
        <div className="flex items-center gap-3">
          <HelpCircle className="h-5 w-5 text-stone-700 flex-shrink-0" />
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-stone-900">Looking for a quick answer?</p>
            <p className="text-[11px] text-stone-500 font-medium">Orders, shipping, returns and more — check our FAQ first.</p>
          </div>
        </div>
        <ArrowRight className="h-4.5 w-4.5 text-stone-400 flex-shrink-0" />
      </Link>

      {/* Message form */}
      <form onSubmit={handleSubmit} className="p-5 sm:p-6 bg-white border border-stone-200/80 rounded-xl space-y-4">
        <div className="border-b border-stone-200 pb-3">
          <h2 className="font-syne font-extrabold text-sm uppercase tracking-wider text-stone-900">
            Or Send Us a Message
          </h2>
          <p className="text-[11px] text-stone-500 font-medium mt-0.5">
            Prefer email? Fill this out and we&apos;ll get back to you at the address you provide.
          </p>
        </div>

        {success && (
          <p className="bg-emerald-50 text-emerald-700 text-[11px] font-bold p-3 border border-emerald-200 rounded-lg uppercase tracking-wider">
            Message sent — we&apos;ll get back to you soon.
          </p>
        )}
        {error && (
          <p className="bg-red-50 text-red-700 text-[11px] font-bold p-3 border border-red-200 rounded-lg uppercase tracking-wider">
            {error}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] text-stone-600 font-bold uppercase tracking-wider block">Your Name</label>
            <input
              type="text"
              required
              placeholder="Rishi Patel"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 px-3.5 py-2.5 text-xs focus:outline-none focus:border-stone-900 rounded-xs"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-stone-600 font-bold uppercase tracking-wider block">Email Address</label>
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 px-3.5 py-2.5 text-xs focus:outline-none focus:border-stone-900 rounded-xs"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-stone-600 font-bold uppercase tracking-wider block">Subject</label>
          <input
            type="text"
            placeholder="Order #, sizing question, etc."
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full bg-stone-50 border border-stone-200 px-3.5 py-2.5 text-xs focus:outline-none focus:border-stone-900 rounded-xs"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-stone-600 font-bold uppercase tracking-wider block">Your Message</label>
          <textarea
            required
            rows={4}
            placeholder="How can we help?"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full bg-stone-50 border border-stone-200 px-3.5 py-2.5 text-xs focus:outline-none focus:border-stone-900 rounded-xs resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-stone-950 hover:bg-stone-900 disabled:opacity-60 text-white text-xs font-extrabold uppercase tracking-widest px-6 py-3.5 rounded-xs transition-colors"
        >
          {submitting ? 'Sending…' : 'Send Message'}
        </button>
      </form>
    </div>
  );
}
