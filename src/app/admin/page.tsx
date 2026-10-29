'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Eye, 
  Trash2, 
  Building2, 
  UserCheck, 
  Users, 
  Search, 
  Filter, 
  Sparkles, 
  Layers, 
  MapPin, 
  ArrowLeft, 
  FileText, 
  Check, 
  X, 
  RotateCcw,
  IndianRupee,
  Activity,
  ArrowUpRight,
  UserX,
  TrendingUp,
  BarChart3,
  PieChart as PieIcon,
  ShieldAlert,
  SlidersHorizontal,
  Mail,
  Phone,
  Calendar,
  Lock,
  Unlock,
  AlertCircle,
  Download,
  RefreshCw,
  ExternalLink,
  MessageSquare,
  BadgeCheck,
  CheckSquare,
  LayoutDashboard,
  Menu,
  Shield,
  Settings,
  Pencil,
  UserPlus,
  Loader2,
  Save,
  Star,
  Award
} from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { isAdminRole, isSuperAdmin } from '@/lib/roles';
import { useProperties } from '@/lib/propertyContext';
import { Property, VerificationStatus, UserRole, UserProfile, SystemActivityLog } from '@/lib/types';
import type { FeaturedProjectItem } from '@/lib/homeSectionsData';
import { LocalitiesPanel } from '@/components/admin/LocalitiesPanel';
import {
  AdminActivityTrendChart,
  AdminUserBreakdownPieChart,
  AdminModerationStatusChart,
  AdminCityDistributionBarChart
} from '@/components/DashboardCharts';

