'use client';

import React, { useState } from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;
    setSubmitting(true);
    
    setTimeout(() => {
      setSubmitting(false);
      setSuccess(true);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
      setTimeout(() => setSuccess(false), 3000);
    }, 800);
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-8">
      {/* Header info */}
      <div className="space-y-1.5">
        <h1 className="font-bold text-xl uppercase tracking-widest text-[#111111]">
          GET IN TOUCH
        </h1>
        <p className="text-xs text-[#666666] font-medium leading-relaxed max-w-sm">
          We'd love to hear from you. Drop us a message and we'll get back to you.
        </p>
      </div>

      {/* Info card list */}
      <div className="apple-card p-5 space-y-4">
        <div className="flex items-start space-x-3.5 text-xs font-semibold text-[#666666]">
          <Mail className="h-5 w-5 text-[#111111] flex-shrink-0" />
          <div className="space-y-0.5">
            <p className="text-[#111111] uppercase font-bold tracking-wider text-[9px]">Email</p>
            <p>support@arviik.com</p>
          </div>
        </div>

        <div className="flex items-start space-x-3.5 text-xs font-semibold text-[#666666]">
          <Phone className="h-5 w-5 text-[#111111] flex-shrink-0" />
          <div className="space-y-0.5">
            <p className="text-[#111111] uppercase font-bold tracking-wider text-[9px]">Phone</p>
            <p>+91 98765 43210</p>
          </div>
        </div>

        <div className="flex items-start space-x-3.5 text-xs font-semibold text-[#666666]">
          <MapPin className="h-5 w-5 text-[#111111] flex-shrink-0" />
          <div className="space-y-0.5">
            <p className="text-[#111111] uppercase font-bold tracking-wider text-[9px]">Address</p>
            <p>ARVIIK HQ, India</p>
          </div>
        </div>

        {/* Social Icons row using SVG */}
        <div className="flex space-x-3.5 pt-2 border-t border-[#F7F7F7]">
          {/* Instagram */}
          <svg className="h-4 w-4 text-[#666666] hover:text-[#111111] cursor-pointer" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
          </svg>
          {/* Twitter */}
          <svg className="h-4 w-4 text-[#666666] hover:text-[#111111] cursor-pointer" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
          </svg>
          {/* Facebook */}
          <svg className="h-4 w-4 text-[#666666] hover:text-[#111111] cursor-pointer" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
          </svg>
        </div>
      </div>

      {/* Message Form */}
      <form onSubmit={handleSubmit} className="apple-card p-5 space-y-4">
        {success && (
          <p className="bg-[#16A34A]/10 text-[#16A34A] text-[9px] font-bold p-3 border border-[#16A34A]/25 rounded-[10px] uppercase tracking-widest">
            Message Sent Successfully!
          </p>
        )}

        <div className="space-y-1">
          <label className="text-[9px] text-[#666666] font-bold uppercase tracking-wider">
            Your Name
          </label>
          <input
            type="text"
            required
            placeholder="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="apple-input w-full text-xs"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[9px] text-[#666666] font-bold uppercase tracking-wider">
            Email Address
          </label>
          <input
            type="email"
            required
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="apple-input w-full text-xs"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[9px] text-[#666666] font-bold uppercase tracking-wider">
            Subject
          </label>
          <input
            type="text"
            required
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="apple-input w-full text-xs"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[9px] text-[#666666] font-bold uppercase tracking-wider">
            Your Message
          </label>
          <textarea
            required
            rows={4}
            placeholder="Your Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="apple-input w-full text-xs resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="apple-button w-full text-xs uppercase tracking-widest shadow-xs"
        >
          {submitting ? 'Sending...' : 'SEND MESSAGE'}
        </button>
      </form>
    </div>
  );
}
