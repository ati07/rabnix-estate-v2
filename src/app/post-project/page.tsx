'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BrandLogo } from '@/components/BrandLogo';
import Image from 'next/image';
import {
  Building2,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Upload,
  IndianRupee,
  MapPin,
  Sparkles,
  Check,
  AlertCircle,
  Plus,
  Trash2,
  Key,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { CITIES_DATA } from '@/lib/realEstateData';
import type { FeaturedProjectItem, ProjectFloorPlan, ProjectNearby } from '@/lib/homeSectionsData';

const PROJECT_AMENITIES = [
  'Swimming Pool', 'Clubhouse', 'Gymnasium', 'Landscaped Gardens', 'Children Play Area',
  '24x7 Security', 'Power Backup', 'Jogging Track', 'Amphitheatre', 'Indoor Games',
  'Multipurpose Hall', 'Sports Courts', 'EV Charging', 'Rainwater Harvesting',
  'Sewage Treatment Plant', 'Solar Power', 'Retail Boulevard', 'Co-working Lounge',
];

const PROJECT_HIGHLIGHTS = [
  'RERA Registered', 'Vastu Compliant', 'Gated Community', 'Green Certified',
  'Premium Location', 'Metro Connectivity', 'IT Park Proximity', 'Low Density',
];

const SAMPLE_PROJECT_PHOTOS = [
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1592595896551-12b371d546d5?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=800&q=80',
];

const STATUS_OPTIONS: FeaturedProjectItem['status'][] = ['New Launch', 'Under Construction', 'Ready to Move'];

const NEARBY_TYPES: ProjectNearby['type'][] = ['metro', 'airport', 'school', 'hospital', 'tech_park', 'mall', 'highway'];

export default function PostProjectPage() {
  const { user, isAuthenticated, isAuthReady } = useAuth();
  const router = useRouter();

  // Protected page: once the session resolves, send signed-out users (including
  // someone who just logged out) to sign-in. The loader guard below renders
  // meanwhile so the page never flashes a signed-out gatekeeper.
  useEffect(() => {
    if (isAuthReady && !user) router.replace('/auth');
  }, [isAuthReady, user, router]);

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedProjectId, setSubmittedProjectId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Edit mode: /post-project?edit=<projectId> loads an existing project to update.
  const [editId, setEditId] = useState<string | null>(null);
  const [isLoadingEdit, setIsLoadingEdit] = useState(false);
  const [editWasApproved, setEditWasApproved] = useState(false);
  const isEditMode = editId !== null;

  // Listing quota (shared with property listings).
  const [quotaUnlimited, setQuotaUnlimited] = useState(false);
  const [quotaRemaining, setQuotaRemaining] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/billing', { cache: 'no-store' });
        const data = await res.json();
        if (!active || !data?.success || !data?.entitlement) return;
        setQuotaUnlimited(Boolean(data.entitlement.unlimited));
        setQuotaRemaining(data.entitlement.unlimited ? null : data.entitlement.totalRemaining ?? 0);
      } catch {
        /* server still enforces on submit */
      }
    })();
    return () => { active = false; };
  }, [user?.id]);

  const outOfQuota = !quotaUnlimited && quotaRemaining !== null && quotaRemaining <= 0;
  const isBuilder = user?.role === 'builder' || user?.role === 'admin';

  // --- Form state ---
  const [name, setName] = useState('');
  const [builderName, setBuilderName] = useState(user?.companyName || user?.name || '');
  const [city, setCity] = useState(user?.city || 'Bangalore');
  const [locality, setLocality] = useState('');
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState<FeaturedProjectItem['status']>('New Launch');
  const [bhkConfig, setBhkConfig] = useState('2, 3 & 4 BHK');
  const [minPrice, setMinPrice] = useState<number>(12000000);
  const [maxPrice, setMaxPrice] = useState<number>(24000000);
  const [pricePerSqFt, setPricePerSqFt] = useState('');
  const [reraNumber, setReraNumber] = useState('');
  const [possessionDate, setPossessionDate] = useState('Dec 2027');
  const [launchDate, setLaunchDate] = useState('');
  const [totalAreaAcres, setTotalAreaAcres] = useState('');
  const [totalTowers, setTotalTowers] = useState<number>(0);
  const [totalUnits, setTotalUnits] = useState<number>(0);
  const [openSpacePercent, setOpenSpacePercent] = useState('');
  const [tag, setTag] = useState('');
  const [builderExperience, setBuilderExperience] = useState('');
  const [builderDeliveredProjects, setBuilderDeliveredProjects] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [highlights, setHighlights] = useState<string[]>(['RERA Registered', 'Gated Community']);
  const [amenities, setAmenities] = useState<string[]>(['Swimming Pool', 'Clubhouse', 'Gymnasium', '24x7 Security']);
  const [floorPlans, setFloorPlans] = useState<ProjectFloorPlan[]>([]);
  const [nearbyLandmarks, setNearbyLandmarks] = useState<ProjectNearby[]>([]);
  const [images, setImages] = useState<string[]>([SAMPLE_PROJECT_PHOTOS[0]]);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const selectedCityData = CITIES_DATA.find((c) => c.name === city) || CITIES_DATA[0];

  // Prefill the form when opened in edit mode (?edit=<id>).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const id = new URLSearchParams(window.location.search).get('edit');
    if (!id) return;
    setEditId(id);
    setIsLoadingEdit(true);
    let active = true;
    (async () => {
      try {
        const res = await fetch(`/api/projects/${id}`, { cache: 'no-store', credentials: 'same-origin' });
        const data = await res.json().catch(() => ({}));
        if (!active || !res.ok || !data?.success || !data.project) {
          setErrorMessage('Could not load this project for editing.');
          return;
        }
        const p = data.project as FeaturedProjectItem;
        setEditWasApproved(p.submissionStatus === 'approved');
        setName(p.name || '');
        setBuilderName(p.builderName || '');
        setCity(p.city || 'Bangalore');
        setLocality(p.locality || '');
        setAddress(p.address || '');
        setStatus(p.status || 'New Launch');
        setBhkConfig(p.bhkConfig || '');
        setMinPrice(p.minPrice || 0);
        setMaxPrice(p.maxPrice || 0);
        setPricePerSqFt(p.pricePerSqFt || '');
        setReraNumber(p.reraNumber || '');
        setPossessionDate(p.possessionDate || '');
        setLaunchDate(p.launchDate || '');
        setTotalAreaAcres(p.totalAreaAcres || '');
        setTotalTowers(p.totalTowers || 0);
        setTotalUnits(p.totalUnits || 0);
        setOpenSpacePercent(p.openSpacePercent || '');
        setTag(p.tag || '');
        setBuilderExperience(p.builderExperience || '');
        setBuilderDeliveredProjects(p.builderDeliveredProjects || 0);
        setDescription(p.description || '');
        setHighlights(p.highlights || []);
        setAmenities(p.amenities || []);
        setFloorPlans(p.floorPlans || []);
        setNearbyLandmarks(p.nearbyLandmarks || []);
        setImages(p.galleryImages && p.galleryImages.length > 0 ? p.galleryImages : (p.image ? [p.image] : []));
      } catch {
        if (active) setErrorMessage('Could not load this project for editing.');
      } finally {
        if (active) setIsLoadingEdit(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const toggle = (list: string[], set: (v: string[]) => void, val: string) => {
    set(list.includes(val) ? list.filter((x) => x !== val) : [...list, val]);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadError(null);
    setIsUploading(true);
    try {
      const form = new FormData();
      Array.from(files).forEach((f) => form.append('files', f));
      const res = await fetch('/api/upload', { method: 'POST', body: form, credentials: 'same-origin' });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success && Array.isArray(data.urls)) {
        setImages((prev) => [...prev, ...data.urls]);
      } else {
        setUploadError(data.error || 'Upload failed. Please try again.');
      }
    } catch {
      setUploadError('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Floor plan rows (optional — power the "Floor Plans & Configurations" section).
  const addFloorPlan = () =>
    setFloorPlans((prev) => [...prev, { bhk: '', type: '', carpetAreaSqFt: 0, superBuiltUpAreaSqFt: 0, price: '', priceNum: 0, image: '' }]);
  const updateFloorPlan = (idx: number, patch: Partial<ProjectFloorPlan>) =>
    setFloorPlans((prev) => prev.map((fp, i) => (i === idx ? { ...fp, ...patch } : fp)));
  const removeFloorPlan = (idx: number) => setFloorPlans((prev) => prev.filter((_, i) => i !== idx));

  // Nearby landmark rows (optional — power the "Locality & Connectivity" section).
  const addNearby = () => setNearbyLandmarks((prev) => [...prev, { name: '', distance: '', type: 'metro' }]);
  const updateNearby = (idx: number, patch: Partial<ProjectNearby>) =>
    setNearbyLandmarks((prev) => prev.map((n, i) => (i === idx ? { ...n, ...patch } : n)));
  const removeNearby = (idx: number) => setNearbyLandmarks((prev) => prev.filter((_, i) => i !== idx));

  const handleNextStep = () => {
    setErrorMessage(null);
    if (currentStep === 1) {
      if (!name.trim()) { setErrorMessage('Please enter the project name'); return; }
      if (!locality.trim()) { setErrorMessage('Please enter the project locality'); return; }
    } else if (currentStep === 2) {
      if (minPrice <= 0) { setErrorMessage('Please enter a valid starting price'); return; }
    }
    setCurrentStep((p) => Math.min(p + 1, 3));
  };

  const formatPrice = (n: number) =>
    n >= 10000000 ? `₹${(n / 10000000).toFixed(2)} Cr`
    : n >= 100000 ? `₹${(n / 100000).toFixed(1)} Lakh`
    : `₹${n.toLocaleString('en-IN')}`;

  const handleSubmit = async () => {
    setErrorMessage(null);
    // Editing an existing project doesn't consume a new listing credit.
    if (!isEditMode && outOfQuota) {
      setErrorMessage('You have used all your listings. Buy a plan from your dashboard to submit more projects.');
      return;
    }
    if (images.length === 0) {
      setErrorMessage('Please add at least one project image');
      return;
    }
    if (!description.trim()) {
      setErrorMessage('Please add a project description so buyers know what makes this development stand out.');
      return;
    }
    setIsSubmitting(true);
    try {
      const priceFormatted = maxPrice > minPrice
        ? `${formatPrice(minPrice)} – ${formatPrice(maxPrice)}`
        : `${formatPrice(minPrice)} onwards`;

      const payload: Partial<FeaturedProjectItem> = {
        name: name.trim(),
        builderName: builderName.trim() || undefined,
        city,
        locality: locality.trim(),
        address: address.trim() || undefined,
        marketedBy: builderName.trim() || undefined,
        bhkConfig,
        minPrice,
        maxPrice: maxPrice > minPrice ? maxPrice : undefined,
        priceFormatted,
        pricePerSqFt: pricePerSqFt.trim() || undefined,
        image: images[0],
        galleryImages: images,
        status,
        reraNumber: reraNumber.trim() || undefined,
        possessionDate: possessionDate.trim() || undefined,
        launchDate: launchDate.trim() || undefined,
        totalAreaAcres: totalAreaAcres.trim() || undefined,
        totalTowers: totalTowers > 0 ? totalTowers : undefined,
        totalUnits: totalUnits > 0 ? totalUnits : undefined,
        openSpacePercent: openSpacePercent.trim() || undefined,
        tag: tag.trim() || undefined,
        builderExperience: builderExperience.trim() || undefined,
        builderDeliveredProjects: builderDeliveredProjects > 0 ? builderDeliveredProjects : undefined,
        description: description.trim() || undefined,
        highlights,
        amenities,
        floorPlans: floorPlans.filter((fp) => fp.bhk.trim() || fp.type.trim()),
        nearbyLandmarks: nearbyLandmarks.filter((n) => n.name.trim()),
      };

      const res = await fetch(isEditMode ? `/api/projects/${editId}` : '/api/projects', {
        method: isEditMode ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success && data.project) {
        setSubmittedProjectId(data.project.id);
      } else {
        setErrorMessage(data.message || data.error || `Failed to ${isEditMode ? 'save' : 'submit'} project. Please try again.`);
      }
    } catch {
      setErrorMessage(`Failed to ${isEditMode ? 'save' : 'submit'} project. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // While the session resolves, or while redirecting a signed-out user (incl.
  // just after logout) to sign-in, render a loader instead of the post form or
  // a gatekeeper flash.
  if (!isAuthReady || !user) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex items-center gap-3 text-[#64748B] text-sm font-bold">
          <Loader2 className="w-5 h-5 animate-spin text-[#18A67D]" />
          <span>Loading…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between">
      <header className="w-full bg-white border-b border-[#E2E8F0] py-4 px-4 sm:px-8 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group select-none">
              <BrandLogo variant="onLight" className="h-8 w-auto" />
            </Link>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-[#E7F6F1] text-[#0E7C5D] border border-[#18A67D]/20 uppercase">
              {isEditMode ? 'Edit Project' : 'Builder Project Submission'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-xs sm:text-sm font-bold text-[#0F2A43] hover:text-[#18A67D] px-3 py-1.5 rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors">
              My Dashboard
            </Link>
            <Link href="/" className="flex items-center gap-1 text-xs sm:text-sm font-bold text-[#64748B] hover:text-[#0F2A43]">
              <ArrowLeft className="w-4 h-4" />
              <span>Back Home</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto w-full px-4 sm:px-8 py-8 flex-1">
        {!isAuthenticated ? (
          <div className="bg-white rounded-2xl shadow-xl border border-[#E2E8F0] p-8 max-w-xl mx-auto space-y-6 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto border-2 border-amber-200">
              <ShieldCheck className="w-8 h-8 text-[#18A67D]" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F2A43]">Sign In to Submit a Project</h1>
            <p className="text-sm text-[#64748B]">Project submissions are available to registered builder accounts.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link href="/auth?mode=signin" className="w-full py-3 px-4 bg-[#0F2A43] hover:bg-[#163b5c] text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2">
                <Key className="w-4 h-4" /> <span>Sign In</span>
              </Link>
              <Link href="/auth?mode=signup" className="w-full py-3 px-4 bg-[#18A67D] hover:bg-[#0E7C5D] text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> <span>Register</span>
              </Link>
            </div>
          </div>
        ) : !isBuilder ? (
          <div className="bg-white rounded-2xl shadow-xl border border-[#E2E8F0] p-8 max-w-xl mx-auto space-y-5 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto border-2 border-amber-200">
              <Building2 className="w-8 h-8 text-amber-600" />
            </div>
            <h1 className="text-2xl font-extrabold text-[#0F2A43]">Builder Accounts Only</h1>
            <p className="text-sm text-[#64748B]">
              Submitting a development project requires a <strong>builder</strong> account. Your account is currently
              a <strong>{user?.role}</strong>. To list an individual property instead, use Post Property.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Link href="/post-property" className="px-6 py-3 bg-[#18A67D] hover:bg-[#0E7C5D] text-white font-bold rounded-xl text-sm">
                Post a Property Instead
              </Link>
              <Link href="/dashboard" className="px-6 py-3 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F2A43] font-bold rounded-xl text-sm">
                Back to Dashboard
              </Link>
            </div>
          </div>
        ) : submittedProjectId ? (
          <div className="bg-white rounded-2xl shadow-xl border border-[#E2E8F0] p-8 text-center max-w-2xl mx-auto space-y-6">
            <div className="w-16 h-16 rounded-full bg-[#E7F6F1] text-[#18A67D] flex items-center justify-center mx-auto ring-8 ring-[#E7F6F1]/50">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              {isEditMode ? (editWasApproved ? 'Status: Back in Review' : 'Changes Saved') : 'Status: Submitted for Admin Review'}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F2A43]">
              {isEditMode ? 'Your Project Has Been Updated!' : 'Your Project Has Been Submitted!'}
            </h1>
            <p className="text-sm text-[#64748B] max-w-md mx-auto">
              {isEditMode ? (
                editWasApproved ? (
                  <>Because this project was already live, your edits send it back for admin review. It&apos;ll return to the public catalog once re-approved. Track its status under <strong>My Projects</strong> in your dashboard.</>
                ) : (
                  <>Your changes are saved. You can review them on the project page or manage the listing under <strong>My Projects</strong> in your dashboard.</>
                )
              ) : (
                <>Our team reviews project details, RERA registration, and builder credentials before publishing it to the public catalog. You can track its status under <strong>My Projects</strong> in your dashboard.</>
              )}
            </p>
            <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-left text-xs space-y-2 max-w-md mx-auto">
              <div className="flex justify-between"><span className="text-[#64748B]">Project ID:</span><span className="font-mono font-bold text-[#0F2A43]">{submittedProjectId}</span></div>
              <div className="flex justify-between"><span className="text-[#64748B]">Project:</span><span className="font-bold text-[#0F2A43]">{name}</span></div>
              <div className="flex justify-between"><span className="text-[#64748B]">Location:</span><span className="font-bold text-[#0F2A43]">{locality}, {city}</span></div>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link href="/dashboard?tab=projects" className="w-full sm:w-auto px-6 py-3 bg-[#0F2A43] hover:bg-[#163b5c] text-white font-bold rounded-xl text-sm text-center">
                Track in My Projects
              </Link>
              <Link href={`/projects/${submittedProjectId}`} className="w-full sm:w-auto px-6 py-3 bg-[#18A67D] hover:bg-[#0E7C5D] text-white font-bold rounded-xl text-sm text-center">
                Preview Project Page
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E7F6F1] text-[#0E7C5D] text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-[#18A67D]" />
                <span>{isEditMode ? 'Editing your project' : 'Reach verified home buyers • Admin-verified listings'}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0F2A43] tracking-tight">
                {isEditMode ? (
                  <>Edit Your <span className="text-[#18A67D]">Project</span></>
                ) : (
                  <>Submit a Project on <span className="text-[#18A67D]">BayBayt</span></>
                )}
              </h1>
              <p className="text-sm text-[#64748B] max-w-xl mx-auto">
                {isEditMode
                  ? (editWasApproved
                      ? 'Update your project details below. Since this project is live, saving sends it back for admin review before it returns to the catalog.'
                      : 'Update your project details below, then save your changes.')
                  : 'List your development and get it in front of high-intent buyers once our team approves it.'}
              </p>
            </div>

            {/* Stepper */}
            <div className="bg-white p-4 rounded-2xl shadow-xs border border-[#E2E8F0]">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { step: 1, title: 'Project & Location', icon: MapPin },
                  { step: 2, title: 'Config & Pricing', icon: IndianRupee },
                  { step: 3, title: 'Media & Submit', icon: Upload },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = currentStep === item.step;
                  const isDone = currentStep > item.step;
                  return (
                    <button
                      key={item.step}
                      type="button"
                      onClick={() => currentStep > item.step && setCurrentStep(item.step)}
                      className={`flex flex-col sm:flex-row items-center gap-2 p-2.5 rounded-xl text-left transition-all ${
                        isActive ? 'bg-[#E7F6F1] border border-[#18A67D] text-[#0E7C5D]' : isDone ? 'bg-[#F8FAFC] text-[#0F2A43] cursor-pointer' : 'text-[#94A3B8]'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        isActive ? 'bg-[#18A67D] text-white' : isDone ? 'bg-[#0F2A43] text-white' : 'bg-[#E2E8F0] text-[#64748B]'
                      }`}>
                        {isDone ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                      </div>
                      <div className="hidden sm:block text-xs font-bold truncate">{item.title}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {outOfQuota && !isEditMode && (
              <div className="flex items-center justify-between gap-2 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                <span className="flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" /> You&apos;ve used all your listings. Buy a plan to submit more projects.</span>
                <Link href="/dashboard?tab=billing" className="px-3 py-1 rounded-lg bg-rose-600 text-white hover:bg-rose-700 whitespace-nowrap">View plans</Link>
              </div>
            )}

            {isLoadingEdit && (
              <div className="flex items-center gap-2 p-3.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-700 text-xs font-bold">
                <Loader2 className="w-4 h-4 shrink-0 animate-spin" /> Loading project details…
              </div>
            )}

            {errorMessage && (
              <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-md border border-[#E2E8F0] p-6 sm:p-8">
              {/* STEP 1 */}
              {currentStep === 1 && (
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#172033] uppercase">Project Name *</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Eldeco Solano"
                      className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-[#18A67D]" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#172033] uppercase">Builder / Developer Name</label>
                    <input type="text" value={builderName} onChange={(e) => setBuilderName(e.target.value)} placeholder="e.g. Eldeco Group"
                      className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-[#18A67D]" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-[#172033] uppercase">City *</label>
                      <select value={city} onChange={(e) => { setCity(e.target.value); setLocality(''); }}
                        className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-[#18A67D]">
                        {CITIES_DATA.map((c) => (<option key={c.name} value={c.name}>{c.name} ({c.state})</option>))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-[#172033] uppercase">Locality *</label>
                      <input type="text" value={locality} onChange={(e) => setLocality(e.target.value)} placeholder={`e.g. ${selectedCityData.popularLocalities[0] || 'Sector 150'}`}
                        className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-[#18A67D]" />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCityData.popularLocalities.map((loc) => (
                      <button key={loc} type="button" onClick={() => setLocality(loc)}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${locality === loc ? 'bg-[#0F2A43] text-white border-[#0F2A43]' : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#0F2A43] hover:border-[#18A67D]'}`}>
                        {loc}
                      </button>
                    ))}
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#172033] uppercase">Full Address (Optional)</label>
                    <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Landmark, sector, pin code"
                      className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-[#18A67D]" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-[#172033] uppercase">Construction Status</label>
                    <div className="grid grid-cols-3 gap-2">
                      {STATUS_OPTIONS.map((s) => (
                        <button key={s} type="button" onClick={() => setStatus(s)}
                          className={`py-2 px-1 text-center rounded-xl text-xs font-semibold border transition-colors ${status === s ? 'bg-[#0F2A43] text-white border-[#0F2A43]' : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#172033] hover:border-[#18A67D]'}`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2 */}
              {currentStep === 2 && (
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#172033] uppercase">Configurations</label>
                    <input type="text" value={bhkConfig} onChange={(e) => setBhkConfig(e.target.value)} placeholder="e.g. 2, 3 & 4 BHK"
                      className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-[#18A67D]" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-[#172033] uppercase">Starting Price (₹) *</label>
                      <input type="number" value={minPrice} onChange={(e) => setMinPrice(Number(e.target.value))}
                        className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-sm font-black text-[#0E7C5D] outline-none focus:bg-white focus:border-[#18A67D]" />
                      <div className="text-[11px] text-[#64748B]">Formatted: <strong>{formatPrice(minPrice)}</strong></div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-[#172033] uppercase">Max Price (₹)</label>
                      <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))}
                        className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-sm font-bold text-[#172033] outline-none focus:bg-white focus:border-[#18A67D]" />
                      <div className="text-[11px] text-[#64748B]">Formatted: <strong>{formatPrice(maxPrice)}</strong></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-[#172033] uppercase">Price / sq.ft (Optional)</label>
                      <input type="text" value={pricePerSqFt} onChange={(e) => setPricePerSqFt(e.target.value)} placeholder="e.g. ₹8,500"
                        className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-[#18A67D]" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-[#172033] uppercase">Launch Date (Optional)</label>
                      <input type="text" value={launchDate} onChange={(e) => setLaunchDate(e.target.value)} placeholder="e.g. March 2024"
                        className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-[#18A67D]" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-[#172033] uppercase">Possession Date</label>
                      <input type="text" value={possessionDate} onChange={(e) => setPossessionDate(e.target.value)} placeholder="e.g. Dec 2027"
                        className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-[#18A67D]" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-[#172033] uppercase">Total Area (acres)</label>
                      <input type="text" value={totalAreaAcres} onChange={(e) => setTotalAreaAcres(e.target.value)} placeholder="e.g. 12.5"
                        className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-[#18A67D]" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-[#172033] uppercase">Total Towers</label>
                      <input type="number" value={totalTowers} onChange={(e) => setTotalTowers(Number(e.target.value))}
                        className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-[#18A67D]" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-[#172033] uppercase">Total Units</label>
                      <input type="number" value={totalUnits} onChange={(e) => setTotalUnits(Number(e.target.value))}
                        className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-[#18A67D]" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-[#172033] uppercase">Open Space</label>
                      <input type="text" value={openSpacePercent} onChange={(e) => setOpenSpacePercent(e.target.value)} placeholder="e.g. 75% Open & Landscaped Area"
                        className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-[#18A67D]" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-[#172033] uppercase">Promo Tag (Optional)</label>
                      <input type="text" value={tag} onChange={(e) => setTag(e.target.value)} placeholder="e.g. Exclusive Villas"
                        className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-[#18A67D]" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#172033] uppercase">RERA Registration Number</label>
                    <input type="text" value={reraNumber} onChange={(e) => setReraNumber(e.target.value)} placeholder="e.g. UPRERAPRJ123456"
                      className="w-full p-2.5 bg-white border border-[#CBD5E1] rounded-xl text-sm font-mono uppercase font-bold outline-none focus:border-[#18A67D]" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-[#172033] uppercase">Builder Experience</label>
                      <input type="text" value={builderExperience} onChange={(e) => setBuilderExperience(e.target.value)} placeholder="e.g. 35+ Years in Real Estate"
                        className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-[#18A67D]" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-[#172033] uppercase">Projects Delivered</label>
                      <input type="number" value={builderDeliveredProjects} onChange={(e) => setBuilderDeliveredProjects(Number(e.target.value))} placeholder="e.g. 45"
                        className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-[#18A67D]" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-[#172033] uppercase">Highlights</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {PROJECT_HIGHLIGHTS.map((h) => {
                        const on = highlights.includes(h);
                        return (
                          <button key={h} type="button" onClick={() => toggle(highlights, setHighlights, h)}
                            className={`p-2.5 rounded-xl text-left text-xs font-medium border transition-all flex items-center justify-between ${on ? 'bg-[#E7F6F1] border-[#18A67D] text-[#0E7C5D] font-bold' : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] hover:border-[#CBD5E1]'}`}>
                            <span className="truncate">{h}</span>
                            {on && <Check className="w-3.5 h-3.5 text-[#18A67D] shrink-0 ml-1" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3 */}
              {currentStep === 3 && (
                <div className="space-y-5">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-[#172033] uppercase tracking-wider">Project Images ({images.length})</label>
                      <span className="text-[11px] text-[#64748B]">The first image is used as the cover</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {images.map((img, idx) => (
                        <div key={idx} className="relative group rounded-xl overflow-hidden border border-[#E2E8F0] aspect-video bg-[#F1F5F9]">
                          <Image src={img} alt={`Project photo ${idx + 1}`} fill className="object-cover" referrerPolicy="no-referrer" />
                          {idx === 0 && <span className="absolute bottom-1 left-1 text-[10px] font-bold bg-[#0F2A43] text-white px-1.5 py-0.5 rounded">Cover</span>}
                          <button type="button" onClick={() => setImages(images.filter((_, i) => i !== idx))}
                            className="absolute top-1.5 right-1.5 p-1 bg-red-600 text-white rounded-lg opacity-90 hover:opacity-100 z-10">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/avif,image/gif" multiple onChange={handleFileUpload} className="hidden" />
                    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-[#CBD5E1] hover:border-[#18A67D] hover:bg-[#E7F6F1] rounded-xl text-sm font-bold text-[#0F2A43] transition-colors disabled:opacity-60">
                      {isUploading ? (<><Loader2 className="w-4 h-4 animate-spin" /><span>Uploading…</span></>) : (<><Upload className="w-4 h-4" /><span>Upload images from your device</span></>)}
                    </button>
                    {uploadError && <p className="text-xs text-red-600 font-medium">{uploadError}</p>}
                    <div className="flex gap-2 pt-1">
                      <input type="url" value={customImageUrl} onChange={(e) => setCustomImageUrl(e.target.value)} placeholder="Or paste image URL (https://...)"
                        className="flex-1 p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-sm outline-none" />
                      <button type="button" onClick={() => { if (customImageUrl.trim()) { setImages([...images, customImageUrl.trim()]); setCustomImageUrl(''); } }}
                        className="px-4 py-2 bg-[#0F2A43] hover:bg-[#163b5c] text-white rounded-xl text-xs font-bold flex items-center gap-1">
                        <Plus className="w-4 h-4" /> <span>Add</span>
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {SAMPLE_PROJECT_PHOTOS.map((preset, i) => (
                        <button key={i} type="button" onClick={() => !images.includes(preset) && setImages([...images, preset])}
                          className="text-xs px-2.5 py-1 bg-[#F1F5F9] hover:bg-[#E2E8F0] rounded-lg text-[#0F2A43] font-medium transition-colors">
                          + Sample #{i + 1}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <label className="block text-xs font-bold text-[#172033] uppercase tracking-wider">Amenities</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {PROJECT_AMENITIES.map((a) => {
                        const on = amenities.includes(a);
                        return (
                          <button key={a} type="button" onClick={() => toggle(amenities, setAmenities, a)}
                            className={`p-2.5 rounded-xl text-left text-xs font-medium border transition-all flex items-center justify-between ${on ? 'bg-[#E7F6F1] border-[#18A67D] text-[#0E7C5D] font-bold' : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] hover:border-[#CBD5E1]'}`}>
                            <span className="truncate">{a}</span>
                            {on && <Check className="w-3.5 h-3.5 text-[#18A67D] shrink-0 ml-1" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <label className="block text-xs font-bold text-[#172033] uppercase">Project Description *</label>
                    <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe the development, its location advantages, and what makes it stand out..."
                      className="w-full p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-sm outline-none" />
                  </div>

                  {/* Floor Plans (optional) */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-[#172033] uppercase tracking-wider">Floor Plans & Configurations ({floorPlans.length})</label>
                      <button type="button" onClick={addFloorPlan}
                        className="px-3 py-1.5 bg-[#0F2A43] hover:bg-[#163b5c] text-white rounded-lg text-xs font-bold flex items-center gap-1">
                        <Plus className="w-3.5 h-3.5" /> <span>Add Plan</span>
                      </button>
                    </div>
                    {floorPlans.length === 0 && (
                      <p className="text-[11px] text-[#94A3B8]">Optional. Add unit layouts to power the &quot;Floor Plans&quot; section on your project page.</p>
                    )}
                    {floorPlans.map((fp, idx) => (
                      <div key={idx} className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-[#64748B] uppercase">Plan {idx + 1}</span>
                          <button type="button" onClick={() => removeFloorPlan(idx)} className="p-1 text-red-600 hover:bg-red-50 rounded-lg">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <input type="text" value={fp.bhk} onChange={(e) => updateFloorPlan(idx, { bhk: e.target.value })} placeholder="BHK e.g. 3 BHK"
                            className="p-2 bg-white border border-[#CBD5E1] rounded-lg text-xs outline-none focus:border-[#18A67D]" />
                          <input type="text" value={fp.type} onChange={(e) => updateFloorPlan(idx, { type: e.target.value })} placeholder="Type e.g. Corner"
                            className="p-2 bg-white border border-[#CBD5E1] rounded-lg text-xs outline-none focus:border-[#18A67D]" />
                          <input type="number" value={fp.carpetAreaSqFt || ''} onChange={(e) => updateFloorPlan(idx, { carpetAreaSqFt: Number(e.target.value) })} placeholder="Carpet sq.ft"
                            className="p-2 bg-white border border-[#CBD5E1] rounded-lg text-xs outline-none focus:border-[#18A67D]" />
                          <input type="number" value={fp.superBuiltUpAreaSqFt || ''} onChange={(e) => updateFloorPlan(idx, { superBuiltUpAreaSqFt: Number(e.target.value) })} placeholder="Built-up sq.ft"
                            className="p-2 bg-white border border-[#CBD5E1] rounded-lg text-xs outline-none focus:border-[#18A67D]" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input type="text" value={fp.price} onChange={(e) => updateFloorPlan(idx, { price: e.target.value, priceNum: Number(e.target.value.replace(/[^0-9]/g, '')) || fp.priceNum })} placeholder="Price e.g. ₹1.85 Cr"
                            className="p-2 bg-white border border-[#CBD5E1] rounded-lg text-xs outline-none focus:border-[#18A67D]" />
                          <input type="url" value={fp.image} onChange={(e) => updateFloorPlan(idx, { image: e.target.value })} placeholder="Floor plan image URL"
                            className="p-2 bg-white border border-[#CBD5E1] rounded-lg text-xs outline-none focus:border-[#18A67D]" />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Nearby Landmarks (optional) */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-[#172033] uppercase tracking-wider">Nearby Landmarks ({nearbyLandmarks.length})</label>
                      <button type="button" onClick={addNearby}
                        className="px-3 py-1.5 bg-[#0F2A43] hover:bg-[#163b5c] text-white rounded-lg text-xs font-bold flex items-center gap-1">
                        <Plus className="w-3.5 h-3.5" /> <span>Add Landmark</span>
                      </button>
                    </div>
                    {nearbyLandmarks.length === 0 && (
                      <p className="text-[11px] text-[#94A3B8]">Optional. Add connectivity points to power the &quot;Locality &amp; Connectivity&quot; section.</p>
                    )}
                    {nearbyLandmarks.map((n, idx) => (
                      <div key={idx} className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-2 items-center p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
                        <input type="text" value={n.name} onChange={(e) => updateNearby(idx, { name: e.target.value })} placeholder="e.g. Metro Station"
                          className="p-2 bg-white border border-[#CBD5E1] rounded-lg text-xs outline-none focus:border-[#18A67D]" />
                        <input type="text" value={n.distance} onChange={(e) => updateNearby(idx, { distance: e.target.value })} placeholder="e.g. 2.5 km"
                          className="p-2 bg-white border border-[#CBD5E1] rounded-lg text-xs outline-none focus:border-[#18A67D] w-full sm:w-28" />
                        <select value={n.type} onChange={(e) => updateNearby(idx, { type: e.target.value as ProjectNearby['type'] })}
                          className="p-2 bg-white border border-[#CBD5E1] rounded-lg text-xs outline-none focus:border-[#18A67D]">
                          {NEARBY_TYPES.map((t) => (<option key={t} value={t}>{t.replace('_', ' ')}</option>))}
                        </select>
                        <button type="button" onClick={() => removeNearby(idx)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg justify-self-start">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 bg-[#E7F6F1] border border-[#18A67D]/20 rounded-xl flex items-start gap-2.5 text-xs text-[#0E7C5D]">
                    <CheckCircle2 className="w-4 h-4 text-[#18A67D] shrink-0 mt-0.5" />
                    <span>{isEditMode
                      ? (editWasApproved
                          ? 'This project is live. Saving your edits sends it back to the admin review queue, and it returns to the catalog once re-approved.'
                          : 'Saving updates your project. It stays in its current review status until an admin approves it.')
                      : 'On submit, your project enters the admin review queue and is published to the catalog once approved.'}</span>
                  </div>
                </div>
              )}

              {/* Footer nav */}
              <div className="pt-6 mt-6 border-t border-[#E2E8F0] flex items-center justify-between">
                {currentStep > 1 ? (
                  <button type="button" onClick={() => setCurrentStep((p) => p - 1)}
                    className="px-5 py-2.5 rounded-xl border border-[#CBD5E1] text-[#0F2A43] text-xs font-bold hover:bg-[#F8FAFC]">
                    &larr; Previous Step
                  </button>
                ) : (
                  <Link href="/dashboard" className="text-xs font-semibold text-[#64748B] hover:text-[#0F2A43]">Cancel</Link>
                )}

                {currentStep < 3 ? (
                  <button type="button" onClick={handleNextStep}
                    className="px-6 py-2.5 bg-[#18A67D] hover:bg-[#0E7C5D] text-white font-bold rounded-xl text-sm flex items-center gap-1.5 shadow-md">
                    <span>Continue to Step {currentStep + 1}</span><span>&rarr;</span>
                  </button>
                ) : (
                  <button type="button" onClick={handleSubmit} disabled={isSubmitting || (outOfQuota && !isEditMode)}
                    className="px-8 py-3 bg-[#18A67D] hover:bg-[#0E7C5D] text-white font-bold rounded-xl text-sm flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
                    {isSubmitting ? (<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />) : (<><ShieldCheck className="w-4 h-4" /><span>{isEditMode ? 'Save Changes' : 'Submit for Review'}</span></>)}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="w-full border-t border-[#E2E8F0] bg-white py-4 px-4 text-center text-xs text-[#64748B]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; {new Date().getFullYear()} BayBayt Technologies India Pvt Ltd.</span>
          <div className="flex items-center gap-4 text-xs font-medium">
            <Link href="/" className="hover:text-[#18A67D]">Home</Link>
            <span className="text-slate-300">•</span>
            <Link href="/projects" className="hover:text-[#18A67D]">Browse Projects</Link>
            <span className="text-slate-300">•</span>
            <Link href="/dashboard" className="hover:text-[#18A67D]">Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