export default function AdminPortalPage() {
  const {
    user,
    isAuthReady,
    users,
    activityLogs,
    toggleBlockUser,
    deleteUser,
    createUser,
    updateUser,
    grantListings,
    impersonateUser,
    logActivity,
    clearActivityLogs
  } = useAuth();

  // Superadmin is a strict superset of admin. The master controls below
  // (provisioning accounts, changing roles, deleting users, granting listing
  // quota) are gated to superadmins; regular admins keep moderation duties.
  const superAdmin = isSuperAdmin(user?.role);

  const router = useRouter();

  // Client-side guard (defense-in-depth alongside middleware.ts): once the
  // session check resolves, bounce anyone who isn't an admin so the portal
  // shell never renders for non-admins.
  useEffect(() => {
    if (isAuthReady && !isAdminRole(user?.role)) {
      router.replace(user ? '/dashboard' : '/auth');
    }
  }, [isAuthReady, user, router]);

  const {
    properties,
    inquiries,
    updateVerificationStatus,
    updateProperty,
    deleteProperty
  } = useProperties();

  // Navigation Tabs in Admin Suite
  const [activeTab, setActiveTab] = useState<'overview' | 'moderation' | 'projects' | 'localities' | 'users' | 'agents' | 'activity' | 'trends' | 'settings'>('overview');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Moderation Filters
  const [modFilterStatus, setModFilterStatus] = useState<VerificationStatus | 'all'>('all');
  const [modSearchQuery, setModSearchQuery] = useState('');

  // Project moderation (builder-submitted projects, Option C). Fetched directly
  // here since projects aren't part of the property context.
  const [projects, setProjects] = useState<FeaturedProjectItem[]>([]);
  const [projFilterStatus, setProjFilterStatus] = useState<'all' | 'pending' | 'under_review' | 'approved' | 'rejected'>('all');
  const [projSearchQuery, setProjSearchQuery] = useState('');
  const [rejectionModalProject, setRejectionModalProject] = useState<FeaturedProjectItem | null>(null);
  const [projRejectionReason, setProjRejectionReason] = useState('Project details or RERA registration could not be verified.');

  const loadProjects = React.useCallback(async () => {
    try {
      const res = await fetch('/api/projects?scope=all', { cache: 'no-store', credentials: 'same-origin' });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.success && Array.isArray(data.projects)) setProjects(data.projects);
    } catch { /* non-fatal */ }
  }, []);

  useEffect(() => {
    if (isAuthReady && isAdminRole(user?.role)) loadProjects();
  }, [isAuthReady, user?.role, loadProjects]);

  const updateProjectStatus = async (
    id: string,
    submissionStatus: 'approved' | 'pending' | 'under_review' | 'rejected',
    reason?: string,
  ) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, submissionStatus, rejectionReason: submissionStatus === 'rejected' ? reason : undefined } : p)));
    await fetch(`/api/projects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ submissionStatus, rejectionReason: reason }),
    }).catch(() => {});
  };

  const deleteProject = async (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    await fetch(`/api/projects/${id}`, { method: 'DELETE', credentials: 'same-origin' }).catch(() => {});
  };

  const updateProjectSection = async (id: string, section: 'featured' | 'top') => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, section } : p)));
    await fetch(`/api/projects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ section }),
    }).catch(() => {});
  };
  const [selectedPropertyModal, setSelectedPropertyModal] = useState<Property | null>(null);
  const [rejectionModalProperty, setRejectionModalProperty] = useState<Property | null>(null);
  const [rejectionReason, setRejectionReason] = useState('State RERA certificate could not be verified on the official real estate regulatory portal.');

  // User Management Filters
  const [userRoleFilter, setUserRoleFilter] = useState<UserRole | 'all'>('all');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'blocked'>('all');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [blockUserModalTarget, setBlockUserModalTarget] = useState<UserProfile | null>(null);
  const [blockCustomReason, setBlockCustomReason] = useState('Multiple policy violations or duplicate spam listings reported.');
  const [createUserModalOpen, setCreateUserModalOpen] = useState(false);
  const [editUserTarget, setEditUserTarget] = useState<UserProfile | null>(null);
  const [grantListingsTarget, setGrantListingsTarget] = useState<UserProfile | null>(null);

  // Preferred Agent curation. Agents are Users (role='agent'); admins decide who
  // appears in the public directory (isPreferredAgent) and edit their editorial
  // fields (badge, rating). The agents themselves manage the rest of their profile.
  const [agentSearchQuery, setAgentSearchQuery] = useState('');
  const [editAgentTarget, setEditAgentTarget] = useState<UserProfile | null>(null);

  // Activity Stream Filters
  const [activityFilterAction, setActivityFilterAction] = useState<string>('all');
  const [activitySearchQuery, setActivitySearchQuery] = useState('');

  // Toast / Banner Notifications
  const [actionSuccessBanner, setActionSuccessBanner] = useState<string | null>(null);

  const showBanner = (msg: string) => {
    setActionSuccessBanner(msg);
    setTimeout(() => setActionSuccessBanner(null), 4500);
  };

  // ----------------------------------------------------
  // METRICS & COMPUTATIONS
  // ----------------------------------------------------
  const totalListings = properties.length;
  const pendingCount = properties.filter((p) => p.verificationStatus === 'pending').length;
  const underReviewCount = properties.filter((p) => p.verificationStatus === 'under_review').length;
  const approvedCount = properties.filter((p) => p.verificationStatus === 'approved' || (!p.verificationStatus && p.isVerified)).length;
  const rejectedCount = properties.filter((p) => p.verificationStatus === 'rejected').length;

  const totalUsersCount = users.length;
  const blockedUsersCount = users.filter((u) => u.isBlocked).length;
  const activeUsersCount = totalUsersCount - blockedUsersCount;
  const agentsBuildersCount = users.filter((u) => u.role === 'agent' || u.role === 'builder').length;

  // Filtered Properties for Moderation
  const filteredProperties = useMemo(() => {
    return properties.filter((p) => {
      if (modFilterStatus !== 'all') {
        const pStatus = p.verificationStatus || (p.isVerified ? 'approved' : 'pending');
        if (pStatus !== modFilterStatus) return false;
      }
      if (modSearchQuery.trim()) {
        const q = modSearchQuery.toLowerCase();
        return (
          p.title.toLowerCase().includes(q) ||
          p.locality.toLowerCase().includes(q) ||
          p.city.toLowerCase().includes(q) ||
          (p.reraId && p.reraId.toLowerCase().includes(q)) ||
          p.postedBy.name.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [properties, modFilterStatus, modSearchQuery]);

  // Project moderation metrics & filtering (Option C).
  const projStatusOf = (p: FeaturedProjectItem) => p.submissionStatus || 'approved';
  const projPendingCount = projects.filter((p) => projStatusOf(p) === 'pending').length;
  const projUnderReviewCount = projects.filter((p) => projStatusOf(p) === 'under_review').length;
  const projApprovedCount = projects.filter((p) => projStatusOf(p) === 'approved').length;
  const projRejectedCount = projects.filter((p) => projStatusOf(p) === 'rejected').length;
  const projSubmittedCount = projects.filter((p) => p.submittedByUserId).length;

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (projFilterStatus !== 'all' && projStatusOf(p) !== projFilterStatus) return false;
      if (projSearchQuery.trim()) {
        const q = projSearchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.locality.toLowerCase().includes(q) ||
          p.city.toLowerCase().includes(q) ||
          p.builderName.toLowerCase().includes(q) ||
          (p.reraNumber ? p.reraNumber.toLowerCase().includes(q) : false)
        );
      }
      return true;
    });
  }, [projects, projFilterStatus, projSearchQuery]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (userRoleFilter !== 'all' && u.role !== userRoleFilter) return false;
      if (userStatusFilter === 'active' && u.isBlocked) return false;
      if (userStatusFilter === 'blocked' && !u.isBlocked) return false;
      if (userSearchQuery.trim()) {
        const q = userSearchQuery.toLowerCase();
        return (
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.phone.toLowerCase().includes(q) ||
          (u.companyName && u.companyName.toLowerCase().includes(q)) ||
          (u.reraNumber && u.reraNumber.toLowerCase().includes(q)) ||
          (u.city && u.city.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [users, userRoleFilter, userStatusFilter, userSearchQuery]);

  // Filtered Activity Logs
  const filteredLogs = useMemo(() => {
    return activityLogs.filter((log) => {
      if (activityFilterAction !== 'all' && !log.action.includes(activityFilterAction)) return false;
      if (activitySearchQuery.trim()) {
        const q = activitySearchQuery.toLowerCase();
        return (
          log.actorName.toLowerCase().includes(q) ||
          log.details.toLowerCase().includes(q) ||
          (log.targetTitle && log.targetTitle.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [activityLogs, activityFilterAction, activitySearchQuery]);

  // Chart Data Preparation
  const moderationDonutData = [
    { name: 'Approved (Green Seal)', value: approvedCount || 6 },
    { name: 'Under Review', value: underReviewCount || 2 },
    { name: 'Pending Review', value: pendingCount || 2 },
    { name: 'Rejected', value: rejectedCount || 1 }
  ];

  const userDistributionData = [
    { name: 'Buyers', value: users.filter((u) => u.role === 'buyer').length || 3 },
    { name: 'Individual Owners', value: users.filter((u) => u.role === 'owner').length || 2 },
    { name: 'RERA Agents', value: users.filter((u) => u.role === 'agent').length || 3 },
    { name: 'Builders / Developers', value: users.filter((u) => u.role === 'builder').length || 2 }
  ];

  const activityTrendData = [
    { date: 'Mon', newUploads: 4, verifiedCount: 3, inquiriesCount: 12 },
    { date: 'Tue', newUploads: 6, verifiedCount: 5, inquiriesCount: 19 },
    { date: 'Wed', newUploads: 5, verifiedCount: 4, inquiriesCount: 15 },
    { date: 'Thu', newUploads: 9, verifiedCount: 7, inquiriesCount: 28 },
    { date: 'Fri', newUploads: 11, verifiedCount: 9, inquiriesCount: 34 },
    { date: 'Sat', newUploads: 14, verifiedCount: 12, inquiriesCount: 46 },
    { date: 'Sun', newUploads: 8, verifiedCount: 8, inquiriesCount: 38 }
  ];

  const cityDistributionData = [
    { city: 'Bangalore', listings: 8, inquiries: 42 },
    { city: 'Mumbai', listings: 6, inquiries: 36 },
    { city: 'New Delhi', listings: 5, inquiries: 29 },
    { city: 'Hyderabad', listings: 4, inquiries: 18 },
    { city: 'Pune', listings: 3, inquiries: 14 }
  ];

  // ----------------------------------------------------
  // ACTION HANDLERS
  // ----------------------------------------------------
  const handleApproveListing = (prop: Property) => {
    updateVerificationStatus(prop.id, 'approved');
    logActivity({
      action: 'property_verified',
      actorName: user?.name || 'Admin',
      actorRole: 'Admin',
      details: `Awarded Green Verified Seal to "${prop.title}" (${prop.locality}, ${prop.city}).`,
      targetTitle: prop.title,
      targetId: prop.id,
      severity: 'success'
    });
    showBanner(`Approved "${prop.title}". The property is now live with the Verified Seal.`);
  };

  const handleMarkUnderReview = (prop: Property) => {
    updateVerificationStatus(prop.id, 'under_review');
    logActivity({
      action: 'property_verified',
      actorName: user?.name || 'Admin',
      actorRole: 'Admin',
      details: `Moved listing "${prop.title}" to Under Review status for document audit.`,
      targetTitle: prop.title,
      targetId: prop.id,
      severity: 'info'
    });
    showBanner(`Listing "${prop.title}" moved to Under Review.`);
  };

  // Toggle a promotion flag (admin only) that controls which curated home-page rail
  // a listing surfaces in: isFeatured -> Featured rail, isExclusiveOwner -> Owner rails.
  const handleTogglePromotion = (prop: Property, flag: 'isFeatured' | 'isExclusiveOwner') => {
    const next = !prop[flag];
    const label = flag === 'isFeatured' ? 'Featured' : 'Exclusive Owner';
    updateProperty(prop.id, { [flag]: next });
    logActivity({
      action: 'property_promoted',
      actorName: user?.name || 'Admin',
      actorRole: 'Admin',
      details: `${next ? 'Enabled' : 'Disabled'} ${label} promotion on "${prop.title}".`,
      targetTitle: prop.title,
      targetId: prop.id,
      severity: 'info'
    });
    showBanner(`${next ? 'Promoted' : 'Removed'} "${prop.title}" ${next ? 'into' : 'from'} the ${label} home rail.`);
  };

  const handleConfirmRejection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionModalProperty) return;
    updateVerificationStatus(rejectionModalProperty.id, 'rejected', rejectionReason);
    logActivity({
      action: 'property_rejected',
      actorName: user?.name || 'Admin',
      actorRole: 'Admin',
      details: `Rejected listing "${rejectionModalProperty.title}". Reason: ${rejectionReason}`,
      targetTitle: rejectionModalProperty.title,
      targetId: rejectionModalProperty.id,
      severity: 'warning'
    });
    showBanner(`Listing "${rejectionModalProperty.title}" rejected with feedback sent to owner.`);
    setRejectionModalProperty(null);
  };

  const handleConfirmBlockUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockUserModalTarget) return;
    toggleBlockUser(blockUserModalTarget.id, blockCustomReason);
    showBanner(`Suspended user "${blockUserModalTarget.name}" (${blockUserModalTarget.email}).`);
    setBlockUserModalTarget(null);
  };

  const handleUnblockUser = (u: UserProfile) => {
    toggleBlockUser(u.id);
    showBanner(`Reinstated user "${u.name}" to active standing.`);
  };

  // ----------------------------------------------------
  // PREFERRED AGENT CURATION (agents are Users, role='agent')
  // ----------------------------------------------------
  const agentUsers = useMemo(
    () => users.filter((u) => u.role === 'agent'),
    [users]
  );
  const preferredAgentCount = useMemo(
    () => agentUsers.filter((u) => u.isPreferredAgent).length,
    [agentUsers]
  );

  // Toggle whether an agent appears in the public directory. Reuses the admin
  // user PATCH, which refreshes the admin data set on success.
  const handleTogglePreferred = async (u: UserProfile) => {
    const next = !u.isPreferredAgent;
    const res = await updateUser(u.id, { isPreferredAgent: next });
    if (res.success) {
      showBanner(next
        ? `Added "${u.name}" to the Preferred Agents directory.`
        : `Removed "${u.name}" from the Preferred Agents directory.`);
    } else {
      showBanner(res.error || 'Failed to update agent.');
    }
  };

  const filteredAgents = useMemo(() => {
    const q = agentSearchQuery.trim().toLowerCase();
    if (!q) return agentUsers;
    return agentUsers.filter((a) =>
      a.name.toLowerCase().includes(q) ||
      (a.companyName || '').toLowerCase().includes(q) ||
      (a.city || '').toLowerCase().includes(q) ||
      (a.email || '').toLowerCase().includes(q) ||
      (a.areasServed || []).some((x) => x.toLowerCase().includes(q)) ||
      (a.specializations || []).some((x) => x.toLowerCase().includes(q))
    );
  }, [agentUsers, agentSearchQuery]);

  // While the session resolves, or while redirecting a non-admin away, render a
  // neutral placeholder instead of the admin shell.
  if (!isAuthReady || !isAdminRole(user?.role)) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex items-center gap-3 text-[#64748B] text-sm font-bold">
          <Loader2 className="w-5 h-5 animate-spin text-[#18A67D]" />
          <span>Verifying administrator access…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between">
      
      {/* Top Header */}
      <header className="w-full bg-[#0B1E30] text-white py-3.5 px-4 sm:px-8 sticky top-0 z-40 shadow-md border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="lg:hidden p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              aria-label="Toggle Admin Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <Link href="/" className="flex items-center gap-2.5 group select-none">
              <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 shadow-inner">
                <ShieldCheck className="w-5 h-5 text-[#18A67D]" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black tracking-tight text-white leading-none">
                  BayBayt <span className="text-[#18A67D]">Admin Command Suite</span>
                </span>
                <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase mt-0.5 hidden sm:inline">
                  Platform Moderation & Trust Engine
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/dashboard"
              className="text-xs font-bold text-white bg-white/10 hover:bg-white/20 px-3.5 py-1.5 rounded-xl border border-white/20 transition-all flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5 text-[#18A67D]" />
              <span className="hidden sm:inline">User Dashboard</span>
              <span className="sm:hidden">Dashboard</span>
            </Link>

            <Link
              href="/properties"
              className="text-xs font-bold text-slate-300 hover:text-white px-3 py-1.5 rounded-xl hover:bg-white/10 transition-all hidden sm:flex items-center gap-1"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Public Site</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container with Sidebar Layout */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col lg:flex-row gap-6 items-start flex-1">
        
        {/* Mobile Sidebar Toggle Bar */}
        <div className="lg:hidden w-full flex items-center justify-between bg-white p-3.5 rounded-2xl border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0F2A43] text-white flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-[#18A67D]" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#0F2A43] capitalize">
                Tab: {activeTab.replace('_', ' ')}
              </div>
              <div className="text-[10px] text-[#64748B]">Admin Command Suite</div>
            </div>
          </div>

          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="px-3 py-1.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs font-bold text-[#0F2A43] flex items-center gap-1.5 cursor-pointer"
          >
            <Menu className="w-3.5 h-3.5" />
            <span>{mobileSidebarOpen ? 'Close Menu' : 'Admin Menu'}</span>
          </button>
        </div>

        {/* ============================================================ */}
        {/* ADMIN SIDEBAR (DESKTOP & MOBILE DRAWER)                      */}
        {/* ============================================================ */}
        <aside
          className={`w-full lg:w-64 shrink-0 bg-white rounded-2xl border border-[#E2E8F0] shadow-xs p-4 flex flex-col space-y-4 lg:sticky lg:top-20 z-30 transition-all ${
            mobileSidebarOpen ? 'block' : 'hidden lg:block'
          }`}
        >
          {/* Admin Profile Header Card */}
          <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-[#0F2A43] to-[#173a5a] text-white rounded-xl shadow-xs">
            <div className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-[#18A67D] shrink-0 bg-slate-800">
              <Image
                src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                alt={user?.name || 'Admin'}
                fill
                className="object-cover"
                referrerPolicy="no-referrer"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#18A67D] border-2 border-[#0F2A43] rounded-full"></span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-extrabold text-xs text-white truncate flex items-center gap-1">
                <span>{user?.name || 'Platform Admin'}</span>
              </div>
              <div className="text-[10px] text-slate-300 truncate">{user?.email || 'admin@baybayt.in'}</div>
              <span className={`inline-flex items-center gap-1 mt-1 px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider border ${superAdmin ? 'bg-amber-400/20 text-amber-300 border-amber-400/30' : 'bg-[#18A67D]/20 text-[#22C39A] border-[#18A67D]/30'}`}>
                <ShieldCheck className="w-2.5 h-2.5" />
                {superAdmin ? 'SUPER ADMIN' : 'ADMIN'}
              </span>
            </div>
          </div>

          {/* Sidebar Navigation */}
          <nav className="space-y-1 text-xs font-semibold">
            {/* 1. Overview */}
            <button
              id="admin-sidebar-overview"
              onClick={() => {
                setActiveTab('overview');
                setMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-[#0F2A43] text-white font-black shadow-xs'
                  : 'hover:bg-[#F8FAFC] text-[#64748B] hover:text-[#0F2A43]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className={`w-4 h-4 ${activeTab === 'overview' ? 'text-[#22C39A]' : 'text-blue-600'}`} />
                <span>Overview & KPIs</span>
              </div>
            </button>

            {/* 2. Verification Queue */}
            <button
              id="admin-sidebar-moderation"
              onClick={() => {
                setActiveTab('moderation');
                setMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'moderation'
                  ? 'bg-[#0F2A43] text-white font-black shadow-xs'
                  : 'hover:bg-[#F8FAFC] text-[#64748B] hover:text-[#0F2A43]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck className={`w-4 h-4 ${activeTab === 'moderation' ? 'text-[#22C39A]' : 'text-emerald-600'}`} />
                <span>RERA Verification</span>
              </div>
              {(pendingCount + underReviewCount) > 0 && (
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                  activeTab === 'moderation'
                    ? 'bg-amber-400 text-[#0F2A43]'
                    : 'bg-amber-100 text-amber-900 animate-pulse'
                }`}>
                  {pendingCount + underReviewCount}
                </span>
              )}
            </button>

            {/* 3. Project Submissions (Option C) */}
            <button
              id="admin-sidebar-projects"
              onClick={() => {
                setActiveTab('projects');
                setMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'projects'
                  ? 'bg-[#0F2A43] text-white font-black shadow-xs'
                  : 'hover:bg-[#F8FAFC] text-[#64748B] hover:text-[#0F2A43]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Building2 className={`w-4 h-4 ${activeTab === 'projects' ? 'text-[#22C39A]' : 'text-sky-600'}`} />
                <span>Project Submissions</span>
              </div>
              {(projPendingCount + projUnderReviewCount) > 0 && (
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                  activeTab === 'projects'
                    ? 'bg-amber-400 text-[#0F2A43]'
                    : 'bg-amber-100 text-amber-900 animate-pulse'
                }`}>
                  {projPendingCount + projUnderReviewCount}
                </span>
              )}
            </button>

            {/* 3b. Popular Localities Curation */}
            <button
              id="admin-sidebar-localities"
              onClick={() => {
                setActiveTab('localities');
                setMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'localities'
                  ? 'bg-[#0F2A43] text-white font-black shadow-xs'
                  : 'hover:bg-[#F8FAFC] text-[#64748B] hover:text-[#0F2A43]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <MapPin className={`w-4 h-4 ${activeTab === 'localities' ? 'text-[#22C39A]' : 'text-rose-500'}`} />
                <span>Popular Localities</span>
              </div>
            </button>

            {/* 4. User & Block Control */}
            <button
              id="admin-sidebar-users"
              onClick={() => {
                setActiveTab('users');
                setMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-[#0F2A43] text-white font-black shadow-xs'
                  : 'hover:bg-[#F8FAFC] text-[#64748B] hover:text-[#0F2A43]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className={`w-4 h-4 ${activeTab === 'users' ? 'text-[#22C39A]' : 'text-indigo-600'}`} />
                <span>Users & Security</span>
              </div>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                activeTab === 'users' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
              }`}>
                {blockedUsersCount > 0 ? `${blockedUsersCount} Blocked` : totalUsersCount}
              </span>
            </button>

            {/* 4. Preferred Agent Catalog */}
            <button
              id="admin-sidebar-agents"
              onClick={() => {
                setActiveTab('agents');
                setMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'agents'
                  ? 'bg-[#0F2A43] text-white font-black shadow-xs'
                  : 'hover:bg-[#F8FAFC] text-[#64748B] hover:text-[#0F2A43]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Award className={`w-4 h-4 ${activeTab === 'agents' ? 'text-[#22C39A]' : 'text-teal-600'}`} />
                <span>Preferred Agents</span>
              </div>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                activeTab === 'agents' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
              }`}>
                {preferredAgentCount}
              </span>
            </button>

            {/* 5. Activity Stream */}
            <button
              id="admin-sidebar-activity"
              onClick={() => {
                setActiveTab('activity');
                setMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'activity'
                  ? 'bg-[#0F2A43] text-white font-black shadow-xs'
                  : 'hover:bg-[#F8FAFC] text-[#64748B] hover:text-[#0F2A43]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Activity className={`w-4 h-4 ${activeTab === 'activity' ? 'text-[#22C39A]' : 'text-emerald-600'}`} />
                <span>Audit & Activity Stream</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            </button>

            {/* 5. Platform Trends */}
            <button
              id="admin-sidebar-trends"
              onClick={() => {
                setActiveTab('trends');
                setMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'trends'
                  ? 'bg-[#0F2A43] text-white font-black shadow-xs'
                  : 'hover:bg-[#F8FAFC] text-[#64748B] hover:text-[#0F2A43]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <TrendingUp className={`w-4 h-4 ${activeTab === 'trends' ? 'text-[#22C39A]' : 'text-amber-600'}`} />
                <span>Growth & Analytics</span>
              </div>
              <BarChart3 className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* 6. Settings & Maintenance */}
            <button
              id="admin-sidebar-settings"
              onClick={() => {
                setActiveTab('settings');
                setMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-[#0F2A43] text-white font-black shadow-xs'
                  : 'hover:bg-[#F8FAFC] text-[#64748B] hover:text-[#0F2A43]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Settings className={`w-4 h-4 ${activeTab === 'settings' ? 'text-[#22C39A]' : 'text-slate-600'}`} />
                <span>Platform Settings</span>
              </div>
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </nav>

          {/* Shortcuts & Actions */}
          <div className="mt-2 pt-3 border-t border-[#E2E8F0] space-y-1.5 text-xs font-bold">
            <Link
              href="/dashboard"
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-[#0F2A43] transition-colors"
            >
              <span className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-[#18A67D]" />
                User Dashboard
              </span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>

            <Link
              href="/post-property"
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-[#0F2A43] transition-colors"
            >
              <span className="flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                Post New Property
              </span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>
          </div>
        </aside>

        {/* ============================================================ */}
        {/* MAIN ADMIN CONTENT AREA                                      */}
        {/* ============================================================ */}
        <main className="flex-1 min-w-0 space-y-6">
          
          {/* Success / Info Action Notification */}
          {actionSuccessBanner && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm font-bold flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{actionSuccessBanner}</span>
              </div>
              <button onClick={() => setActionSuccessBanner(null)} className="text-emerald-700 hover:text-emerald-950 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* TAB 0: ADMIN OVERVIEW & KPI SUMMARY                  */}
          {/* ---------------------------------------------------- */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Hero Banner */}
              <div className="bg-gradient-to-r from-[#0F2A43] to-[#163b5c] text-white rounded-2xl p-6 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-[#18A67D] text-[#0F2A43] text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                      Master Control Center
                    </span>
                    <span className="text-xs text-slate-300 flex items-center gap-1 font-mono">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                      Platform Operational
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                    Welcome to BayBayt Admin Command Suite
                  </h1>
                  <p className="text-xs text-slate-300 max-w-xl">
                    Real-time oversight over RERA compliance audits, seller identity verifications, user moderation, and transaction analytics.
                  </p>
                </div>

                <div className="flex items-center gap-2 self-stretch sm:self-auto">
                  <button
                    onClick={() => setActiveTab('moderation')}
                    className="flex-1 sm:flex-initial px-4 py-2.5 bg-[#18A67D] hover:bg-[#0E7C5D] text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Audit Queue ({pendingCount})</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('users')}
                    className="flex-1 sm:flex-initial px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Users className="w-4 h-4" />
                    <span>Users ({totalUsersCount})</span>
                  </button>
                </div>
              </div>

              {/* Top KPI Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                <div 
                  onClick={() => setActiveTab('moderation')}
                  className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-1 cursor-pointer hover:border-[#18A67D] transition-all group"
                >
                  <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">Total Listed</span>
                  <div className="text-2xl font-black text-[#0F2A43] group-hover:text-[#18A67D] transition-colors">{totalListings}</div>
                  <span className="text-[11px] text-[#64748B] font-medium">All properties</span>
                </div>

                <div 
                  onClick={() => {
                    setActiveTab('moderation');
                    setModFilterStatus('pending');
                  }}
                  className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200 shadow-xs space-y-1 cursor-pointer hover:bg-amber-100/80 transition-all"
                >
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider flex items-center justify-between">
                    <span>Pending Queue</span>
                    <Clock className="w-3.5 h-3.5 text-amber-700" />
                  </span>
                  <div className="text-2xl font-black text-amber-900">{pendingCount}</div>
                  <span className="text-[11px] text-amber-800 font-medium">Awaiting audit</span>
                </div>

                <div 
                  onClick={() => {
                    setActiveTab('moderation');
                    setModFilterStatus('under_review');
                  }}
                  className="bg-blue-50/80 p-4 rounded-2xl border border-blue-200 shadow-xs space-y-1 cursor-pointer hover:bg-blue-100/80 transition-all"
                >
                  <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider flex items-center justify-between">
                    <span>Under Review</span>
                    <Activity className="w-3.5 h-3.5 text-blue-700" />
                  </span>
                  <div className="text-2xl font-black text-blue-900">{underReviewCount}</div>
                  <span className="text-[11px] text-blue-800 font-medium">Field surveyor</span>
                </div>

                <div 
                  onClick={() => {
                    setActiveTab('users');
                    setUserStatusFilter('all');
                  }}
                  className="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-200 shadow-xs space-y-1 cursor-pointer hover:bg-emerald-100/80 transition-all"
                >
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center justify-between">
                    <span>Total Users</span>
                    <Users className="w-3.5 h-3.5 text-emerald-700" />
                  </span>
                  <div className="text-2xl font-black text-emerald-900">{totalUsersCount}</div>
                  <span className="text-[11px] text-emerald-800 font-medium">{activeUsersCount} Active</span>
                </div>

                <div 
                  onClick={() => {
                    setActiveTab('users');
                    setUserStatusFilter('blocked');
                  }}
                  className="bg-rose-50/80 p-4 rounded-2xl border border-rose-200 shadow-xs space-y-1 cursor-pointer hover:bg-rose-100/80 transition-all"
                >
                  <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider flex items-center justify-between">
                    <span>Blocked Users</span>
                    <UserX className="w-3.5 h-3.5 text-rose-700" />
                  </span>
                  <div className="text-2xl font-black text-rose-900">{blockedUsersCount}</div>
                  <span className="text-[11px] text-rose-800 font-medium">Suspended</span>
                </div>

                <div 
                  onClick={() => setActiveTab('activity')}
                  className="bg-[#0F2A43] text-white p-4 rounded-2xl border border-[#0F2A43] shadow-xs space-y-1 cursor-pointer hover:bg-[#153a5c] transition-all"
                >
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center justify-between">
                    <span>System Events</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  </span>
                  <div className="text-2xl font-black text-white">{activityLogs.length}</div>
                  <span className="text-[11px] text-slate-300 font-medium">Audit logs</span>
                </div>
              </div>

              {/* Quick Navigation Action Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div 
                  onClick={() => setActiveTab('moderation')}
                  className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs hover:border-[#18A67D] hover:shadow-md transition-all cursor-pointer space-y-2 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ShieldCheck className="w-5 h-5 text-amber-600" />
                  </div>
                  <h3 className="font-extrabold text-sm text-[#0F2A43]">RERA Verification Queue</h3>
                  <p className="text-xs text-[#64748B]">
                    {pendingCount} listings awaiting document check and Green Seal approval.
                  </p>
                  <div className="text-xs font-bold text-[#18A67D] flex items-center gap-1 pt-1">
                    <span>Open Moderation</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div 
                  onClick={() => setActiveTab('users')}
                  className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer space-y-2 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Users className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h3 className="font-extrabold text-sm text-[#0F2A43]">User & Anti-Fraud Center</h3>
                  <p className="text-xs text-[#64748B]">
                    Manage accounts, OTP validations, roles, and block abusive users.
                  </p>
                  <div className="text-xs font-bold text-indigo-600 flex items-center gap-1 pt-1">
                    <span>Manage Users</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div 
                  onClick={() => setActiveTab('activity')}
                  className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer space-y-2 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Activity className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h3 className="font-extrabold text-sm text-[#0F2A43]">Live Activity Stream</h3>
                  <p className="text-xs text-[#64748B]">
                    Immutable audit log of all uploads, verification actions, and logins.
                  </p>
                  <div className="text-xs font-bold text-emerald-600 flex items-center gap-1 pt-1">
                    <span>View Stream</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div 
                  onClick={() => setActiveTab('trends')}
                  className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs hover:border-amber-500 hover:shadow-md transition-all cursor-pointer space-y-2 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-5 h-5 text-amber-600" />
                  </div>
                  <h3 className="font-extrabold text-sm text-[#0F2A43]">Growth & Analytics</h3>
                  <p className="text-xs text-[#64748B]">
                    Velocity charts, Metro supply/demand, and user demographic insights.
                  </p>
                  <div className="text-xs font-bold text-amber-600 flex items-center gap-1 pt-1">
                    <span>Explore Charts</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              {/* Pending Verifications Quick List Preview */}
              <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-[#0F2A43]">
                      Urgent Verifications Awaiting Review
                    </h3>
                    <p className="text-xs text-[#64748B]">
                      Properties submitted recently requiring RERA and document validation.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('moderation')}
                    className="text-xs font-bold text-[#18A67D] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>View Full Queue ({pendingCount})</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {properties.filter(p => p.verificationStatus === 'pending' || p.verificationStatus === 'under_review').length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No pending verifications at this time. All listings have been audited.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {properties
                      .filter(p => p.verificationStatus === 'pending' || p.verificationStatus === 'under_review')
                      .slice(0, 4)
                      .map((prop) => (
                        <div key={prop.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-14 h-14 rounded-xl overflow-hidden relative shrink-0 bg-slate-100 border border-slate-200">
                              <Image
                                src={prop.images[0] || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=300&auto=format&fit=crop&q=80'}
                                alt={prop.title}
                                fill
                                className="object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${
                                  prop.verificationStatus === 'under_review' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-900'
                                }`}>
                                  {prop.verificationStatus === 'under_review' ? 'Under Review' : 'Pending Audit'}
                                </span>
                                <span className="text-xs font-bold text-[#18A67D]">{prop.priceFormatted}</span>
                              </div>
                              <h4 className="font-extrabold text-xs text-[#0F2A43] truncate max-w-sm">{prop.title}</h4>
                              <div className="text-[11px] text-slate-500">
                                {prop.locality}, {prop.city} • RERA: <span className="font-mono font-bold text-slate-700">{prop.reraId || 'NOT_DECLARED'}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <button
                              onClick={() => setSelectedPropertyModal(prop)}
                              className="px-2.5 py-1 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Audit</span>
                            </button>
                            <button
                              onClick={() => handleApproveListing(prop)}
                              className="px-3 py-1 rounded-lg bg-[#18A67D] hover:bg-[#0E7C5D] text-white text-xs font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                            >
                              <ShieldCheck className="w-3 h-3" />
                              <span>Approve Seal</span>
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

            </div>
          )}

        {/* ---------------------------------------------------- */}
        {/* TAB 1: VERIFICATION & MODERATION QUEUE               */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'moderation' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            
            {/* Search and Status Subtabs */}
            <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { id: 'all', label: `All Listed (${totalListings})` },
                    { id: 'pending', label: `Pending Queue (${pendingCount})` },
                    { id: 'under_review', label: `Under Review (${underReviewCount})` },
                    { id: 'approved', label: `Approved Seal (${approvedCount})` },
                    { id: 'rejected', label: `Rejected (${rejectedCount})` }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setModFilterStatus(tab.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        modFilterStatus === tab.id
                          ? 'bg-[#0F2A43] text-white shadow-xs'
                          : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] hover:text-[#0F2A43]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Box */}
              <div className="relative">
                <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-3" />
                <input
                  type="text"
                  value={modSearchQuery}
                  onChange={(e) => setModSearchQuery(e.target.value)}
                  placeholder="Search verification queue by Property Title, Locality, City, RERA ID, or Seller Name..."
                  className="w-full pl-9 pr-4 py-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs sm:text-sm font-medium outline-none focus:bg-white focus:border-[#18A67D]"
                />
              </div>
            </div>

            {/* Properties Queue List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-extrabold text-[#0F2A43]">
                <span>VERIFICATION ITEMS ({filteredProperties.length})</span>
                <span className="text-[#64748B]">Real-time RERA registry & document inspection engine</span>
              </div>

              {filteredProperties.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-[#E2E8F0] text-center space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-[#18A67D] mx-auto" />
                  <h3 className="text-base font-bold text-[#0F2A43]">No listings match this queue filter!</h3>
                  <p className="text-xs text-[#64748B]">All listings for status &apos;{modFilterStatus}&apos; have been processed.</p>
                  <button
                    onClick={() => setModFilterStatus('all')}
                    className="text-xs font-bold text-[#18A67D] underline cursor-pointer"
                  >
                    View all platform listings
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredProperties.map((prop) => {
                    const currentStatus = prop.verificationStatus || (prop.isVerified ? 'approved' : 'pending');

                    return (
                      <div
                        key={prop.id}
                        className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-xs hover:shadow-md transition-all space-y-4"
                      >
                        {/* Header Row */}
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-[#F1F5F9] pb-4">
                          <div className="flex items-start gap-3.5">
                            <div className="w-20 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0 relative">
                              <Image
                                src={prop.images[0]}
                                alt={prop.title}
                                fill
                                className="object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  currentStatus === 'approved'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : currentStatus === 'pending'
                                    ? 'bg-amber-100 text-amber-800'
                                    : currentStatus === 'under_review'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}>
                                  {currentStatus.replace('_', ' ')}
                                </span>
                                <span className="text-xs font-black text-[#0E7C5D]">{prop.priceFormatted}</span>
                                <span className="text-xs text-[#64748B]">({prop.carpetAreaSqFt} sq.ft)</span>
                                <span className="text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-bold">
                                  {prop.category} • {prop.listingType.toUpperCase()}
                                </span>
                              </div>

                              <h3 className="text-sm sm:text-base font-bold text-[#0F2A43] mt-1">
                                {prop.title}
                              </h3>

                              <div className="flex flex-wrap items-center gap-2 text-xs text-[#64748B] mt-0.5">
                                <MapPin className="w-3.5 h-3.5 text-[#18A67D]" />
                                <span>{prop.locality}, {prop.city}</span>
                                {prop.reraId && (
                                  <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded text-[#0F2A43] font-bold">
                                    RERA: {prop.reraId}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Lister Details */}
                          <div className="text-xs space-y-1 bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0] min-w-56">
                            <div className="text-[10px] font-bold text-[#64748B] uppercase">Submitted By:</div>
                            <div className="font-bold text-[#0F2A43] flex items-center justify-between">
                              <span>{prop.postedBy.name}</span>
                              <span className="text-[10px] text-[#18A67D] bg-emerald-50 px-1.5 py-0.5 rounded font-extrabold">
                                {prop.postedBy.type}
                              </span>
                            </div>
                            <div className="text-[#64748B] flex items-center gap-1">
                              <Phone className="w-3 h-3 text-[#94A3B8]" />
                              <span>{prop.postedBy.phone}</span>
                            </div>
                          </div>
                        </div>

                        {/* Submitted Documents & Audit Check */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                          <div className="space-y-1 bg-[#F8FAFC] p-3 rounded-xl border border-[#F1F5F9]">
                            <span className="text-[10px] font-bold text-[#64748B] uppercase block">Submitted Documents</span>
                            <div className="space-y-1">
                              {(prop.documentsSubmitted || [
                                'Encumbrance Certificate (EC)',
                                'Approved Floor Sanction Plan',
                                'Property Tax Clearance Receipt'
                              ]).map((doc, i) => (
                                <div key={i} className="flex items-center gap-1.5 text-[#0F2A43]">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-[#18A67D] shrink-0" />
                                  <span className="truncate">{doc}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-1 bg-[#F8FAFC] p-3 rounded-xl border border-[#F1F5F9]">
                            <span className="text-[10px] font-bold text-[#64748B] uppercase block">Verification Criteria</span>
                            <div className="space-y-1 text-[#334155]">
                              <div>• RERA Portal Registry: <strong className="text-emerald-700">Online Match</strong></div>
                              <div>• Encumbrance Free Title: <strong className="text-emerald-700">Clear</strong></div>
                              <div>• Photos & Dimensions: <strong className="text-[#0F2A43]">{prop.images.length} High-Res Verified</strong></div>
                            </div>
                          </div>

                          <div className="space-y-1 bg-[#F8FAFC] p-3 rounded-xl border border-[#F1F5F9]">
                            <span className="text-[10px] font-bold text-[#64748B] uppercase block">Status History & Notes</span>
                            {prop.rejectionReason ? (
                              <div className="p-2 rounded bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-medium">
                                {prop.rejectionReason}
                              </div>
                            ) : currentStatus === 'approved' ? (
                              <div className="p-2 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-medium">
                                Verified by Admin. Green Verified Badge active on listing.
                              </div>
                            ) : (
                              <div className="p-2 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-medium">
                                Awaiting admin decision. Click Approve to grant verified seal.
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Home-page promotion placement (admin only) */}
                        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[#F1F5F9]">
                          <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Home Rails:
                          </span>
                          <button
                            onClick={() => handleTogglePromotion(prop, 'isFeatured')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                              prop.isFeatured
                                ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                                : 'bg-white text-[#64748B] border-[#CBD5E1] hover:border-amber-500 hover:text-amber-700'
                            }`}
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>{prop.isFeatured ? 'Featured ✓' : 'Feature'}</span>
                          </button>
                          <button
                            onClick={() => handleTogglePromotion(prop, 'isExclusiveOwner')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                              prop.isExclusiveOwner
                                ? 'bg-[#0E7C5D] text-white border-[#0E7C5D] shadow-xs'
                                : 'bg-white text-[#64748B] border-[#CBD5E1] hover:border-[#0E7C5D] hover:text-[#0E7C5D]'
                            }`}
                          >
                            <BadgeCheck className="w-3.5 h-3.5" />
                            <span>{prop.isExclusiveOwner ? 'Exclusive Owner ✓' : 'Exclusive Owner'}</span>
                          </button>
                          {currentStatus !== 'approved' && (
                            <span className="text-[10px] text-slate-400 italic">Approve first to make it live on the home page.</span>
                          )}
                        </div>

                        {/* Action Buttons Row */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#F1F5F9]">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/properties/${prop.id}`}
                              target="_blank"
                              className="px-3 py-1.5 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F2A43] rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                            >
                              <span>Preview Page</span>
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </Link>
                            <button
                              onClick={() => {
                                deleteProperty(prop.id);
                                logActivity({
                                  action: 'property_deleted',
                                  actorName: user?.name || 'Admin',
                                  actorRole: 'Admin',
                                  details: `Deleted listing "${prop.title}" (${prop.id}) permanently from platform catalog.`,
                                  targetTitle: prop.title,
                                  targetId: prop.id,
                                  severity: 'danger'
                                });
                                showBanner(`Deleted property "${prop.title}".`);
                              }}
                              className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              onClick={() => handleMarkUnderReview(prop)}
                              className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                            >
                              Mark Under Review
                            </button>

                            <button
                              onClick={() => setRejectionModalProperty(prop)}
                              className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                            >
                              Reject Listing
                            </button>

                            <button
                              onClick={() => handleApproveListing(prop)}
                              className="px-4 py-2 bg-[#18A67D] hover:bg-[#0E7C5D] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                            >
                              <Check className="w-4 h-4" />
                              <span>Approve & Grant Verified Seal</span>
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB: PROJECT SUBMISSIONS (Option C)                  */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'projects' && (
          <div className="space-y-5 animate-in fade-in duration-200">

            {/* Filter subtabs + search */}
            <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { id: 'all', label: `All Projects (${projects.length})` },
                    { id: 'pending', label: `Pending (${projPendingCount})` },
                    { id: 'under_review', label: `Under Review (${projUnderReviewCount})` },
                    { id: 'approved', label: `Live (${projApprovedCount})` },
                    { id: 'rejected', label: `Rejected (${projRejectedCount})` },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setProjFilterStatus(tab.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        projFilterStatus === tab.id
                          ? 'bg-[#0F2A43] text-white shadow-xs'
                          : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] hover:text-[#0F2A43]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={loadProjects}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] hover:text-[#0F2A43] flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh
                </button>
              </div>
              <div className="relative">
                <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-3" />
                <input
                  type="text"
                  value={projSearchQuery}
                  onChange={(e) => setProjSearchQuery(e.target.value)}
                  placeholder="Search projects by name, builder, locality, city, or RERA number..."
                  className="w-full pl-9 pr-4 py-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs sm:text-sm font-medium outline-none focus:bg-white focus:border-[#18A67D]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-extrabold text-[#0F2A43]">
              <span>PROJECT SUBMISSIONS ({filteredProjects.length})</span>
              <span className="text-[#64748B]">{projSubmittedCount} builder-submitted · {projects.length - projSubmittedCount} curated</span>
            </div>

            {filteredProjects.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-[#E2E8F0] text-center space-y-3">
                <Building2 className="w-12 h-12 text-[#18A67D] mx-auto" />
                <h3 className="text-base font-bold text-[#0F2A43]">No projects in this queue</h3>
                <p className="text-xs text-[#64748B]">Builder submissions awaiting review will appear here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredProjects.map((proj) => {
                  const status = projStatusOf(proj);
                  return (
                    <div key={proj.id} className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-xs hover:shadow-md transition-all space-y-4">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-[#F1F5F9] pb-4">
                        <div className="flex items-start gap-3.5">
                          <div className="w-20 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0 relative">
                            {proj.image ? (
                              <Image src={proj.image} alt={proj.name} fill className="object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center"><Building2 className="w-6 h-6 text-slate-400" /></div>
                            )}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                status === 'approved' ? 'bg-emerald-100 text-emerald-800'
                                : status === 'pending' ? 'bg-amber-100 text-amber-800'
                                : status === 'under_review' ? 'bg-blue-100 text-blue-800'
                                : 'bg-rose-100 text-rose-800'
                              }`}>
                                {status.replace('_', ' ')}
                              </span>
                              <span className="text-xs font-black text-[#0E7C5D]">{proj.priceFormatted}</span>
                              <span className="text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-bold">{proj.status}</span>
                              {!proj.submittedByUserId && (
                                <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-bold uppercase">Curated</span>
                              )}
                              {/* Home-section placement toggle (admin curation) */}
                              <span className="inline-flex items-center rounded-lg border border-[#E2E8F0] overflow-hidden text-[10px] font-bold uppercase tracking-wider">
                                <button
                                  onClick={() => { updateProjectSection(proj.id, 'featured'); showBanner(`"${proj.name}" set to Featured Projects.`); }}
                                  className={`px-2 py-0.5 transition-colors cursor-pointer ${((proj.section || 'featured') === 'featured') ? 'bg-[#0F2A43] text-white' : 'bg-white text-[#64748B] hover:bg-[#F1F5F9]'}`}
                                >
                                  Featured
                                </button>
                                <button
                                  onClick={() => { updateProjectSection(proj.id, 'top'); showBanner(`"${proj.name}" set to Top Projects.`); }}
                                  className={`px-2 py-0.5 transition-colors cursor-pointer ${(proj.section === 'top') ? 'bg-[#E11D48] text-white' : 'bg-white text-[#64748B] hover:bg-[#F1F5F9]'}`}
                                >
                                  Top
                                </button>
                              </span>
                            </div>
                            <h3 className="text-sm sm:text-base font-bold text-[#0F2A43] mt-1">{proj.name}</h3>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-[#64748B] mt-0.5">
                              <MapPin className="w-3.5 h-3.5 text-[#18A67D]" />
                              <span>{proj.locality}, {proj.city}</span>
                              {proj.reraNumber && (
                                <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded text-[#0F2A43] font-bold">RERA: {proj.reraNumber}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs space-y-1 bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0] min-w-56">
                          <div className="text-[10px] font-bold text-[#64748B] uppercase">Builder / Developer</div>
                          <div className="font-bold text-[#0F2A43]">{proj.builderName}</div>
                          <div className="text-[#64748B]">{proj.bhkConfig || '—'} · {proj.totalUnits ? `${proj.totalUnits} units` : 'units n/a'}</div>
                        </div>
                      </div>

                      {proj.rejectionReason && status === 'rejected' && (
                        <div className="p-2 rounded bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-medium">
                          {proj.rejectionReason}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                        <Link
                          href={`/projects/${proj.id}`}
                          target="_blank"
                          className="px-3 py-1.5 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F2A43] rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                        >
                          <span>Preview Page</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                        <div className="flex flex-wrap items-center gap-2">
                          {status !== 'under_review' && (
                            <button
                              onClick={() => { updateProjectStatus(proj.id, 'under_review'); showBanner(`Project "${proj.name}" moved to Under Review.`); }}
                              className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                            >
                              Mark Under Review
                            </button>
                          )}
                          {status !== 'rejected' && (
                            <button
                              onClick={() => { setProjRejectionReason('Project details or RERA registration could not be verified.'); setRejectionModalProject(proj); }}
                              className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                            >
                              Reject
                            </button>
                          )}
                          {status !== 'approved' && (
                            <button
                              onClick={() => { updateProjectStatus(proj.id, 'approved'); showBanner(`Approved "${proj.name}". It is now live in the catalog.`); }}
                              className="px-4 py-2 bg-[#18A67D] hover:bg-[#0E7C5D] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                            >
                              <Check className="w-4 h-4" />
                              <span>Approve & Publish</span>
                            </button>
                          )}
                          <button
                            onClick={() => { deleteProject(proj.id); showBanner(`Deleted project "${proj.name}".`); }}
                            className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 2: USER MANAGEMENT & BLOCK CONTROLS              */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'users' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            
            {/* User Directory Toolbar */}
            <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-3">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
                
                {/* Role Tabs */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { id: 'all', label: `All Roles (${users.length})` },
                    { id: 'buyer', label: `Buyers (${users.filter(u => u.role === 'buyer').length})` },
                    { id: 'owner', label: `Owners (${users.filter(u => u.role === 'owner').length})` },
                    { id: 'agent', label: `Agents (${users.filter(u => u.role === 'agent').length})` },
                    { id: 'builder', label: `Builders (${users.filter(u => u.role === 'builder').length})` }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setUserRoleFilter(tab.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        userRoleFilter === tab.id
                          ? 'bg-[#0F2A43] text-white shadow-xs'
                          : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] hover:text-[#0F2A43]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Status Toggle */}
                <div className="flex items-center gap-1.5 bg-[#F8FAFC] p-1 rounded-xl border border-[#E2E8F0]">
                  <button
                    onClick={() => setUserStatusFilter('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      userStatusFilter === 'all' ? 'bg-white text-[#0F2A43] shadow-xs' : 'text-[#64748B]'
                    }`}
                  >
                    All Status
                  </button>
                  <button
                    onClick={() => setUserStatusFilter('active')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      userStatusFilter === 'active' ? 'bg-emerald-600 text-white shadow-xs' : 'text-[#64748B]'
                    }`}
                  >
                    Active Only
                  </button>
                  <button
                    onClick={() => setUserStatusFilter('blocked')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      userStatusFilter === 'blocked' ? 'bg-rose-600 text-white shadow-xs' : 'text-[#64748B]'
                    }`}
                  >
                    Blocked ({blockedUsersCount})
                  </button>
                </div>
              </div>

              {/* Search User Input */}
              <div className="relative">
                <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-3" />
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  placeholder="Search user directory by Name, Email, Mobile number, Organization, RERA ID, or City..."
                  className="w-full pl-9 pr-4 py-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs sm:text-sm font-medium outline-none focus:bg-white focus:border-[#18A67D]"
                />
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
              <div className="p-4 border-b border-[#F1F5F9] flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-extrabold text-[#0F2A43]">
                  <Users className="w-4 h-4 text-[#18A67D]" />
                  <span>REGISTERED USERS & MODERATION STANDING ({filteredUsers.length})</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="hidden md:inline text-xs text-[#64748B]">
                    {superAdmin
                      ? 'Super Admin can create, edit, grant listings, block or remove accounts'
                      : 'Admin can edit profiles and moderate accounts'}
                  </span>
                  {superAdmin && (
                    <button
                      onClick={() => setCreateUserModalOpen(true)}
                      className="px-3 py-1.5 rounded-xl bg-[#0F2A43] hover:bg-[#163b5c] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer shrink-0"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Add User</span>
                    </button>
                  )}
                </div>
              </div>

              {filteredUsers.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <UserX className="w-12 h-12 text-slate-400 mx-auto" />
                  <h3 className="text-base font-bold text-[#0F2A43]">No users match the search criteria</h3>
                  <p className="text-xs text-[#64748B]">Try searching with a different name or resetting status filters.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F8FAFC] text-[#64748B] uppercase font-bold text-[10px] tracking-wider border-b border-[#E2E8F0]">
                      <tr>
                        <th className="py-3.5 px-4">User Details</th>
                        <th className="py-3.5 px-4">Role & Organization</th>
                        <th className="py-3.5 px-4">Contact Details</th>
                        <th className="py-3.5 px-4">Listings / Activity</th>
                        <th className="py-3.5 px-4">Account Status</th>
                        <th className="py-3.5 px-4 text-right">Moderation Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F5F9]">
                      {filteredUsers.map((u) => {
                        const isCurrent = user?.id === u.id;
                        return (
                          <tr key={u.id} className={`hover:bg-[#F8FAFC] transition-colors ${u.isBlocked ? 'bg-rose-50/30' : ''}`}>
                            
                            {/* User Avatar & Name */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 relative shrink-0 border border-slate-200">
                                  <Image
                                    src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                                    alt={u.name}
                                    fill
                                    className="object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                                <div>
                                  <div className="font-bold text-[#0F2A43] flex items-center gap-1.5">
                                    <span>{u.name}</span>
                                    {isCurrent && (
                                      <span className="text-[9px] bg-blue-100 text-blue-800 font-extrabold px-1.5 py-0.2 rounded">
                                        YOU
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-[#64748B]">
                                    Joined {u.createdAt || 'Recent'} • {u.city || 'India'}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Role & Org */}
                            <td className="py-3.5 px-4">
                              <div className="space-y-0.5">
                                <span className={`inline-block text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                                  u.role === 'superadmin'
                                    ? 'bg-amber-100 text-amber-900 ring-1 ring-amber-300'
                                    : u.role === 'admin'
                                    ? 'bg-purple-100 text-purple-800'
                                    : u.role === 'agent'
                                    ? 'bg-blue-100 text-blue-800'
                                    : u.role === 'builder'
                                    ? 'bg-amber-100 text-amber-800'
                                    : u.role === 'owner'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-slate-100 text-slate-800'
                                }`}>
                                  {u.role === 'superadmin' ? 'SUPER ADMIN' : u.role.toUpperCase()}
                                </span>
                                {u.companyName && (
                                  <div className="font-semibold text-[#0F2A43] text-[11px] truncate max-w-44">
                                    {u.companyName}
                                  </div>
                                )}
                                {u.reraNumber && (
                                  <div className="text-[10px] text-slate-500 font-mono truncate max-w-44">
                                    RERA: {u.reraNumber}
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Contact Details */}
                            <td className="py-3.5 px-4 space-y-1">
                              <div className="flex items-center gap-1.5 text-[#0F2A43] font-medium">
                                <Mail className="w-3 h-3 text-[#94A3B8]" />
                                <span>{u.email}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[#64748B]">
                                <Phone className="w-3 h-3 text-[#94A3B8]" />
                                <span>{u.phone}</span>
                              </div>
                            </td>

                            {/* Listings / Activity */}
                            <td className="py-3.5 px-4 align-top">
                              <div className="space-y-2 min-w-[150px]">
                                {/* Lifetime activity: posted listings + buyer leads */}
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-1.5" title="Listings posted">
                                    <Building2 className="w-3.5 h-3.5 text-[#18A67D]" />
                                    <span className="font-extrabold text-[#0F2A43] text-sm leading-none">
                                      {u.postedListingsCount || 0}
                                    </span>
                                    <span className="text-[10px] text-[#94A3B8] font-semibold uppercase tracking-wide">
                                      listed
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5" title="Buyer leads received">
                                    <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                                    <span className="font-extrabold text-[#0F2A43] text-sm leading-none">
                                      {u.totalInquiriesReceived || 0}
                                    </span>
                                    <span className="text-[10px] text-[#94A3B8] font-semibold uppercase tracking-wide">
                                      leads
                                    </span>
                                  </div>
                                </div>

                                {/* Remaining quota pills: free tier + superadmin grants */}
                                <div className="flex flex-wrap items-center gap-1.5">
                                  {u.freeListingsRemaining === null || u.freeListingsRemaining === undefined ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 ring-1 ring-slate-200">
                                      <Sparkles className="w-2.5 h-2.5" />
                                      Unlimited
                                    </span>
                                  ) : (
                                    <span
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ring-1 ${
                                        u.freeListingsRemaining > 0
                                          ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                                          : 'bg-slate-50 text-slate-400 ring-slate-200'
                                      }`}
                                      title="Free-tier listings remaining"
                                    >
                                      {u.freeListingsRemaining} free left
                                    </span>
                                  )}

                                  {!!u.grantedListingsRemaining && u.grantedListingsRemaining > 0 && (
                                    <span
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 ring-1 ring-amber-200"
                                      title="Complimentary listings granted by a Super Admin"
                                    >
                                      <Sparkles className="w-2.5 h-2.5" />
                                      {u.grantedListingsRemaining} granted
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Status */}
                            <td className="py-3.5 px-4">
                              {u.isBlocked ? (
                                <div className="space-y-1">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800">
                                    <Lock className="w-3 h-3" />
                                    <span>SUSPENDED / BLOCKED</span>
                                  </span>
                                  {u.blockedReason && (
                                    <div className="text-[10px] text-rose-700 max-w-48 truncate" title={u.blockedReason}>
                                      {u.blockedReason}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>ACTIVE STANDING</span>
                                </span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">

                                <button
                                  onClick={() => setEditUserTarget(u)}
                                  className="px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 bg-slate-50 hover:bg-slate-100 text-[#0F2A43] border border-slate-200 transition-all cursor-pointer"
                                  title="Edit user profile"
                                >
                                  <Pencil className="w-3 h-3" />
                                  <span>Edit</span>
                                </button>

                                {u.isBlocked ? (
                                  <button
                                    onClick={() => handleUnblockUser(u)}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                                  >
                                    <Unlock className="w-3 h-3" />
                                    <span>Unblock</span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => setBlockUserModalTarget(u)}
                                    disabled={isCurrent}
                                    className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all cursor-pointer ${
                                      isCurrent
                                        ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400'
                                        : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                                    }`}
                                    title={isCurrent ? "You cannot block yourself" : "Block and suspend account"}
                                  >
                                    <UserX className="w-3.5 h-3.5" />
                                    <span>Block User</span>
                                  </button>
                                )}

                                {superAdmin && !isCurrent && (
                                  <button
                                    onClick={async () => {
                                      const res = await impersonateUser(u.id);
                                      if (!res.success) showBanner(res.error || 'Could not open that dashboard.');
                                    }}
                                    className="px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-all cursor-pointer"
                                    title="View this user's dashboard"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>View Dashboard</span>
                                  </button>
                                )}

                                {superAdmin && (
                                  <button
                                    onClick={() => setGrantListingsTarget(u)}
                                    className="px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-all cursor-pointer"
                                    title="Grant complimentary listing quota"
                                  >
                                    <Sparkles className="w-3 h-3" />
                                    <span>Grant Listings</span>
                                  </button>
                                )}

                                {superAdmin && (
                                  <button
                                    onClick={() => {
                                      if (confirm(`Delete user "${u.name}" permanently from the database?`)) {
                                        deleteUser(u.id);
                                        showBanner(`User ${u.name} removed.`);
                                      }
                                    }}
                                    disabled={isCurrent}
                                    className={`p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors ${
                                      isCurrent ? 'opacity-20 cursor-not-allowed' : 'cursor-pointer'
                                    }`}
                                    title="Delete User Record"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>

                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB: PREFERRED AGENT CATALOG                         */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'agents' && (
          <div className="space-y-5 animate-in fade-in duration-200">

            {/* Context note: curation, not creation */}
            <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 text-xs font-medium flex items-start gap-2.5">
              <Award className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <span>
                Agents are real accounts (users with the <strong>Agent</strong> role) who manage their own marketing profile.
                Here you decide who is featured as a <strong>BayBayt Preferred Agent</strong> on the public
                {' '}<Link href="/agents" className="underline font-bold">/agents</Link> directory and homepage, and you set the
                editorial <strong>badge</strong> and <strong>rating</strong>. Promoted agents appear instantly. Listing counts are
                computed live from each agent&apos;s approved properties.
              </span>
            </div>

            {/* Toolbar */}
            <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-xs">
              <div className="relative">
                <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-3" />
                <input
                  type="text"
                  value={agentSearchQuery}
                  onChange={(e) => setAgentSearchQuery(e.target.value)}
                  placeholder="Search agents by name, agency, city, email, area served, or specialization..."
                  className="w-full pl-9 pr-4 py-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs sm:text-sm font-medium outline-none focus:bg-white focus:border-[#18A67D]"
                />
              </div>
            </div>

            {/* Agents Table */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
              <div className="p-4 border-b border-[#F1F5F9] flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-extrabold text-[#0F2A43]">
                  <Award className="w-4 h-4 text-[#18A67D]" />
                  <span>AGENTS ({filteredAgents.length}) · {preferredAgentCount} PREFERRED</span>
                </div>
              </div>

              {filteredAgents.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <Award className="w-12 h-12 text-slate-300 mx-auto" />
                  <h3 className="text-base font-bold text-[#0F2A43]">No agents found</h3>
                  <p className="text-xs text-[#64748B]">No accounts have the Agent role yet, or the search filter excludes them all.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F8FAFC] text-[#64748B] uppercase font-bold text-[10px] tracking-wider border-b border-[#E2E8F0]">
                      <tr>
                        <th className="py-3.5 px-4">Agent</th>
                        <th className="py-3.5 px-4">Agency</th>
                        <th className="py-3.5 px-4">City</th>
                        <th className="py-3.5 px-4">Rating</th>
                        <th className="py-3.5 px-4">Directory</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F5F9]">
                      {filteredAgents.map((a) => (
                        <tr key={a.id} className="hover:bg-[#F8FAFC] transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 relative shrink-0 border border-slate-200">
                                {a.avatar ? (
                                  <Image src={a.avatar} alt={a.name} fill className="object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[#94A3B8] font-bold">
                                    {a.name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <div>
                                <div className="font-bold text-[#0F2A43]">{a.name}</div>
                                <div className="text-[11px] text-[#64748B]">{a.isPreferredAgent ? (a.agentBadge || 'BayBayt Preferred') : a.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-[#0F2A43] truncate max-w-40">{a.companyName || '—'}</div>
                            {typeof a.operatingSince === 'number' && (
                              <div className="text-[10px] text-slate-500">Since {a.operatingSince}</div>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1 text-[#0F2A43] font-medium">
                              <MapPin className="w-3 h-3 text-[#94A3B8]" />
                              {a.city || '—'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1 font-bold text-[#0F2A43]">
                              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                              {typeof a.agentRating === 'number' ? a.agentRating : '—'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            {a.isPreferredAgent ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                                <Award className="w-3 h-3" /> Preferred
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-bold text-[10px]">
                                Not listed
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setEditAgentTarget(a)}
                                className="px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 bg-slate-50 hover:bg-slate-100 text-[#0F2A43] border border-slate-200 transition-all cursor-pointer"
                                title="Edit editorial fields"
                              >
                                <Pencil className="w-3 h-3" />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => handleTogglePreferred(a)}
                                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all cursor-pointer border ${
                                  a.isPreferredAgent
                                    ? 'bg-white hover:bg-rose-50 text-rose-600 border-rose-200'
                                    : 'bg-[#0F2A43] hover:bg-[#163b5c] text-white border-transparent'
                                }`}
                                title={a.isPreferredAgent ? 'Remove from directory' : 'Feature in directory'}
                              >
                                <Award className="w-3 h-3" />
                                <span>{a.isPreferredAgent ? 'Demote' : 'Promote'}</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 3: ALL ACTIVITY STREAM                           */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'activity' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            
            {/* Stream Filter Toolbar */}
            <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { id: 'all', label: `All Activity (${activityLogs.length})` },
                    { id: 'property', label: 'Listings & Uploads' },
                    { id: 'verified', label: 'Verifications' },
                    { id: 'blocked', label: 'User Suspensions / Security' },
                    { id: 'inquiry', label: 'Buyer Leads' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActivityFilterAction(tab.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        activityFilterAction === tab.id
                          ? 'bg-[#0F2A43] text-white shadow-xs'
                          : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] hover:text-[#0F2A43]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={clearActivityLogs}
                  className="text-xs font-bold text-[#64748B] hover:text-rose-600 cursor-pointer"
                >
                  Clear Log History
                </button>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-3" />
                <input
                  type="text"
                  value={activitySearchQuery}
                  onChange={(e) => setActivitySearchQuery(e.target.value)}
                  placeholder="Search audit trail by Actor, Action Description, or Property Name..."
                  className="w-full pl-9 pr-4 py-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs sm:text-sm font-medium outline-none focus:bg-white focus:border-[#18A67D]"
                />
              </div>
            </div>

            {/* Chronological Activity List */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
                <div className="flex items-center gap-2 text-xs font-extrabold text-[#0F2A43]">
                  <Activity className="w-4 h-4 text-[#18A67D]" />
                  <span>CHRONOLOGICAL AUDIT & EVENT LOG ({filteredLogs.length})</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#18A67D] font-bold">
                  <span className="w-2 h-2 rounded-full bg-[#18A67D] animate-ping"></span>
                  <span>Live Streaming</span>
                </div>
              </div>

              {filteredLogs.length === 0 ? (
                <div className="p-12 text-center space-y-2">
                  <CheckSquare className="w-10 h-10 text-slate-300 mx-auto" />
                  <div className="text-sm font-bold text-[#0F2A43]">No activity events found in this category</div>
                  <div className="text-xs text-[#64748B]">All recent operations will appear here as they occur.</div>
                </div>
              ) : (
                <div className="relative border-l-2 border-[#E2E8F0] ml-3 sm:ml-4 pl-4 sm:pl-6 space-y-6">
                  {filteredLogs.map((log) => {
                    return (
                      <div key={log.id} className="relative group">
                        
                        {/* Event Dot */}
                        <div className={`absolute -left-[23px] sm:-left-[31px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white shadow-2xs ${
                          log.severity === 'success'
                            ? 'bg-emerald-500'
                            : log.severity === 'danger'
                            ? 'bg-rose-500'
                            : log.severity === 'warning'
                            ? 'bg-amber-500'
                            : 'bg-blue-500'
                        }`}></div>

                        <div className="bg-[#F8FAFC] group-hover:bg-white p-4 rounded-xl border border-[#E2E8F0] group-hover:border-[#CBD5E1] transition-all space-y-2 shadow-2xs">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                                log.severity === 'success'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : log.severity === 'danger'
                                  ? 'bg-rose-100 text-rose-800'
                                  : log.severity === 'warning'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {log.action.replace('_', ' ')}
                              </span>
                              <span className="text-xs font-black text-[#0F2A43]">
                                {log.actorName}
                              </span>
                              <span className="text-[10px] text-slate-500 bg-slate-200/70 px-1.5 py-0.2 rounded font-bold">
                                {log.actorRole}
                              </span>
                            </div>

                            <span className="text-[11px] font-mono text-[#64748B] flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{log.timestamp}</span>
                            </span>
                          </div>

                          <p className="text-xs sm:text-sm text-[#334155] font-medium leading-relaxed">
                            {log.details}
                          </p>

                          {log.targetTitle && (
                            <div className="text-[11px] text-[#0F2A43] font-bold bg-white p-2 rounded-lg border border-[#E2E8F0] flex items-center justify-between">
                              <span className="truncate">Target: {log.targetTitle}</span>
                              {log.targetId && (
                                <span className="font-mono text-[10px] text-[#94A3B8] shrink-0">
                                  ID: {log.targetId}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 4: TRENDS & PLATFORM ANALYTICS                   */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'trends' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            {/* Top Stat Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-1">
                <span className="text-[11px] font-bold text-[#64748B] uppercase">Estimated Catalog GMV</span>
                <div className="text-2xl font-black text-[#0F2A43]">₹52.4 Cr</div>
                <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>+18.4% this month</span>
                </span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-1">
                <span className="text-[11px] font-bold text-[#64748B] uppercase">Avg Verification Speed</span>
                <div className="text-2xl font-black text-[#0F2A43]">2.4 hrs</div>
                <span className="text-[11px] text-emerald-600 font-bold">Fast RERA registry match</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-1">
                <span className="text-[11px] font-bold text-[#64748B] uppercase">Green Seal Adoption</span>
                <div className="text-2xl font-black text-emerald-700">84.2%</div>
                <span className="text-[11px] text-[#64748B]">Trust index passing score</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-1">
                <span className="text-[11px] font-bold text-[#64748B] uppercase">Buyer Tour Inquiries</span>
                <div className="text-2xl font-black text-blue-700">{inquiries.length + 184}</div>
                <span className="text-[11px] text-blue-700 font-bold">100% verified mobile leads</span>
              </div>
            </div>

            {/* Graphs Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Daily Activity Area Chart */}
              <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold text-[#0F2A43]">Platform Daily Velocity</h3>
                    <p className="text-xs text-[#64748B]">New Uploads vs Approved Verifications vs Buyer Leads</p>
                  </div>
                  <BarChart3 className="w-5 h-5 text-[#18A67D]" />
                </div>
                <AdminActivityTrendChart data={activityTrendData} />
              </div>

              {/* City Distribution Bar Chart */}
              <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold text-[#0F2A43]">Metro Market Inventory & Demand</h3>
                    <p className="text-xs text-[#64748B]">Listings count vs Inquiries generated across Metros</p>
                  </div>
                  <MapPin className="w-5 h-5 text-[#3B82F6]" />
                </div>
                <AdminCityDistributionBarChart data={cityDistributionData} />
              </div>

              {/* User Distribution Pie Chart */}
              <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold text-[#0F2A43]">User Base Segmentation</h3>
                    <p className="text-xs text-[#64748B]">Registered accounts by Role (Buyers, Owners, Agents, Builders)</p>
                  </div>
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <AdminUserBreakdownPieChart data={userDistributionData} />
              </div>

              {/* Moderation Status Donut */}
              <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold text-[#0F2A43]">Listing Moderation Distribution</h3>
                    <p className="text-xs text-[#64748B]">Approved vs Under Review vs Pending vs Rejected</p>
                  </div>
                  <ShieldCheck className="w-5 h-5 text-[#10B981]" />
                </div>
                <AdminModerationStatusChart data={moderationDonutData} />
              </div>

            </div>

          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 5: PLATFORM SETTINGS & MAINTENANCE              */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'settings' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-6">
              <div>
                <h3 className="font-black text-base text-[#0F2A43]">Platform Security & Moderation Configuration</h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Configure automated RERA compliance validation thresholds, circle rate safety margins, and database maintenance routines.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-xs text-[#0F2A43] flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#18A67D]" />
                      <span>RERA Auto-Verification Lookup</span>
                    </div>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Automatically checks format patterns against MahaRERA, K-RERA, UP-RERA, and HRERA state portals before moving to manual surveyor queue.
                  </p>
                  <div className="text-xs text-slate-500 font-semibold flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>State Regex validation enabled</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-xs text-[#0F2A43] flex items-center gap-2">
                      <IndianRupee className="w-4 h-4 text-blue-600" />
                      <span>Circle Rate Price Sanity Guard</span>
                    </div>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                      ±35% Threshold
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Flag listings whose per-sq-ft asking price deviates beyond 35% from the locality circle rate government benchmark.
                  </p>
                  <div className="text-xs text-slate-500 font-semibold flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-blue-600" />
                    <span>Auto-flags for fraud inspection</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-xs text-[#0F2A43] flex items-center gap-2">
                      <Download className="w-4 h-4 text-purple-600" />
                      <span>Export System Audit History</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600">
                    Download an immutable JSON snapshot of all system moderation logs, user suspensions, and property approvals.
                  </p>
                  <button
                    onClick={() => {
                      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(activityLogs, null, 2));
                      const downloadAnchor = document.createElement('a');
                      downloadAnchor.setAttribute("href", dataStr);
                      downloadAnchor.setAttribute("download", `baybayt_audit_logs_${new Date().toISOString().slice(0,10)}.json`);
                      document.body.appendChild(downloadAnchor);
                      downloadAnchor.click();
                      downloadAnchor.remove();
                      showBanner('Audit logs exported successfully.');
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-[#0F2A43] hover:bg-[#163b5c] text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download JSON Logs</span>
                  </button>
                </div>

              </div>
            </div>

          </div>
        )}

        {activeTab === 'localities' && <LocalitiesPanel />}

      </main>
      </div>

      {/* ---------------------------------------------------- */}
      {/* MODAL: BLOCK USER SUSPENSION                         */}
      {/* ---------------------------------------------------- */}
      {blockUserModalTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-rose-700 font-extrabold text-base">
                <UserX className="w-5 h-5" />
                <span>Suspend & Block User Account</span>
              </div>
              <button
                onClick={() => setBlockUserModalTarget(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#64748B]">
              You are about to block <strong>{blockUserModalTarget.name}</strong> ({blockUserModalTarget.email}). 
              They will be barred from posting new listings, responding to inquiries, or accessing buyer contacts.
            </p>

            <form onSubmit={handleConfirmBlockUser} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#172033] uppercase">
                  Select Suspension Reason
                </label>
                <select
                  onChange={(e) => setBlockCustomReason(e.target.value)}
                  className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs font-medium outline-none"
                >
                  <option value="Multiple policy violations or duplicate spam listings reported.">
                    Spam / Duplicate unverified listings
                  </option>
                  <option value="RERA certificate was falsified or revoked by State Regulatory Board.">
                    Falsified or revoked RERA license
                  </option>
                  <option value="Unsolicited commercial marketing or abusive tele-calling to buyers.">
                    Unsolicited buyer outreach & harassment
                  </option>
                  <option value="Pricing fraud / circle rate misrepresentation detected by audit.">
                    Pricing fraud & false circle rates
                  </option>
                  <option value="Temporary account suspension pending identity & document re-verification.">
                    Pending identity re-verification
                  </option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#172033] uppercase">
                  Custom Notice Note (Shown to user on login)
                </label>
                <textarea
                  rows={3}
                  value={blockCustomReason}
                  onChange={(e) => setBlockCustomReason(e.target.value)}
                  className="w-full p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setBlockUserModalTarget(null)}
                  className="px-4 py-2 rounded-xl border text-xs font-bold text-[#0F2A43] hover:bg-[#F8FAFC]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Confirm Account Suspension</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: CREATE / EDIT USER                            */}
      {/* ---------------------------------------------------- */}
      {(createUserModalOpen || editUserTarget) && (
        <UserFormModal
          key={editUserTarget?.id || 'create'}
          mode={editUserTarget ? 'edit' : 'create'}
          target={editUserTarget}
          onClose={() => { setCreateUserModalOpen(false); setEditUserTarget(null); }}
          onSubmit={async (data) => {
            const res = editUserTarget
              ? await updateUser(editUserTarget.id, data)
              : await createUser(data as Parameters<typeof createUser>[0]);
            if (res.success) {
              showBanner(editUserTarget
                ? `Updated profile for "${data.name}".`
                : `Created new ${String(data.role).toUpperCase()} account for "${data.name}".`);
            }
            return res;
          }}
        />
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: GRANT LISTINGS (superadmin master control)    */}
      {/* ---------------------------------------------------- */}
      {grantListingsTarget && (
        <GrantListingsModal
          key={grantListingsTarget.id}
          target={grantListingsTarget}
          onClose={() => setGrantListingsTarget(null)}
          onSubmit={async (data) => {
            const res = await grantListings(grantListingsTarget.id, data);
            if (res.success) {
              showBanner(
                `Granted ${data.listings} listing${data.listings === 1 ? '' : 's'} to "${grantListingsTarget.name}" for ${data.city}.`,
              );
            }
            return res;
          }}
        />
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: EDIT PREFERRED AGENT (editorial fields)       */}
      {/* ---------------------------------------------------- */}
      {editAgentTarget && (
        <AgentFormModal
          key={editAgentTarget.id}
          target={editAgentTarget}
          onClose={() => setEditAgentTarget(null)}
          onSubmit={async (data) => {
            const res = await updateUser(editAgentTarget.id, data);
            if (res.success) showBanner(`Updated agent profile for "${editAgentTarget.name}".`);
            return res;
          }}
        />
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: REJECT PROPERTY LISTING                       */}
      {/* ---------------------------------------------------- */}
      {rejectionModalProperty && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-rose-700 font-extrabold text-base">
                <XCircle className="w-5 h-5" />
                <span>Reject Property Listing</span>
              </div>
              <button
                onClick={() => setRejectionModalProperty(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#64748B]">
              Provide feedback for <strong>{rejectionModalProperty.title}</strong>. The owner will see this notification in their user dashboard to submit corrections.
            </p>

            <form onSubmit={handleConfirmRejection} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#172033] uppercase">
                  Select Common Rejection Reason
                </label>
                <select
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs font-medium outline-none"
                >
                  <option value="State RERA certificate could not be verified on the official real estate regulatory portal.">
                    RERA certificate mismatch on state portal
                  </option>
                  <option value="Inaccurate carpet area vs super built-up ratio or missing floor sanction document.">
                    Floor plan / area mismatch
                  </option>
                  <option value="Property ownership proof or Encumbrance Certificate copy is unreadable.">
                    Unreadable title / EC document
                  </option>
                  <option value="Low resolution photographs or watermarked exterior images submitted.">
                    Poor photo quality / watermarked images
                  </option>
                  <option value="Price listed deviates significantly from prevailing locality circle rates.">
                    Suspicious / inaccurate pricing
                  </option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#172033] uppercase">
                  Custom Feedback Note to Lister
                </label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectionModalProperty(null)}
                  className="px-4 py-2 rounded-xl border text-xs font-bold text-[#0F2A43] hover:bg-[#F8FAFC]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project Rejection Modal (Option C) */}
      {rejectionModalProject && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-rose-700 font-extrabold text-base">
                <XCircle className="w-5 h-5" />
                <span>Reject Project Submission</span>
              </div>
              <button onClick={() => setRejectionModalProject(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#64748B]">
              Provide feedback for <strong>{rejectionModalProject.name}</strong>. The builder will see this in their dashboard under My Projects.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateProjectStatus(rejectionModalProject.id, 'rejected', projRejectionReason);
                showBanner(`Project "${rejectionModalProject.name}" rejected with feedback sent to the builder.`);
                setRejectionModalProject(null);
              }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#172033] uppercase">Select Common Rejection Reason</label>
                <select
                  onChange={(e) => setProjRejectionReason(e.target.value)}
                  className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs font-medium outline-none"
                >
                  <option value="Project details or RERA registration could not be verified.">RERA registration could not be verified</option>
                  <option value="Insufficient project imagery or watermarked / low-resolution photos.">Poor / insufficient project imagery</option>
                  <option value="Builder credentials or marketing authorisation could not be confirmed.">Builder credentials unconfirmed</option>
                  <option value="Pricing or configuration details are incomplete or inconsistent.">Incomplete pricing / configuration</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#172033] uppercase">Custom Feedback Note to Builder</label>
                <textarea
                  rows={3}
                  value={projRejectionReason}
                  onChange={(e) => setProjRejectionReason(e.target.value)}
                  className="w-full p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setRejectionModalProject(null)} className="px-4 py-2 rounded-xl border text-xs font-bold text-[#0F2A43] hover:bg-[#F8FAFC]">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md">
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Footer */}
      <footer className="w-full border-t border-[#E2E8F0] bg-white py-4 px-4 text-center text-xs text-[#64748B]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; {new Date().getFullYear()} BayBayt Admin Verification & Moderation Suite.</span>
          <div className="flex items-center gap-4 text-xs font-medium">
            <Link href="/" className="hover:text-[#18A67D]">Home</Link>
            <span className="text-slate-300">•</span>
            <Link href="/dashboard" className="hover:text-[#18A67D]">User Dashboard</Link>
            <span className="text-slate-300">•</span>
            <Link href="/properties" className="hover:text-[#18A67D]">Catalog</Link>
            <span className="text-slate-300">•</span>
            <Link href="/post-property" className="hover:text-[#18A67D]">Post Property</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}

// ------------------------------------------------------------------
// Create / Edit user form modal (admin only)
// ------------------------------------------------------------------
const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'buyer', label: 'Buyer' },
  { value: 'owner', label: 'Individual Owner' },
  { value: 'agent', label: 'RERA Agent' },
  { value: 'builder', label: 'Builder / Developer' },
  { value: 'admin', label: 'Platform Admin' },
  { value: 'superadmin', label: 'Super Admin (master portal)' },
];

function UserFormModal({
  mode,
  target,
  onClose,
  onSubmit,
}: {
  mode: 'create' | 'edit';
  target: UserProfile | null;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    email: string;
    phone: string;
    role: UserRole;
    city?: string;
    companyName?: string;
    reraNumber?: string;
    password?: string;
  }) => Promise<{ success: boolean; error?: string }>;
}) {
  const [name, setName] = useState(target?.name || '');
  const [email, setEmail] = useState(target?.email || '');
  const [phone, setPhone] = useState(target?.phone || '');
  const [role, setRole] = useState<UserRole>(target?.role || 'buyer');
  const [city, setCity] = useState(target?.city || '');
  const [companyName, setCompanyName] = useState(target?.companyName || '');
  const [reraNumber, setReraNumber] = useState(target?.reraNumber || '');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const showOrgFields = role === 'agent' || role === 'builder';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !email.trim() || !phone.trim()) {
      setError('Name, email and phone are required.');
      return;
    }
    if (mode === 'create' && password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (mode === 'edit' && password && password.length < 6) {
      setError('New password must be at least 6 characters (leave blank to keep current).');
      return;
    }
    setSubmitting(true);
    const payload = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      role,
      city: city.trim(),
      companyName: companyName.trim(),
      reraNumber: reraNumber.trim(),
      ...(password ? { password } : {}),
    };
    const res = await onSubmit(payload);
    setSubmitting(false);
    if (res.success) onClose();
    else setError(res.error || 'Something went wrong.');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2 text-[#0F2A43] font-extrabold text-base">
            {mode === 'create' ? <UserPlus className="w-5 h-5 text-[#18A67D]" /> : <Pencil className="w-5 h-5 text-[#18A67D]" />}
            <span>{mode === 'create' ? 'Create New User Account' : 'Edit User Profile'}</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#172033] uppercase">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs font-medium outline-none focus:bg-white focus:border-[#18A67D]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#172033] uppercase">Account Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs font-medium outline-none focus:bg-white focus:border-[#18A67D]"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#172033] uppercase">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs font-medium outline-none focus:bg-white focus:border-[#18A67D]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#172033] uppercase">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs font-medium outline-none focus:bg-white focus:border-[#18A67D]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#172033] uppercase">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Bangalore"
                className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs font-medium outline-none focus:bg-white focus:border-[#18A67D]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#172033] uppercase">
                {mode === 'create' ? 'Password' : 'Reset Password'}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'create' ? 'Min. 6 characters' : 'Leave blank to keep current'}
                className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs font-medium outline-none focus:bg-white focus:border-[#18A67D]"
              />
            </div>
          </div>

          {showOrgFields && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#172033] uppercase">Company / Organization</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Prestige Group"
                  className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs font-medium outline-none focus:bg-white focus:border-[#18A67D]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#172033] uppercase">RERA Number</label>
                <input
                  type="text"
                  value={reraNumber}
                  onChange={(e) => setReraNumber(e.target.value)}
                  placeholder="e.g. PRM/KA/RERA/..."
                  className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs font-medium outline-none focus:bg-white focus:border-[#18A67D]"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border text-xs font-bold text-[#0F2A43] hover:bg-[#F8FAFC] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-[#0F2A43] hover:bg-[#163b5c] text-white text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>{mode === 'create' ? 'Create Account' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// Grant listings (superadmin master control)
// ------------------------------------------------------------------
// Gives a user extra listing quota for a city with no payment. The city list is
// the same sellable-city set the billing engine prices against (fetched from
// /api/billing so we don't import the server-only billing module into the
// client). The grant reuses the normal entitlement path on the server.
function GrantListingsModal({
  target,
  onClose,
  onSubmit,
}: {
  target: UserProfile;
  onClose: () => void;
  onSubmit: (data: { city: string; listings: number; durationDays?: number }) => Promise<{ success: boolean; error?: string }>;
}) {
  const [cities, setCities] = useState<string[]>([]);
  const [city, setCity] = useState(target.city || '');
  const [listings, setListings] = useState('5');
  const [durationDays, setDurationDays] = useState('365');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/billing');
        const data = await res.json();
        const list: string[] = data?.pricing?.cities || [];
        if (!active) return;
        setCities(list);
        // Default to the user's own city if it's sellable, else the first option.
        setCity((prev) => (list.includes(prev) ? prev : list[0] || ''));
      } catch {
        /* leave the city list empty; the field stays a free-text input */
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const n = Number(listings);
    if (!Number.isInteger(n) || n < 1 || n > 100000) {
      setError('Listings must be a whole number between 1 and 100000.');
      return;
    }
    if (!city.trim()) {
      setError('Pick a city for the grant.');
      return;
    }
    const d = durationDays.trim() === '' ? undefined : Number(durationDays);
    if (d !== undefined && (!Number.isInteger(d) || d < 1 || d > 3650)) {
      setError('Validity must be a whole number of days between 1 and 3650.');
      return;
    }

    setSubmitting(true);
    const res = await onSubmit({ city: city.trim(), listings: n, ...(d !== undefined ? { durationDays: d } : {}) });
    setSubmitting(false);
    if (res.success) onClose();
    else setError(res.error || 'Failed to grant listings.');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2 text-[#0F2A43] font-extrabold text-base">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <span>Grant Complimentary Listings</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-[#64748B]">
          Add paid-equivalent listing quota to <strong className="text-[#0F2A43]">{target.name}</strong> ({target.email}) for a
          specific city — no payment required. Quota is city-scoped and stacks with any packs the user has purchased.
        </p>

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#172033] uppercase">City</label>
            {cities.length ? (
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs font-medium outline-none focus:bg-white focus:border-[#18A67D]"
              >
                {cities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Bangalore"
                className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs font-medium outline-none focus:bg-white focus:border-[#18A67D]"
              />
            )}
            <p className="text-[10px] text-slate-400">Non-priced cities fall into the &quot;Other&quot; billing bucket.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#172033] uppercase">No. of Listings</label>
              <input
                type="number"
                min={1}
                max={100000}
                value={listings}
                onChange={(e) => setListings(e.target.value)}
                className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs font-medium outline-none focus:bg-white focus:border-[#18A67D]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#172033] uppercase">Validity (days)</label>
              <input
                type="number"
                min={1}
                max={3650}
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
                placeholder="365"
                className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs font-medium outline-none focus:bg-white focus:border-[#18A67D]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border text-xs font-bold text-[#0F2A43] hover:bg-[#F8FAFC] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>Grant Listings</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// Create / Edit preferred agent (catalog directory entry, admin only)
// ------------------------------------------------------------------
// Admin editor for an agent's directory presence. Agents own most of their
// profile via the dashboard; the admin controls the editorial fields (badge,
// rating, whether they are featured) and can correct core marketing fields.
function AgentFormModal({
  target,
  onClose,
  onSubmit,
}: {
  target: UserProfile;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => Promise<{ success: boolean; error?: string }>;
}) {
  const [isPreferredAgent, setIsPreferredAgent] = useState(!!target.isPreferredAgent);
  const [agentBadge, setAgentBadge] = useState(target.agentBadge || '');
  const [agentRating, setAgentRating] = useState(typeof target.agentRating === 'number' ? String(target.agentRating) : '');
  const [companyName, setCompanyName] = useState(target.companyName || '');
  const [agencyLogo, setAgencyLogo] = useState(target.agencyLogo || '');
  const [operatingSince, setOperatingSince] = useState(typeof target.operatingSince === 'number' ? String(target.operatingSince) : '');
  const [experienceYears, setExperienceYears] = useState(typeof target.experienceYears === 'number' ? String(target.experienceYears) : '');
  const [buyersServed, setBuyersServed] = useState(target.buyersServed || '');
  const [reraNumber, setReraNumber] = useState(target.reraNumber || '');
  const [about, setAbout] = useState(target.agentAbout || '');
  const [specializations, setSpecializations] = useState((target.specializations || []).join(', '));
  const [areasServed, setAreasServed] = useState((target.areasServed || []).join(', '));
  const [languages, setLanguages] = useState((target.languages || []).join(', '));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const payload: Record<string, unknown> = {
      isPreferredAgent,
      agentBadge: agentBadge.trim(),
      agentRating,
      companyName: companyName.trim(),
      agencyLogo: agencyLogo.trim(),
      operatingSince,
      experienceYears,
      buyersServed: buyersServed.trim(),
      reraNumber: reraNumber.trim(),
      agentAbout: about.trim(),
      specializations,
      areasServed,
      languages,
    };
    const res = await onSubmit(payload);
    setSubmitting(false);
    if (res.success) onClose();
    else setError(res.error || 'Something went wrong.');
  };

  const inputCls = 'w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs font-medium outline-none focus:bg-white focus:border-[#18A67D]';
  const labelCls = 'block text-xs font-bold text-[#172033] uppercase';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2 text-[#0F2A43] font-extrabold text-base">
            <Pencil className="w-5 h-5 text-[#18A67D]" />
            <span>Edit Agent — {target.name}</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Directory toggle */}
          <label className="flex items-center justify-between gap-3 p-3 rounded-xl bg-teal-50 border border-teal-200 cursor-pointer">
            <div className="flex items-center gap-2 text-teal-900">
              <Award className="w-4 h-4 text-teal-600" />
              <div>
                <div className="text-xs font-extrabold">Feature as BayBayt Preferred Agent</div>
                <div className="text-[10px] font-medium text-teal-700">Shows this agent on the public /agents directory & homepage.</div>
              </div>
            </div>
            <input type="checkbox" checked={isPreferredAgent} onChange={(e) => setIsPreferredAgent(e.target.checked)} className="w-4 h-4 accent-[#18A67D]" />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className={labelCls}>Badge <span className="text-[#94A3B8] normal-case">(editorial)</span></label>
              <input type="text" value={agentBadge} onChange={(e) => setAgentBadge(e.target.value)} placeholder="BayBayt Preferred" className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Rating <span className="text-[#94A3B8] normal-case">(editorial)</span></label>
              <input type="number" step="0.1" min="0" max="5" value={agentRating} onChange={(e) => setAgentRating(e.target.value)} placeholder="4.7" className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className={labelCls}>Agency Name</label>
              <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="e.g. Prakash Realtors" className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Agency Logo URL</label>
              <input type="url" value={agencyLogo} onChange={(e) => setAgencyLogo(e.target.value)} placeholder="https://... (optional)" className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className={labelCls}>Since</label>
              <input type="number" value={operatingSince} onChange={(e) => setOperatingSince(e.target.value)} placeholder="2015" className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Exp (yrs)</label>
              <input type="number" value={experienceYears} onChange={(e) => setExperienceYears(e.target.value)} placeholder="8" className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Buyers Served</label>
              <input type="text" value={buyersServed} onChange={(e) => setBuyersServed(e.target.value)} placeholder="120+" className={inputCls} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className={labelCls}>RERA ID</label>
            <input type="text" value={reraNumber} onChange={(e) => setReraNumber(e.target.value)} placeholder="UPRERAAGT... (optional)" className={inputCls} />
          </div>

          <div className="space-y-1.5">
            <label className={labelCls}>Specializations (comma-separated)</label>
            <input type="text" value={specializations} onChange={(e) => setSpecializations(e.target.value)} placeholder="Residential, Luxury Villas, Plots" className={inputCls} />
          </div>

          <div className="space-y-1.5">
            <label className={labelCls}>Areas Served (comma-separated)</label>
            <input type="text" value={areasServed} onChange={(e) => setAreasServed(e.target.value)} placeholder="Gomti Nagar, Hazratganj, Aliganj" className={inputCls} />
          </div>

          <div className="space-y-1.5">
            <label className={labelCls}>Languages (comma-separated)</label>
            <input type="text" value={languages} onChange={(e) => setLanguages(e.target.value)} placeholder="Hindi, English" className={inputCls} />
          </div>

          <div className="space-y-1.5">
            <label className={labelCls}>About</label>
            <textarea rows={3} value={about} onChange={(e) => setAbout(e.target.value)} placeholder="Short bio shown on the agent profile (optional)" className={`${inputCls} resize-none`} />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border text-xs font-bold text-[#0F2A43] hover:bg-[#F8FAFC] cursor-pointer">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="px-5 py-2 rounded-xl bg-[#0F2A43] hover:bg-[#163b5c] text-white text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-60">
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
