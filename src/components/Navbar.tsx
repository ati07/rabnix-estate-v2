'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  MapPin, 
  Heart, 
  Sparkles, 
  PlusCircle,
  TrendingUp,
  ChevronDown, 
  Search, 
  Phone, 
  User, 
  Users,
  Menu, 
  X, 
  ShieldCheck,
  Home,
  Building,
  Key,
  LogOut,
  UserCheck,
  Bookmark,
  FileText
} from 'lucide-react';
import { CityInfo, ListingType } from '@/lib/types';
import { CITIES_DATA } from '@/lib/realEstateData';
import { useAuth } from '@/lib/authContext';
import { BrandLogo } from '@/components/BrandLogo';

interface NavbarProps {
  selectedCity: CityInfo;
  onOpenCitySelector: () => void;
  onSelectListingType: (type: ListingType) => void;
  currentListingType: ListingType;
  shortlistCount: number;
  onOpenShortlist: () => void;
  onOpenPostProperty: () => void;
  onOpenAiValuation: () => void;
  onOpenAiGenie: () => void;
  onOpenAuthModal?: (mode?: 'signin' | 'signup') => void;
}

export function Navbar({
  selectedCity,
  onOpenCitySelector,
  onSelectListingType,
  currentListingType,
  shortlistCount,
  onOpenShortlist,
  onOpenPostProperty,
  onOpenAiValuation,
  onOpenAiGenie,
  onOpenAuthModal
}: NavbarProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleNavClick = (type: ListingType) => {
    onSelectListingType(type);
    setMobileMenuOpen(false);
    setActiveDropdown(null);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white shadow-xs border-b border-[#E2E8F0]">
      {/* Top Mini Bar */}
      <div className="bg-[#0F2A43] text-slate-300 text-xs py-1.5 px-4 sm:px-8 border-b border-[#163b5c]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="hidden md:inline text-slate-300 font-medium">
              India&apos;s No. 1 Property Portal
            </span>
            <div className="flex items-center gap-1.5 bg-[#163b5c]/80 px-2 py-0.5 rounded text-white text-[11px] font-medium border border-white/10">
              <ShieldCheck className="w-3.5 h-3.5 text-[#22C39A]" />
              <span>100% Verified Listings & RERA Registered Projects</span>
            </div>
          </div>

          <div className="flex items-center space-x-5 text-slate-200 text-xs font-medium">
            {/* <button 
              id="nav-mb-advice-btn"
              onClick={onOpenAiValuation}
              className="hover:text-[#22C39A] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <TrendingUp className="w-3.5 h-3.5 text-[#22C39A]" />
              <span>AI Property Valuation</span>
            </button> */}
            {/* Top Bar Auth Quick Link */}
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3 text-slate-200 hidden md:flex">
                <Link href="/dashboard" className="flex items-center gap-1.5 hover:text-[#22C39A] transition-colors">
                  <span className="w-2 h-2 rounded-full bg-[#22C39A]"></span>
                  <span>Dashboard: <strong className="text-white">{user.name.split(' ')[0]}</strong> ({user.role})</span>
                </Link>
                {user.role === 'admin' && (
                  <Link href="/admin" className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold hover:bg-amber-500/30">
                    Admin Panel
                  </Link>
                )}
              </div>
            ) : (
              <Link
                id="nav-topbar-signin-btn"
                href="/auth?mode=signin"
                className="hover:text-[#22C39A] flex items-center gap-1 transition-colors hidden md:flex"
              >
                <User className="w-3.5 h-3.5 text-[#22C39A]" />
                <span>Sign In / Sign Up</span>
              </Link>
            )}

            <div className="flex items-center gap-1.5 text-slate-400 border-l border-[#163b5c] pl-4 hidden md:flex">
              <Phone className="w-3 h-3 text-slate-400" />
              <span>Toll Free: +91 79915 49436</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18 gap-4">
          
          {/* Brand Logo & City Selector */}
          <div className="flex items-center gap-3 sm:gap-5 shrink-0">
            <div 
              id="nav-brand-logo"
              onClick={() => handleNavClick('buy')}
              className="cursor-pointer flex items-center gap-2 group select-none shrink-0"
            >
              {/* Brand Logo */}
              <BrandLogo variant="onLight" priority className="h-9 sm:h-10 w-auto" />
            </div>

            {/* City Selector Pill */}
            <button
              id="nav-city-selector-btn"
              onClick={onOpenCitySelector}
              className="flex items-center gap-1.5 bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] text-[#172033] px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all shadow-xs hover:border-[#CBD5E1] shrink-0 whitespace-nowrap"
            >
              <MapPin className="w-3.5 h-3.5 text-[#18A67D] shrink-0" />
              <span>{selectedCity.name}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-0.5 xl:space-x-1 text-xs xl:text-sm font-semibold text-[#172033]">
            <button
              id="nav-link-buy"
              onClick={() => handleNavClick('buy')}
              className={`px-2.5 xl:px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                currentListingType === 'buy'
                  ? 'text-[#0E7C5D] bg-[#E7F6F1] font-bold'
                  : 'hover:text-[#18A67D] hover:bg-[#F8FAFC]'
              }`}
            >
              Buy
            </button>

            <button
              id="nav-link-rent"
              onClick={() => handleNavClick('rent')}
              className={`px-2.5 xl:px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                currentListingType === 'rent'
                  ? 'text-[#0E7C5D] bg-[#E7F6F1] font-bold'
                  : 'hover:text-[#18A67D] hover:bg-[#F8FAFC]'
              }`}
            >
              Rent
            </button>

            <button
              id="nav-link-commercial"
              onClick={() => handleNavClick('commercial')}
              className={`px-2.5 xl:px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                currentListingType === 'commercial'
                  ? 'text-[#0E7C5D] bg-[#E7F6F1] font-bold'
                  : 'hover:text-[#18A67D] hover:bg-[#F8FAFC]'
              }`}
            >
              Commercial
            </button>

            <button
              id="nav-link-plot"
              onClick={() => handleNavClick('plot')}
              className={`px-2.5 xl:px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                currentListingType === 'plot'
                  ? 'text-[#0E7C5D] bg-[#E7F6F1] font-bold'
                  : 'hover:text-[#18A67D] hover:bg-[#F8FAFC]'
              }`}
            >
              Plots / Land
            </button>

            {/* <Link
              href="/collections"
              className="px-2.5 xl:px-3 py-1.5 rounded-lg whitespace-nowrap hover:text-[#18A67D] hover:bg-[#F8FAFC] transition-colors font-semibold"
            >
              Collections
            </Link> */}

            {/* <Link
              href="/builders"
              className="px-2.5 xl:px-3 py-1.5 rounded-lg whitespace-nowrap hover:text-[#18A67D] hover:bg-[#F8FAFC] transition-colors font-semibold"
            >
              Builders & Projects
            </Link> */}

            <button
              id="nav-link-pg"
              onClick={() => handleNavClick('pg')}
              className={`hidden xl:inline-block px-2.5 xl:px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                currentListingType === 'pg'
                  ? 'text-[#0E7C5D] bg-[#E7F6F1] font-bold'
                  : 'hover:text-[#18A67D] hover:bg-[#F8FAFC]'
              }`}
            >
              PG / Co-Living
            </button>

            {/* More Menu (holds PG / Co-Living below xl, where it isn't a direct link) */}
            <div className="relative inline-block xl:hidden">
              <button
                id="nav-more-dropdown-trigger"
                onClick={() => setActiveDropdown(activeDropdown === 'more' ? null : 'more')}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg whitespace-nowrap text-[#172033] hover:text-[#18A67D] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
              >
                <span>More</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#64748B]" />
              </button>

              {activeDropdown === 'more' && (
                <div 
                  className="absolute left-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-[#E2E8F0] p-1.5 z-50 animate-in fade-in space-y-0.5"
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <button
                    onClick={() => {
                      handleNavClick('pg');
                      setActiveDropdown(null);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#172033] hover:bg-[#E7F6F1] hover:text-[#0E7C5D] rounded-lg transition-colors cursor-pointer xl:hidden"
                  >
                    <Users className="w-4 h-4 text-[#18A67D]" />
                    <span>PG & Co-Living</span>
                  </button>
                </div>
              )}
            </div>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">

            {/* Shortlist Heart Button */}
            <button
              id="nav-shortlist-btn"
              onClick={onOpenShortlist}
              className="relative p-2 text-[#172033] hover:text-[#18A67D] hover:bg-[#F8FAFC] rounded-lg transition-colors border border-transparent hover:border-[#E2E8F0] cursor-pointer shrink-0"
              title="View Shortlisted Properties"
            >
              <Heart className="w-5 h-5" />
              {shortlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#18A67D] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {shortlistCount}
                </span>
              )}
            </button>

            {/* User Profile / Sign In Section */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  id="nav-user-profile-menu-btn"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] hover:bg-white hover:border-[#18A67D] transition-all cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-full bg-[#0F2A43] text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="hidden xl:block text-left">
                    <div className="text-xs font-bold text-[#0F2A43] leading-tight flex items-center gap-1">
                      <span>{user.name.split(' ')[0]}</span>
                      <span className="text-[9px] font-extrabold uppercase px-1 py-0.2 bg-[#E7F6F1] text-[#0E7C5D] rounded">
                        {user.role}
                      </span>
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-[#64748B] hidden sm:block" />
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] p-2 z-50 animate-in fade-in space-y-1 text-xs"
                    onMouseLeave={() => setIsUserMenuOpen(false)}
                  >
                    <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] mb-1">
                      <div className="font-bold text-[#0F2A43] text-sm">{user.name}</div>
                      <div className="text-[#64748B] text-[11px] truncate">{user.email}</div>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <span className="bg-[#18A67D] text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                          {user.role.toUpperCase()}
                        </span>
                        {user.isPhoneVerified && (
                          <span className="text-[10px] text-[#0E7C5D] font-bold flex items-center gap-0.5">
                            <ShieldCheck className="w-3 h-3 text-[#18A67D]" />
                            Verified
                          </span>
                        )}
                      </div>
                    </div>

                    <Link
                      href="/dashboard"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-[#172033] hover:bg-[#E7F6F1] hover:text-[#0E7C5D] rounded-lg transition-colors font-bold"
                    >
                      <UserCheck className="w-4 h-4 text-[#18A67D]" />
                      <span>My Dashboard</span>
                    </Link>

                    <Link
                      href="/properties"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-[#172033] hover:bg-[#F8FAFC] hover:text-[#18A67D] rounded-lg transition-colors font-semibold"
                    >
                      <Building className="w-4 h-4 text-[#18A67D]" />
                      <span>Browse All Properties</span>
                    </Link>

                    <button
                      onClick={() => {
                        onOpenShortlist();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-[#172033] hover:bg-[#F8FAFC] hover:text-[#18A67D] rounded-lg transition-colors cursor-pointer font-semibold"
                    >
                      <Bookmark className="w-4 h-4 text-[#18A67D]" />
                      <span>Shortlisted Properties ({shortlistCount})</span>
                    </button>

                    <Link
                      href="/post-property"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-[#172033] hover:bg-[#F8FAFC] hover:text-[#18A67D] rounded-lg transition-colors font-semibold"
                    >
                      <FileText className="w-4 h-4 text-[#18A67D]" />
                      <span>Post a New Listing (FREE)</span>
                    </Link>

                    {(user.role === 'builder' || user.role === 'admin') && (
                      <Link
                        href="/post-project"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-[#172033] hover:bg-[#F8FAFC] hover:text-[#18A67D] rounded-lg transition-colors font-semibold"
                      >
                        <Building2 className="w-4 h-4 text-[#18A67D]" />
                        <span>Submit a Project</span>
                      </Link>
                    )}

                    <Link
                      href="/auth?mode=signin"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-[#172033] hover:bg-[#F8FAFC] hover:text-[#18A67D] rounded-lg transition-colors font-semibold"
                    >
                      <User className="w-4 h-4 text-[#18A67D]" />
                      <span>Switch Account / Sign In</span>
                    </Link>

                    <div className="pt-1 border-t border-[#E2E8F0]">
                      <button
                        onClick={() => {
                          logout();
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer font-bold"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Link
                  id="nav-signin-btn"
                  href="/auth?mode=signin"
                  className="flex items-center gap-1.5 text-[#0F2A43] hover:text-[#18A67D] hover:bg-[#F8FAFC] px-2.5 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all border border-[#CBD5E1] shrink-0 whitespace-nowrap"
                >
                  <User className="w-4 h-4 text-[#18A67D]" />
                  <span>Sign In</span>
                </Link>
              </div>
            )}

            {/* Post Property FREE Button */}
            <Link
              id="nav-post-property-btn"
              href="/post-property"
              className="flex items-center gap-1.5 bg-[#18A67D] hover:bg-[#0E7C5D] text-white px-3 sm:px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all shadow-sm active:scale-95 shrink-0 whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4 shrink-0" />
              <span>Post Property</span>
              <span className="bg-[#0E7C5D] text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded tracking-wider ml-0.5 text-white shrink-0">
                FREE
              </span>
            </Link>

            {/* Mobile Menu Button */}
            <button
              id="nav-mobile-toggle-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-[#172033] hover:text-[#0F2A43] rounded-lg hover:bg-[#F1F5F9] shrink-0 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-[#E2E8F0] px-4 py-4 space-y-3 shadow-lg">
          
          {/* Mobile Auth Banner */}
          {isAuthenticated && user ? (
            <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#0F2A43] text-white flex items-center justify-center font-bold text-xs">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <div className="text-xs font-bold text-[#0F2A43]">{user.name}</div>
                  <div className="text-[10px] text-[#64748B]">{user.role.toUpperCase()}</div>
                </div>
              </div>
              <button
                onClick={() => logout()}
                className="text-xs text-red-600 font-bold hover:underline"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 pb-1">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (onOpenAuthModal) onOpenAuthModal('signin');
                }}
                className="py-2.5 px-3 bg-[#0F2A43] text-white rounded-xl text-xs font-bold text-center"
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (onOpenAuthModal) onOpenAuthModal('signup');
                }}
                className="py-2.5 px-3 bg-[#18A67D] text-white rounded-xl text-xs font-bold text-center"
              >
                Register FREE
              </button>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleNavClick('buy')}
              className={`p-2.5 rounded-lg text-left text-xs font-bold uppercase tracking-wider ${
                currentListingType === 'buy' ? 'bg-[#E7F6F1] text-[#0E7C5D] border border-[#18A67D]/30' : 'bg-[#F8FAFC] text-[#172033] border border-[#E2E8F0]'
              }`}
            >
              Buy Properties
            </button>
            <button
              onClick={() => handleNavClick('rent')}
              className={`p-2.5 rounded-lg text-left text-xs font-bold uppercase tracking-wider ${
                currentListingType === 'rent' ? 'bg-[#E7F6F1] text-[#0E7C5D] border border-[#18A67D]/30' : 'bg-[#F8FAFC] text-[#172033] border border-[#E2E8F0]'
              }`}
            >
              Rent Homes
            </button>
            <button
              onClick={() => handleNavClick('commercial')}
              className={`p-2.5 rounded-lg text-left text-xs font-bold uppercase tracking-wider ${
                currentListingType === 'commercial' ? 'bg-[#E7F6F1] text-[#0E7C5D] border border-[#18A67D]/30' : 'bg-[#F8FAFC] text-[#172033] border border-[#E2E8F0]'
              }`}
            >
              Commercial
            </button>
            <button
              onClick={() => handleNavClick('pg')}
              className={`p-2.5 rounded-lg text-left text-xs font-bold uppercase tracking-wider ${
                currentListingType === 'pg' ? 'bg-[#E7F6F1] text-[#0E7C5D] border border-[#18A67D]/30' : 'bg-[#F8FAFC] text-[#172033] border border-[#E2E8F0]'
              }`}
            >
              PG / Co-Living
            </button>
            <button
              onClick={() => handleNavClick('plot')}
              className={`p-2.5 rounded-lg text-left text-xs font-bold uppercase tracking-wider ${
                currentListingType === 'plot' ? 'bg-[#E7F6F1] text-[#0E7C5D] border border-[#18A67D]/30' : 'bg-[#F8FAFC] text-[#172033] border border-[#E2E8F0]'
              }`}
            >
              Plots & Lands
            </button>
            <Link
              href="/collections"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-lg text-left text-xs font-bold uppercase tracking-wider bg-[#F8FAFC] text-[#172033] border border-[#E2E8F0] hover:bg-[#E7F6F1] hover:text-[#0E7C5D]"
            >
              Curated Collections
            </Link>
            <Link
              href="/builders"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-lg text-left text-xs font-bold uppercase tracking-wider bg-[#F8FAFC] text-[#172033] border border-[#E2E8F0] hover:bg-[#E7F6F1] hover:text-[#0E7C5D] col-span-2"
            >
              Top Reputed Builders & Projects
            </Link>
          </div>

          <div className="pt-2 border-t border-[#E2E8F0] flex flex-col gap-2">
            <button
              onClick={() => {
                onOpenAiValuation();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-between p-2.5 bg-[#E7F6F1] text-[#0E7C5D] rounded-lg font-bold text-xs uppercase tracking-wider border border-[#18A67D]/20"
            >
              <span>AI Property Valuation & Trends</span>
              <TrendingUp className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                onOpenAiGenie();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-between p-2.5 bg-[#0F2A43] text-white rounded-lg font-bold text-xs uppercase tracking-wider"
            >
              <span>Ask BayBayt Genie AI Assistant</span>
              <Sparkles className="w-4 h-4 text-[#22C39A]" />
            </button>
            {isAuthenticated && (user?.role === 'builder' || user?.role === 'admin') && (
              <Link
                href="/post-project"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-between p-2.5 bg-[#E7F6F1] text-[#0E7C5D] rounded-lg font-bold text-xs uppercase tracking-wider border border-[#18A67D]/20"
              >
                <span>Submit a Project</span>
                <Building2 className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
