'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ShieldCheck, X, AlertCircle, CheckCircle2, Smartphone, ArrowRight } from 'lucide-react';

interface OtpVerifyModalProps {
  isOpen: boolean;
  /** The visitor's mobile number if already known (e.g. from an inquiry form).
   *  If it isn't a valid 10-digit number, the popup asks for one. */
  phone?: string;
  onClose: () => void;
  /** Fired once the OTP is confirmed and the contact-verify cookie is set. */
  onVerified: () => void;
  title?: string;
  subtitle?: string;
}

const RESEND_SECONDS = 30;
const tenDigits = (v: string) => v.replace(/\D/g, '').slice(-10);

// A focused popup that verifies the visitor controls their mobile number before
// a seller's contact is revealed. It drives /api/otp/request → /api/otp/confirm;
// the confirm sets the short-lived cookie the reveal endpoint requires.
export function OtpVerifyModal({ isOpen, phone = '', onClose, onVerified, title, subtitle }: OtpVerifyModalProps) {
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [mobile, setMobile] = useState('');
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [timer, setTimer] = useState(RESEND_SECONDS);

  // Initialize/reset whenever the popup opens. If a valid phone was passed in,
  // jump straight to sending the code.
  const openedRef = useRef(false);
  useEffect(() => {
    if (isOpen && !openedRef.current) {
      openedRef.current = true;
      const prefill = tenDigits(phone);
      setMobile(prefill);
      setCode('');
      setError(null);
      setInfo(null);
      setTimer(RESEND_SECONDS);
      if (prefill.length === 10) sendCode(prefill);
      else setStep('phone');
    }
    if (!isOpen) {
      openedRef.current = false;
      setStep('phone');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Resend countdown (only on the code step).
  useEffect(() => {
    if (!isOpen || step !== 'code' || timer <= 0) return;
    const t = setInterval(() => setTimer((p) => (p > 0 ? p - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [isOpen, step, timer]);

  const sendCode = async (toNumber?: string) => {
    const target = tenDigits(toNumber ?? mobile);
    if (target.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setError(null);
    setInfo(null);
    setSending(true);
    try {
      const res = await fetch('/api/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: target }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.success) {
        setStep('code');
        setTimer(RESEND_SECONDS);
        // In dev (no SMS provider) the server returns the code — prefill it.
        if (data.devCode) {
          setCode(data.devCode);
          setInfo(`Code sent to +91 ${target}. Dev code: ${data.devCode}`);
        } else {
          setInfo(`We sent a 6-digit code to +91 ${target}.`);
        }
      } else {
        setError(data?.error || 'Could not send the code. Please try again.');
      }
    } catch {
      setError('Could not send the code. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.replace(/\D/g, '').length < 4) {
      setError('Please enter the code sent to your mobile.');
      return;
    }
    setError(null);
    setVerifying(true);
    try {
      const res = await fetch('/api/otp/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ phone: mobile, otp: code }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.success) {
        onVerified();
      } else {
        setError(data?.error || 'Invalid code. Please try again.');
      }
    } catch {
      setError('Verification failed. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden text-[#172033]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#E7F6F1] text-[#18A67D] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-[#0F2A43]">{title || 'Verify your mobile number'}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#64748B] hover:text-[#0F2A43] rounded-lg hover:bg-[#F1F5F9] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs text-[#64748B] flex items-start gap-1.5">
            <Smartphone className="w-4 h-4 text-[#18A67D] shrink-0 mt-0.5" />
            <span>{subtitle || 'For your security and the seller’s, verify your number to view the contact details.'}</span>
          </p>

          {error && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {info && !error && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#E7F6F1] border border-[#18A67D]/30 text-[#0E7C5D] text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{info}</span>
            </div>
          )}

          {step === 'phone' ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendCode();
              }}
              className="space-y-3"
            >
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Mobile Number</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-xs font-bold text-[#0F2A43] pr-2 border-r border-[#CBD5E1]">+91</span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                    placeholder="98765 43210"
                    autoFocus
                    className="w-full pl-14 pr-4 py-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-sm font-bold text-[#172033] tracking-wide outline-none focus:bg-white focus:border-[#18A67D]"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={sending}
                className="w-full bg-[#18A67D] hover:bg-[#0E7C5D] text-white font-bold py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm disabled:opacity-50"
              >
                {sending ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Send OTP</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={verify} className="space-y-3">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Enter 6-Digit OTP</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••••"
                  autoFocus
                  className="w-full text-center tracking-[0.5em] text-lg font-black py-2.5 bg-[#F8FAFC] border-2 border-[#18A67D] rounded-xl text-[#0F2A43] outline-none focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <button
                  type="button"
                  onClick={() => { setStep('phone'); setInfo(null); setError(null); }}
                  className="text-[#64748B] hover:text-[#0F2A43] font-semibold cursor-pointer"
                >
                  Change number
                </button>
                {timer > 0 ? (
                  <span className="text-[#64748B]">Resend in {timer}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => sendCode()}
                    disabled={sending}
                    className="text-[#18A67D] hover:underline font-bold cursor-pointer disabled:opacity-50"
                  >
                    {sending ? 'Sending…' : 'Resend OTP'}
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={verifying || sending}
                className="w-full bg-[#18A67D] hover:bg-[#0E7C5D] text-white font-bold py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm disabled:opacity-50"
              >
                {verifying ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Verify &amp; View Contact</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
