'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  X,
  Sparkles,
  Send,
  User,
  MapPin,
  CheckCircle,
  ArrowRight,
  UploadCloud
} from 'lucide-react';
import { Property } from '@/lib/types';
import type { GeniePropertyCard } from '@/lib/genie/propertySearch';
import { GENIE_LISTING_DRAFT_KEY, type GenieListingDraft } from '@/lib/genie/listingDraft';

interface Message {
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  properties?: GeniePropertyCard[];
  propertyDraft?: GenieListingDraft | null;
}

interface AiGenieChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  contextProperty?: Property | null;
}

export function AiGenieChatDrawer({
  isOpen,
  onClose,
  contextProperty
}: AiGenieChatDrawerProps) {
  const [messages, setMessages] = useState<Message[]>(() => {
    const initial: Message[] = [
      {
        sender: 'bot',
        text: `Welcome! I am **BayBayt Genie**, your AI Real Estate Advisor at BayBayt. I can **search our live listings** for you — just tell me the city, budget & BHK — or help with home loans, RERA rules, stamp duty and locality comparisons. What are you looking for?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
    if (contextProperty) {
      initial.push({
        sender: 'bot',
        text: `I noticed you're exploring **${contextProperty.title}** in ${contextProperty.locality}, ${contextProperty.city} priced at ${contextProperty.priceFormatted}. Ask me about this locality's price appreciation, RERA validity, or neighborhood connectivity!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    }
    return initial;
  });
  const router = useRouter();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastContextIdRef = useRef<string | null>(contextProperty?.id || null);

  useEffect(() => {
    if (contextProperty && contextProperty.id !== lastContextIdRef.current) {
      lastContextIdRef.current = contextProperty.id;
      const timer = setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'bot',
            text: `I noticed you're exploring **${contextProperty.title}** in ${contextProperty.locality}, ${contextProperty.city} priced at ${contextProperty.priceFormatted}. Ask me about this locality's price appreciation, RERA validity, or neighborhood connectivity!`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [contextProperty]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (!isOpen) return null;

  const quickPrompts = [
    'Show me 2 BHK flats for sale in Bangalore under ₹1 Cr',
    'Any owner-direct properties for rent in Pune?',
    'EMI for a ₹50 lakh loan at 8.5% for 20 years',
    'Explain RERA carpet area vs super built-up area rules in India'
  ];

  // Stash the Genie-prepared draft and open the pre-filled post-property wizard.
  // The user still adds photos and submits through the normal (auth + quota +
  // review) flow — the bot never publishes a listing directly.
  const handleReviewDraft = (draft: GenieListingDraft) => {
    try {
      sessionStorage.setItem(GENIE_LISTING_DRAFT_KEY, JSON.stringify(draft));
    } catch {
      /* ignore storage errors — the form just opens with its defaults */
    }
    onClose();
    router.push('/post-property');
  };

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = {
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/gemini/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat',
          payload: {
            userQuery: textToSend,
            contextProperty: contextProperty || undefined
          }
        })
      });

      const data = await res.json();
      if (data.success && data.reply) {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'bot',
            text: data.reply,
            properties: Array.isArray(data.properties) ? data.properties : undefined,
            propertyDraft: data.propertyDraft || undefined,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'bot',
            text: 'I apologize, I encountered a temporary issue while fetching market insights. Please try again.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: 'Network error connecting to BayBayt AI Advisor.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-white shadow-2xl flex flex-col border-l border-neutral-200 animate-slide-left">
      
      {/* Top Header */}
      <div className="bg-[#0F2A43] text-white p-4 flex items-center justify-between border-b border-[#163b5c] shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#18A67D] flex items-center justify-center text-white shadow-md">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-bold flex items-center gap-1.5">
              <span>BayBayt Genie</span>
              <span className="bg-[#18A67D] text-white text-[10px] uppercase font-black px-1.5 py-0.2 rounded-xs">AI</span>
            </div>
            <div className="text-[11px] text-slate-300">
              India&apos;s Smart Real Estate & Valuation Advisor by BayBayt
            </div>
          </div>
        </div>

        <button
          id="genie-drawer-close-btn"
          onClick={onClose}
          className="p-1 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F8FAFC]">
        
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'bot' && (
              <div className="w-7 h-7 rounded-full bg-[#0F2A43] text-[#22C39A] flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold shadow-xs">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
            )}

            <div
              className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-[#0F2A43] text-white rounded-br-xs shadow-xs'
                  : 'bg-white text-[#172033] border border-[#E2E8F0] rounded-bl-xs shadow-xs'
              }`}
            >
              <div className="whitespace-pre-line">{msg.text}</div>

              {/* Real, clickable listings returned by the search_properties tool */}
              {msg.properties && msg.properties.length > 0 && (
                <div className="mt-2.5 space-y-2">
                  {msg.properties.map((prop) => (
                    <button
                      key={prop.id}
                      onClick={() => {
                        onClose();
                        router.push(`/properties/${prop.id}`);
                      }}
                      className="w-full flex gap-2.5 text-left bg-[#F8FAFC] hover:bg-[#E7F6F1] border border-[#E2E8F0] hover:border-[#18A67D] rounded-xl p-2 transition-colors cursor-pointer group"
                    >
                      <div className="relative h-14 w-16 shrink-0 rounded-lg overflow-hidden bg-[#E2E8F0]">
                        {prop.image ? (
                          <Image
                            src={prop.image}
                            alt={prop.title}
                            fill
                            sizes="64px"
                            className="object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#94A3B8]">
                            <MapPin className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 text-[13px] font-bold text-[#172033] truncate">
                          <span>{prop.priceFormatted}</span>
                          {prop.isExclusiveOwner && (
                            <CheckCircle className="w-3 h-3 text-[#0E7C5D] shrink-0" />
                          )}
                        </div>
                        <div className="text-[11px] text-[#64748B] truncate">
                          {prop.bhk ? `${prop.bhk} BHK ` : ''}{prop.category}
                          {prop.carpetAreaSqFt ? ` · ${prop.carpetAreaSqFt} sqft` : ''}
                        </div>
                        <div className="text-[11px] text-[#64748B] truncate flex items-center gap-0.5">
                          <MapPin className="w-2.5 h-2.5 shrink-0" />
                          {prop.subLocality || prop.locality}, {prop.city}
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-[#94A3B8] group-hover:text-[#18A67D] self-center shrink-0 transition-colors" />
                    </button>
                  ))}
                </div>
              )}

              {/* Conversational post-a-property: hand off the prepared draft to
                  the pre-filled /post-property wizard. */}
              {msg.propertyDraft && (
                <button
                  onClick={() => handleReviewDraft(msg.propertyDraft!)}
                  className="mt-2.5 w-full flex items-center justify-center gap-2 bg-[#18A67D] hover:bg-[#0E7C5D] text-white text-xs font-bold px-3 py-2.5 rounded-xl transition-colors cursor-pointer shadow-xs"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Review &amp; publish listing</span>
                </button>
              )}

              <div
                className={`text-[10px] mt-1.5 text-right ${
                  msg.sender === 'user' ? 'text-slate-300' : 'text-[#64748B]'
                }`}
              >
                {msg.timestamp}
              </div>
            </div>

            {msg.sender === 'user' && (
              <div className="w-7 h-7 rounded-full bg-[#18A67D] text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-2.5 justify-start animate-fade-in">
            <div className="w-7 h-7 rounded-full bg-[#0F2A43] text-[#22C39A] flex items-center justify-center shrink-0 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
            </div>
            <div className="bg-white border border-[#E2E8F0] rounded-2xl rounded-bl-xs p-3 text-xs text-[#172033] shadow-xs flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#18A67D] animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-[#0F2A43] animate-bounce [animation-delay:0.2s]" />
              <div className="w-2 h-2 rounded-full bg-[#22C39A] animate-bounce [animation-delay:0.4s]" />
              <span>BayBayt Genie is formulating insights...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="p-2.5 bg-white border-t border-[#E2E8F0] overflow-x-auto whitespace-nowrap space-x-1.5 no-scrollbar">
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(prompt)}
            className="inline-block text-[11px] font-medium bg-[#F8FAFC] hover:bg-[#E7F6F1] hover:text-[#0E7C5D] text-[#172033] px-3 py-1.5 rounded-full transition-colors cursor-pointer border border-[#E2E8F0] shrink-0"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 bg-white border-t border-[#E2E8F0] flex items-center gap-2 shrink-0"
      >
        <input
          id="genie-chat-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about localities, loans, RERA, yields..."
          className="flex-1 text-xs bg-[#F8FAFC] rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-[#E7F6F1] focus:border-[#18A67D] border border-[#CBD5E1] font-medium text-[#172033]"
        />
        <button
          id="genie-chat-send-btn"
          type="submit"
          disabled={!input.trim() || loading}
          className="bg-[#18A67D] hover:bg-[#0E7C5D] text-white p-2.5 rounded-xl transition-colors disabled:opacity-40 cursor-pointer shadow-xs"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

    </div>
  );
}
