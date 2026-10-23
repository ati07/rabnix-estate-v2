'use client';

import React, { useState, useEffect } from 'react';
import { 
  User, 
  Lock, 
  Mail, 
  Phone, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  CheckCircle2, 
  Building, 
  Home, 
  Briefcase, 
  Sparkles, 
  ArrowRight, 
  Key, 
  Check, 
  AlertCircle,
  HelpCircle,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { UserRole } from '@/lib/types';
import { LocationSelect } from '@/components/location/LocationSelect';
import { findStateForCity, DEFAULT_COUNTRY } from '@/lib/locationData';

interface AuthFormProps {
  initialMode?: 'signin' | 'signup';
  onSuccess?: () => void;
  isModal?: boolean;
}

export function AuthForm({ initialMode = 'signin', onSuccess, isModal = false }: AuthFormProps) {
  const { loginWithPassword, sendOtp, loginWithOtp, sendSignupPhoneOtp, sendSignupEmailOtp, signup, isLoading } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [signInMethod, setSignInMethod] = useState<'password' | 'otp'>('password');
  
  // Sign In Form States
  const [signInIdentifier, setSignInIdentifier] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signInPhone, setSignInPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(30);

  // Sign Up Form States
  const [selectedRole, setSelectedRole] = useState<UserRole>('buyer');
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpCity, setSignUpCity] = useState('Bangalore');
  const [signUpState, setSignUpState] = useState(() => findStateForCity('Bangalore')?.state || 'Karnataka');
  const [signUpCountry, setSignUpCountry] = useState(() => findStateForCity('Bangalore')?.country || DEFAULT_COUNTRY);
  const [signUpCompany, setSignUpCompany] = useState('');
  const [signUpRera, setSignUpRera] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Sign Up verification step (both phone & email proven before account creation)
  const [signupPhase, setSignupPhase] = useState<'details' | 'verify'>('details');
  const [signUpPhoneOtp, setSignUpPhoneOtp] = useState('');
  const [signUpEmailOtp, setSignUpEmailOtp] = useState('');
  const [signUpPhoneTimer, setSignUpPhoneTimer] = useState(0);
  const [signUpEmailTimer, setSignUpEmailTimer] = useState(0);
  const [isSendingCodes, setIsSendingCodes] = useState(false);

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  // Countdown timer for OTP
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (otpSent && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpSent, otpTimer]);

  // Resend countdowns for the sign-up phone & email codes.
  useEffect(() => {
    if (signUpPhoneTimer <= 0) return;
    const t = setInterval(() => setSignUpPhoneTimer((p) => (p > 0 ? p - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [signUpPhoneTimer]);

  useEffect(() => {
    if (signUpEmailTimer <= 0) return;
    const t = setInterval(() => setSignUpEmailTimer((p) => (p > 0 ? p - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [signUpEmailTimer]);

  const handleSendOtp = async () => {
    if (!signInPhone || signInPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number');
      return;
    }
    setErrorMessage(null);
    setSuccessMessage(null);
    const res = await sendOtp(signInPhone);
    if (!res.success) {
      setErrorMessage(res.error || 'Could not send the verification code. Please try again.');
      return;
    }
    setOtpSent(true);
    setOtpTimer(30);
    // In dev (no SMS provider), the server returns the code so the flow is
    // testable without a phone; prefill it for convenience.
    if (res.devCode) {
      setOtpCode(res.devCode);
      setSuccessMessage(`OTP sent to +91 ${signInPhone}. Dev code: ${res.devCode}`);
    } else {
      setSuccessMessage('OTP sent successfully to +91 ' + signInPhone);
    }
  };

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (signInMethod === 'password') {
      const res = await loginWithPassword(signInIdentifier, signInPassword);
      if (res.success) {
        setSuccessMessage('Successfully signed in! Welcome back.');
        if (onSuccess) {
          setTimeout(onSuccess, 600);
        }
      } else {
        setErrorMessage(res.error || 'Failed to sign in. Please check your credentials.');
      }
    } else {
      if (!otpSent) {
        await handleSendOtp();
        return;
      }
      const res = await loginWithOtp(signInPhone, otpCode);
      if (res.success) {
        setSuccessMessage('Mobile verified! Signed in successfully.');
        if (onSuccess) {
          setTimeout(onSuccess, 600);
        }
      } else {
        setErrorMessage(res.error || 'Invalid OTP. Please try again.');
      }
    }
  };

  // Step 1 → validate the details, then send a code to both the phone and the
  // email and advance to the verification step. The account is NOT created yet;
  // it only exists once both codes are confirmed (handleSignUpSubmit).
  const handleContinueToVerify = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!agreeTerms) {
      setErrorMessage('Please agree to the Terms of Service & Privacy Policy');
      return;
    }
    if (!signUpName.trim()) {
      setErrorMessage('Please enter your full name');
      return;
    }
    if (!signUpEmail.trim() || !signUpEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address');
      return;
    }
    if (!signUpPhone.trim() || signUpPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number');
      return;
    }
    if (signUpPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      return;
    }

    setIsSendingCodes(true);
    // Email first: it's the one that can hard-fail (already registered), so we
    // surface that before sending an SMS.
    const emailRes = await sendSignupEmailOtp(signUpEmail);
    if (!emailRes.success) {
      setIsSendingCodes(false);
      setErrorMessage(emailRes.error || 'Could not send the email verification code.');
      return;
    }
    const phoneRes = await sendSignupPhoneOtp(signUpPhone);
    setIsSendingCodes(false);
    if (!phoneRes.success) {
      setErrorMessage(phoneRes.error || 'Could not send the mobile verification code.');
      return;
    }

    setSignUpPhoneTimer(30);
    setSignUpEmailTimer(30);
    // In dev (no SMS/email provider) the codes are returned so the flow is
    // testable without real delivery; prefill them for convenience.
    setSignUpPhoneOtp(phoneRes.devCode || '');
    setSignUpEmailOtp(emailRes.devCode || '');
    setSignupPhase('verify');
    setSuccessMessage(
      phoneRes.devCode || emailRes.devCode
        ? `Codes generated (dev). Phone: ${phoneRes.devCode || '—'}, Email: ${emailRes.devCode || '—'}`
        : `Verification codes sent to +91 ${signUpPhone} and ${signUpEmail}.`
    );
  };

  const resendSignupPhoneOtp = async () => {
    setErrorMessage(null);
    const res = await sendSignupPhoneOtp(signUpPhone);
    if (!res.success) {
      setErrorMessage(res.error || 'Could not resend the mobile code.');
      return;
    }
    setSignUpPhoneTimer(30);
    if (res.devCode) setSignUpPhoneOtp(res.devCode);
    setSuccessMessage(`Mobile code resent to +91 ${signUpPhone}.`);
  };

  const resendSignupEmailOtp = async () => {
    setErrorMessage(null);
    const res = await sendSignupEmailOtp(signUpEmail);
    if (!res.success) {
      setErrorMessage(res.error || 'Could not resend the email code.');
      return;
    }
    setSignUpEmailTimer(30);
    if (res.devCode) setSignUpEmailOtp(res.devCode);
    setSuccessMessage(`Email code resent to ${signUpEmail}.`);
  };

  // Step 2 → both codes entered. The server verifies them before creating the
  // account, so an account never exists with an unverified phone or email.
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (signUpPhoneOtp.replace(/\D/g, '').length !== 6) {
      setErrorMessage('Enter the 6-digit code sent to your mobile.');
      return;
    }
    if (signUpEmailOtp.replace(/\D/g, '').length !== 6) {
      setErrorMessage('Enter the 6-digit code sent to your email.');
      return;
    }

    const res = await signup({
      name: signUpName,
      email: signUpEmail,
      phone: signUpPhone,
      role: selectedRole,
      city: signUpCity,
      state: signUpState,
      country: signUpCountry,
      companyName: signUpCompany,
      reraNumber: signUpRera,
      password: signUpPassword,
      phoneOtp: signUpPhoneOtp,
      emailOtp: signUpEmailOtp,
    });

    if (res.success) {
      setSuccessMessage(`Account created successfully as ${selectedRole.toUpperCase()}! Welcome to BayBayt.`);
      if (onSuccess) {
        setTimeout(onSuccess, 800);
      }
    } else {
      setErrorMessage(res.error || 'Failed to create account. Please try again.');
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      setErrorMessage('Please enter your registered email or phone');
      return;
    }
    setForgotSent(true);
    setSuccessMessage('Password reset link sent to ' + forgotEmail);
  };

  return (
    <div className="w-full bg-white text-[#172033]">
      
      {/* Top Header Toggle Tabs */}
      <div className="flex border-b border-[#E2E8F0] bg-[#F8FAFC]">
        <button
          type="button"
          id="auth-tab-signin"
          onClick={() => {
            setMode('signin');
            setSignupPhase('details');
            setErrorMessage(null);
            setSuccessMessage(null);
          }}
          className={`flex-1 py-3.5 text-center text-sm font-bold transition-all cursor-pointer border-b-2 ${
            mode === 'signin'
              ? 'border-[#18A67D] text-[#0E7C5D] bg-white'
              : 'border-transparent text-[#64748B] hover:text-[#0F2A43]'
          }`}
        >
          Sign In to Account
        </button>
        <button
          type="button"
          id="auth-tab-signup"
          onClick={() => {
            setMode('signup');
            setSignupPhase('details');
            setErrorMessage(null);
            setSuccessMessage(null);
          }}
          className={`flex-1 py-3.5 text-center text-sm font-bold transition-all cursor-pointer border-b-2 ${
            mode === 'signup'
              ? 'border-[#18A67D] text-[#0E7C5D] bg-white'
              : 'border-transparent text-[#64748B] hover:text-[#0F2A43]'
          }`}
        >
          Create New Account
        </button>
      </div>

      <div className="p-5 sm:p-7 space-y-5">
        
        {/* Banner Alert Messages */}
        {errorMessage && (
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#E7F6F1] border border-[#18A67D]/30 text-[#0E7C5D] text-xs font-semibold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#18A67D]" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* ================= MODE 1: SIGN IN ================= */}
        {mode === 'signin' && !showForgotPassword && (
          <div className="space-y-4">
            
            {/* Method Toggle: Email vs Phone OTP */}
            <div className="flex items-center p-1 bg-[#F1F5F9] rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setSignInMethod('password');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                  signInMethod === 'password'
                    ? 'bg-white text-[#0F2A43] shadow-xs'
                    : 'text-[#64748B] hover:text-[#0F2A43]'
                }`}
              >
                Password / Email
              </button>
              <button
                type="button"
                onClick={() => {
                  setSignInMethod('otp');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  signInMethod === 'otp'
                    ? 'bg-white text-[#0E7C5D] shadow-xs font-bold'
                    : 'text-[#64748B] hover:text-[#0F2A43]'
                }`}
              >
                <span>Mobile OTP</span>
                <span className="bg-[#18A67D] text-white text-[9px] px-1.5 py-0.2 rounded-full uppercase font-black">Instant</span>
              </button>
            </div>

            <form onSubmit={handleSignInSubmit} className="space-y-3.5">
              
              {/* Option A: Email & Password */}
              {signInMethod === 'password' && (
                <>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#172033] uppercase tracking-wider">
                      Email or Mobile Number
                    </label>
                    <div className="relative flex items-center">
                      <Mail className="absolute left-3.5 w-4 h-4 text-[#64748B]" />
                      <input
                        id="signin-email-input"
                        type="text"
                        value={signInIdentifier}
                        onChange={(e) => setSignInIdentifier(e.target.value)}
                        placeholder="e.g. rahul.sharma@example.com"
                        required
                        className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs sm:text-sm font-medium text-[#172033] focus:bg-white focus:border-[#18A67D] focus:ring-2 focus:ring-[#18A67D]/20 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-[#172033] uppercase tracking-wider">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-xs text-[#18A67D] hover:text-[#0E7C5D] font-bold cursor-pointer"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative flex items-center">
                      <Lock className="absolute left-3.5 w-4 h-4 text-[#64748B]" />
                      <input
                        id="signin-password-input"
                        type={showPassword ? 'text' : 'password'}
                        value={signInPassword}
                        onChange={(e) => setSignInPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                        className="w-full pl-10 pr-10 py-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs sm:text-sm font-medium text-[#172033] focus:bg-white focus:border-[#18A67D] focus:ring-2 focus:ring-[#18A67D]/20 outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 text-[#64748B] hover:text-[#172033] p-1"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Option B: Mobile Number OTP */}
              {signInMethod === 'otp' && (
                <>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#172033] uppercase tracking-wider">
                      Mobile Number
                    </label>
                    <div className="relative flex items-center">
                      <div className="absolute left-3 flex items-center gap-1 text-xs font-bold text-[#0F2A43] pr-2 border-r border-[#CBD5E1]">
                        <span>🇮🇳</span>
                        <span>+91</span>
                      </div>
                      <input
                        id="signin-phone-input"
                        type="tel"
                        maxLength={10}
                        value={signInPhone}
                        onChange={(e) => setSignInPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder="98765 43210"
                        required
                        className="w-full pl-20 pr-4 py-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs sm:text-sm font-bold text-[#172033] tracking-wide focus:bg-white focus:border-[#18A67D] focus:ring-2 focus:ring-[#18A67D]/20 outline-none transition-all"
                      />
                    </div>
                  </div>

                  {otpSent && (
                    <div className="space-y-1.5 p-3.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl animate-in fade-in space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#0F2A43]">Enter 6-Digit OTP</span>
                        <span className="text-[#64748B]">Code sent to +91 {signInPhone}</span>
                      </div>
                      <div className="relative">
                        <input
                          id="signin-otp-input"
                          type="text"
                          maxLength={6}
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                          placeholder="Enter OTP"
                          autoFocus
                          className="w-full text-center tracking-[0.5em] text-lg font-black py-2 bg-white border-2 border-[#18A67D] rounded-lg text-[#0F2A43] outline-none"
                        />
                      </div>
                      <div className="flex items-center justify-end text-xs">
                        {otpTimer > 0 ? (
                          <span className="text-[#64748B] text-[11px]">Resend in {otpTimer}s</span>
                        ) : (
                          <button
                            type="button"
                            onClick={handleSendOtp}
                            className="text-xs text-[#18A67D] hover:underline font-bold cursor-pointer"
                          >
                            Resend OTP
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                id="auth-submit-signin-btn"
                disabled={isLoading}
                className="w-full bg-[#18A67D] hover:bg-[#0E7C5D] text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{signInMethod === 'otp' && !otpSent ? 'Send OTP Verification Code' : 'Sign In to BayBayt'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

            </form>

          </div>
        )}

        {/* ================= FORGOT PASSWORD VIEW ================= */}
        {mode === 'signin' && showForgotPassword && (
          <div className="space-y-4 animate-in fade-in">
            <div className="text-center space-y-1">
              <div className="w-10 h-10 rounded-full bg-[#E7F6F1] text-[#18A67D] flex items-center justify-center mx-auto mb-2">
                <Key className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#0F2A43]">Reset Your Password</h3>
              <p className="text-xs text-[#64748B]">
                Enter your registered email address or mobile number and we will send you a recovery link.
              </p>
            </div>

            {forgotSent ? (
              <div className="p-4 bg-[#E7F6F1] border border-[#18A67D]/30 rounded-xl text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-[#18A67D] mx-auto" />
                <div className="text-xs font-bold text-[#0E7C5D]">Recovery Link Dispatched</div>
                <p className="text-[11px] text-slate-600">
                  We have sent instructions to <strong>{forgotEmail}</strong>. Please check your inbox and spam folder.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotSent(false);
                  }}
                  className="mt-2 text-xs font-bold text-[#0F2A43] hover:underline cursor-pointer"
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#172033] uppercase">Registered Email / Phone</label>
                  <input
                    type="text"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="e.g. rahul.sharma@example.com"
                    required
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs font-medium text-[#172033] outline-none focus:border-[#18A67D]"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-[#0F2A43] hover:bg-[#163b5c] text-white font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Send Recovery Link
                </button>
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(false)}
                    className="text-xs text-[#64748B] hover:text-[#0F2A43] font-semibold cursor-pointer"
                  >
                    Cancel & Return to Sign In
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ================= MODE 2: SIGN UP / REGISTRATION ================= */}
        {mode === 'signup' && (
          <form onSubmit={handleSignUpSubmit} className="space-y-4">

            {/* ===== STEP 1: Account details ===== */}
            {signupPhase === 'details' && (
            <>
            {/* Step 1: Select User Role */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#172033] uppercase tracking-wider">
                I am a:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'buyer', label: 'Buyer / Tenant', icon: Home, desc: 'Search & Buy' },
                  { id: 'owner', label: 'Property Owner', icon: Key, desc: 'Post Directly' },
                  { id: 'agent', label: 'Verified Agent', icon: Briefcase, desc: 'List & Close' },
                  { id: 'builder', label: 'Builder / Dev', icon: Building, desc: 'New Launches' }
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = selectedRole === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      id={`auth-role-${item.id}`}
                      onClick={() => setSelectedRole(item.id as UserRole)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-[#18A67D] bg-[#E7F6F1] ring-1 ring-[#18A67D]'
                          : 'border-[#CBD5E1] bg-[#F8FAFC] hover:border-[#18A67D]/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-[#18A67D]' : 'text-[#64748B]'}`} />
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#18A67D]" />}
                      </div>
                      <div>
                        <div className={`text-xs font-bold ${isSelected ? 'text-[#0E7C5D]' : 'text-[#172033]'}`}>
                          {item.label}
                        </div>
                        <div className="text-[10px] text-[#64748B]">
                          {item.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Basic Contact Info */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#172033] uppercase">Full Name *</label>
              <div className="relative flex items-center">
                <User className="absolute left-3 w-4 h-4 text-[#64748B]" />
                <input
                  id="signup-name-input"
                  type="text"
                  value={signUpName}
                  onChange={(e) => setSignUpName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  required
                  className="w-full pl-9 pr-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs sm:text-sm font-medium text-[#172033] focus:bg-white focus:border-[#18A67D] outline-none"
                />
              </div>
            </div>

            {/* Primary location — Country → State → City (city is searchable/add) */}
            <LocationSelect
              value={{ country: signUpCountry, state: signUpState, city: signUpCity }}
              onChange={(next) => {
                setSignUpCountry(next.country);
                setSignUpState(next.state);
                setSignUpCity(next.city);
              }}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#172033] uppercase">Email Address *</label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3 w-4 h-4 text-[#64748B]" />
                  <input
                    id="signup-email-input"
                    type="email"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    placeholder="rahul@example.com"
                    required
                    className="w-full pl-9 pr-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs sm:text-sm font-medium text-[#172033] focus:bg-white focus:border-[#18A67D] outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#172033] uppercase">Mobile Number *</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-xs font-bold text-[#64748B]">+91</span>
                  <input
                    id="signup-phone-input"
                    type="tel"
                    maxLength={10}
                    value={signUpPhone}
                    onChange={(e) => setSignUpPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="9876543210"
                    required
                    className="w-full pl-12 pr-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs sm:text-sm font-medium text-[#172033] focus:bg-white focus:border-[#18A67D] outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Optional Agent / Builder Business Fields */}
            {(selectedRole === 'agent' || selectedRole === 'builder') && (
              <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-2.5 animate-in fade-in">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#0F2A43]">
                  <ShieldCheck className="w-4 h-4 text-[#18A67D]" />
                  <span>Professional Verification Details</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#64748B] mb-0.5">
                      Agency / Firm Name
                    </label>
                    <input
                      type="text"
                      value={signUpCompany}
                      onChange={(e) => setSignUpCompany(e.target.value)}
                      placeholder="e.g. Prestige Realty Group"
                      className="w-full px-3 py-1.5 bg-white border border-[#CBD5E1] rounded-lg text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#64748B] mb-0.5">
                      State RERA Registration No. (Optional)
                    </label>
                    <input
                      type="text"
                      value={signUpRera}
                      onChange={(e) => setSignUpRera(e.target.value)}
                      placeholder="e.g. PRM/KA/RERA/1251/..."
                      className="w-full px-3 py-1.5 bg-white border border-[#CBD5E1] rounded-lg text-xs outline-none uppercase"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Password */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#172033] uppercase">Create Password *</label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 w-4 h-4 text-[#64748B]" />
                <input
                  id="signup-password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  className="w-full pl-9 pr-10 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs sm:text-sm font-medium text-[#172033] focus:bg-white focus:border-[#18A67D] outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-[#64748B] hover:text-[#172033] p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Terms checkbox */}
            <label className="flex items-start gap-2 text-xs text-[#64748B] cursor-pointer">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 rounded text-[#18A67D] focus:ring-[#18A67D] border-[#CBD5E1]"
              />
              <span>
                I agree to the <strong className="text-[#0F2A43]">Terms of Service</strong> & <strong className="text-[#0F2A43]">Privacy Policy</strong> and agree to receive updates via WhatsApp/SMS.
              </span>
            </label>

            {/* Continue → send verification codes */}
            <button
              type="button"
              id="auth-submit-signup-btn"
              onClick={handleContinueToVerify}
              disabled={isLoading || isSendingCodes}
              className="w-full bg-[#18A67D] hover:bg-[#0E7C5D] text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm disabled:opacity-50"
            >
              {isSendingCodes ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Continue to Verification</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
            </>
            )}

            {/* ===== STEP 2: Verify mobile & email ===== */}
            {signupPhase === 'verify' && (
              <div className="space-y-4">
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <ShieldCheck className="w-4 h-4 text-[#18A67D] shrink-0 mt-0.5" />
                  <p className="text-[11px] text-[#64748B] leading-relaxed">
                    We&rsquo;ve sent a 6-digit code to your mobile and your email. Enter both to finish creating your account.
                  </p>
                </div>

                {/* Mobile code */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-[#172033] uppercase">
                      <Phone className="w-3.5 h-3.5 text-[#18A67D]" /> Mobile code
                    </label>
                    <span className="text-[10px] text-[#64748B]">+91 {signUpPhone}</span>
                  </div>
                  <input
                    id="signup-phone-otp-input"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={signUpPhoneOtp}
                    onChange={(e) => setSignUpPhoneOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit code"
                    className="w-full text-center tracking-[0.4em] text-base font-black py-2.5 bg-white border-2 border-[#CBD5E1] rounded-lg text-[#0F2A43] outline-none focus:border-[#18A67D]"
                  />
                  <div className="flex items-center justify-end text-[11px]">
                    {signUpPhoneTimer > 0 ? (
                      <span className="text-[#64748B]">Resend in {signUpPhoneTimer}s</span>
                    ) : (
                      <button type="button" onClick={resendSignupPhoneOtp} className="flex items-center gap-1 text-[#18A67D] hover:underline font-bold cursor-pointer">
                        <RotateCcw className="w-3 h-3" /> Resend mobile code
                      </button>
                    )}
                  </div>
                </div>

                {/* Email code */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-[#172033] uppercase">
                      <Mail className="w-3.5 h-3.5 text-[#18A67D]" /> Email code
                    </label>
                    <span className="text-[10px] text-[#64748B] truncate max-w-[55%]">{signUpEmail}</span>
                  </div>
                  <input
                    id="signup-email-otp-input"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={signUpEmailOtp}
                    onChange={(e) => setSignUpEmailOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit code"
                    className="w-full text-center tracking-[0.4em] text-base font-black py-2.5 bg-white border-2 border-[#CBD5E1] rounded-lg text-[#0F2A43] outline-none focus:border-[#18A67D]"
                  />
                  <div className="flex items-center justify-end text-[11px]">
                    {signUpEmailTimer > 0 ? (
                      <span className="text-[#64748B]">Resend in {signUpEmailTimer}s</span>
                    ) : (
                      <button type="button" onClick={resendSignupEmailOtp} className="flex items-center gap-1 text-[#18A67D] hover:underline font-bold cursor-pointer">
                        <RotateCcw className="w-3 h-3" /> Resend email code
                      </button>
                    )}
                  </div>
                </div>

                {/* Create account (verifies both codes) */}
                <button
                  type="submit"
                  id="auth-submit-create-btn"
                  disabled={isLoading}
                  className="w-full bg-[#18A67D] hover:bg-[#0E7C5D] text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Verify & Create {selectedRole.toUpperCase()} Account</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => { setSignupPhase('details'); setErrorMessage(null); setSuccessMessage(null); }}
                  className="w-full text-xs text-[#64748B] hover:text-[#0F2A43] font-semibold cursor-pointer"
                >
                  ← Edit details
                </button>
              </div>
            )}

          </form>
        )}

        {/* Trust Badges Footer */}
        <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-[11px] text-[#64748B]">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#18A67D]" />
            <span>256-Bit SSL Encrypted & Private</span>
          </div>
          <div className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Trusted by 2.5M+ Users</span>
          </div>
        </div>

      </div>
    </div>
  );
}
