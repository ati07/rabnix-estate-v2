'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { BrandLogo } from '@/components/BrandLogo';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  Home, 
  ArrowLeft, 
  ShieldCheck, 
  CheckCircle2, 
  Upload, 
  IndianRupee, 
  MapPin, 
  Layers, 
  Sparkles, 
  FileText, 
  Check, 
  AlertCircle,
  Clock,
  Plus,
  Trash2,
  Key,
  Compass,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { useProperties } from '@/lib/propertyContext';
import { ListingType, CommercialListingType, PropertyCategory, FurnishingStatus, ConstructionStatus, FacingDirection } from '@/lib/types';
import { CITIES_DATA } from '@/lib/realEstateData';
import LocationPicker, { type LatLng } from '@/components/LocationPicker';
import { LocationSelect } from '@/components/location/LocationSelect';
import { MediaUploadFields, type PropertyMediaValue } from '@/components/media/MediaUploadFields';
import { findStateForCity, DEFAULT_COUNTRY } from '@/lib/locationData';
import { GENIE_LISTING_DRAFT_KEY, type GenieListingDraft } from '@/lib/genie/listingDraft';

// Commercial listings use a dedicated set of property types (Office / Shop /
// Warehouse / Land) and a rent-or-sale deal type instead of residential BHK.
const COMMERCIAL_CATEGORIES: { label: string; value: PropertyCategory }[] = [
  { label: 'Office', value: 'Commercial Office' },
  { label: 'Shop', value: 'Retail Shop' },
  { label: 'Warehouse', value: 'Warehouse' },
  { label: 'Land', value: 'Commercial Land' },
];
const RESIDENTIAL_CATEGORIES: PropertyCategory[] = [
  'Apartment', 'Villa', 'Builder Floor', 'Penthouse', 'Studio', 'Residential Plot',
];
// Commercial spaces can't be smaller than this.
const MIN_COMMERCIAL_SIZE_SQFT = 80;

const AMENITIES_LIST = [
  'Swimming Pool', 'Gymnasium', 'Clubhouse', 'Children Play Area',
  '24x7 Security', 'Power Backup', 'Covered Car Parking', 'Intercom Facility',
  'Jogging Track', 'Landscaped Gardens', 'EV Charging Station', 'Rainwater Harvesting',
  'Visitor Parking', 'CCTV Surveillance', 'Badminton Court', 'Squash Court',
  'Infinity Pool', 'Rooftop Lounge', 'Co-working Pods', 'Solar Panels'
];

const SAMPLE_PHOTO_PRESETS = [
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80'
];

export default function PostPropertyPage() {
  const router = useRouter();
  const { user, isAuthenticated, isAuthReady } = useAuth();
  const { addProperty } = useProperties();

  // Protected page: once the session resolves, send signed-out users (including
  // someone who just logged out) to sign-in. The loader guard below renders
  // meanwhile so the page never flashes a signed-out gatekeeper.
  useEffect(() => {
    if (isAuthReady && !user) router.replace('/auth');
  }, [isAuthReady, user, router]);

  // Multi-step progression
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedPropertyId, setSubmittedPropertyId] = useState<string | null>(null);

  // Listing quota (null = unknown/loading). Admins are unlimited.
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
        /* non-fatal — server still enforces the limit on submit */
      }
    })();
    return () => { active = false; };
  }, [user?.id]);

  const outOfQuota = !quotaUnlimited && quotaRemaining !== null && quotaRemaining <= 0;

  // Form States
  const [listingType, setListingType] = useState<ListingType>('buy');
  const [commercialListingType, setCommercialListingType] = useState<CommercialListingType>('sale');
  const [category, setCategory] = useState<PropertyCategory>('Apartment');
  const [city, setCity] = useState<string>(user?.city || 'Bangalore');
  const [country, setCountry] = useState<string>(
    () => findStateForCity(user?.city || 'Bangalore')?.country || DEFAULT_COUNTRY
  );
  const [state, setState] = useState<string>(
    () => findStateForCity(user?.city || 'Bangalore')?.state || 'Karnataka'
  );
  const [locality, setLocality] = useState<string>('');
  const [subLocality, setSubLocality] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [coordinates, setCoordinates] = useState<LatLng | undefined>(undefined);
  const [title, setTitle] = useState<string>('');
  const [bhk, setBhk] = useState<number>(2);
  const [bathrooms, setBathrooms] = useState<number>(2);
  const [balconies, setBalconies] = useState<number>(1);
  const [carpetAreaSqFt, setCarpetAreaSqFt] = useState<number>(1200);
  const [superBuiltUpAreaSqFt, setSuperBuiltUpAreaSqFt] = useState<number>(1450);
  const [price, setPrice] = useState<number>(8500000);
  const [maintenance, setMaintenance] = useState<number>(3500);
  const [furnishing, setFurnishing] = useState<FurnishingStatus>('Semi-Furnished');
  const [floor, setFloor] = useState<number>(5);
  const [totalFloors, setTotalFloors] = useState<number>(14);
  const [facing, setFacing] = useState<FacingDirection>('East');
  const [constructionStatus, setConstructionStatus] = useState<ConstructionStatus>('Ready to Move');
  const [possessionDate, setPossessionDate] = useState<string>('Immediate');
  const [reraId, setReraId] = useState<string>('PRM/KA/RERA/1251/310/PR/200115/003188');
  const [description, setDescription] = useState<string>(
    'Well ventilated, Vastu compliant home with premium fittings, spacious modular kitchen, and panoramic skyline views in a prime gated community.'
  );
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    'Swimming Pool',
    'Gymnasium',
    '24/7 Security',
    'Power Backup',
    'Club House',
    'Covered Parking'
  ]);
  const [images, setImages] = useState<string[]>([
    SAMPLE_PHOTO_PRESETS[0],
    SAMPLE_PHOTO_PRESETS[1]
  ]);
  const [customImageUrl, setCustomImageUrl] = useState<string>('');
  const [media, setMedia] = useState<PropertyMediaValue>({ panoramaImages: [], videoUrl: '', virtualTourUrl: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Verification documents checkboxes
  const [hasEncumbranceCert, setHasEncumbranceCert] = useState(true);
  const [hasFloorPlanDoc, setHasFloorPlanDoc] = useState(true);
  const [hasTaxReceipt, setHasTaxReceipt] = useState(true);

  // Contact Info
  const [contactName, setContactName] = useState(user?.name || 'Rahul Sharma');
  const [contactPhone, setContactPhone] = useState(user?.phone || '+91 98765 43210');
  const [contactEmail, setContactEmail] = useState(user?.email || 'rahul.sharma@example.com');
  const [postedAs, setPostedAs] = useState<'Owner' | 'Verified Agent' | 'Builder'>(
    user?.role === 'builder' ? 'Builder' : user?.role === 'agent' ? 'Verified Agent' : 'Owner'
  );

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedCityData = CITIES_DATA.find((c) => c.name === city) || CITIES_DATA[0];
  const isCommercial = listingType === 'commercial';
  // Commercial-rent and residential rent/pg are all monthly; everything else is a total sale price.
  const isMonthlyPrice = listingType === 'rent' || listingType === 'pg' || (isCommercial && commercialListingType === 'rent');

  // Prefill from a BayBayt Genie conversation. The drawer stashes a draft in
  // sessionStorage and routes here; we apply it once, then clear it so a manual
  // revisit starts clean. The user still reviews, adds photos and submits.
  useEffect(() => {
    let raw: string | null = null;
    try {
      raw = sessionStorage.getItem(GENIE_LISTING_DRAFT_KEY);
      if (raw) sessionStorage.removeItem(GENIE_LISTING_DRAFT_KEY);
    } catch {
      return;
    }
    if (!raw) return;

    let draft: GenieListingDraft;
    try {
      draft = JSON.parse(raw);
    } catch {
      return;
    }

    if (draft.listingType) {
      setListingType(draft.listingType as ListingType);
      if (draft.listingType === 'commercial' && draft.commercialListingType) {
        setCommercialListingType(draft.commercialListingType as CommercialListingType);
      }
    }
    if (draft.category) setCategory(draft.category as PropertyCategory);
    if (draft.city) {
      setCity(draft.city);
      // Keep the cascading pickers consistent with the Genie-supplied city.
      const match = findStateForCity(draft.city);
      if (match) {
        setCountry(match.country);
        setState(match.state);
      }
    }
    if (draft.locality) setLocality(draft.locality);
    if (draft.subLocality) setSubLocality(draft.subLocality);
    if (draft.title) setTitle(draft.title);
    if (typeof draft.bhk === 'number') setBhk(draft.bhk);
    if (typeof draft.bathrooms === 'number') setBathrooms(draft.bathrooms);
    if (typeof draft.carpetAreaSqFt === 'number') setCarpetAreaSqFt(draft.carpetAreaSqFt);
    if (typeof draft.price === 'number') setPrice(draft.price);
    if (draft.furnishing) setFurnishing(draft.furnishing as FurnishingStatus);
    if (draft.constructionStatus) setConstructionStatus(draft.constructionStatus as ConstructionStatus);
    if (draft.description) setDescription(draft.description);
  }, []);

  // Switching the listing purpose keeps the category valid for that purpose.
  const handleListingTypeChange = (next: ListingType) => {
    setListingType(next);
    if (next === 'commercial') {
      if (!COMMERCIAL_CATEGORIES.some((c) => c.value === category)) setCategory('Commercial Office');
    } else if (COMMERCIAL_CATEGORIES.some((c) => c.value === category)) {
      setCategory('Apartment');
    }
  };

  const handleToggleAmenity = (name: string) => {
    if (selectedAmenities.includes(name)) {
      setSelectedAmenities(selectedAmenities.filter((a) => a !== name));
    } else {
      setSelectedAmenities([...selectedAmenities, name]);
    }
  };

  const handleAddPhoto = () => {
    if (customImageUrl.trim()) {
      setImages([...images, customImageUrl.trim()]);
      setCustomImageUrl('');
    }
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

  const handleAddPresetPhoto = (url: string) => {
    if (!images.includes(url)) {
      setImages([...images, url]);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleNextStep = () => {
    setErrorMessage(null);
    if (currentStep === 1) {
      if (!locality.trim()) {
        setErrorMessage('Please enter or select the property locality');
        return;
      }
      if (!title.trim()) {
        // Auto-generate title if empty
        setTitle(isCommercial ? `${category} in ${locality}, ${city}` : `${bhk} BHK ${category} in ${locality}, ${city}`);
      }
    } else if (currentStep === 2) {
      if (price <= 0) {
        setErrorMessage('Please enter a valid price / rent amount');
        return;
      }
      if (isCommercial && carpetAreaSqFt < MIN_COMMERCIAL_SIZE_SQFT) {
        setErrorMessage(`Commercial size must be at least ${MIN_COMMERCIAL_SIZE_SQFT} sq.ft`);
        return;
      }
      if (carpetAreaSqFt <= 0) {
        setErrorMessage('Please enter valid carpet area');
        return;
      }
    } else if (currentStep === 3) {
      if (images.length === 0) {
        setErrorMessage('Please add at least 1 property photograph');
        return;
      }
    }
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const handleSubmitListing = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Listing quota: block before posting if the user is out of listings.
    if (outOfQuota) {
      setErrorMessage('You have used all your listings. Buy a plan from your dashboard to post more properties.');
      return;
    }

    setIsSubmitting(true);

    try {
      const generatedTitle = title.trim() || (isCommercial
        ? `${category} in ${locality}, ${city}`
        : `${bhk} BHK ${category} in ${locality}, ${city}`);

      const documents: string[] = [];
      if (hasEncumbranceCert) documents.push('Encumbrance Certificate (EC)');
      if (hasFloorPlanDoc) documents.push('Approved Sanction Plan');
      if (hasTaxReceipt) documents.push('Property Tax Clearance');

      const created = addProperty({
        title: generatedTitle,
        tagline: isCommercial
          ? `${category} • ${carpetAreaSqFt} sq.ft • ${furnishing}`
          : `${bhk} BHK • ${carpetAreaSqFt} sq.ft • ${furnishing}`,
        listingType,
        commercialListingType: isCommercial ? commercialListingType : undefined,
        category,
        city,
        state: state || undefined,
        country: country || DEFAULT_COUNTRY,
        locality: locality || selectedCityData.popularLocalities[0],
        subLocality,
        address: address || undefined,
        coordinates,
        price,
        carpetAreaSqFt,
        superBuiltUpAreaSqFt: superBuiltUpAreaSqFt || Math.round(carpetAreaSqFt * 1.2),
        bhk: isCommercial ? undefined : bhk,
        bathrooms,
        balconies: isCommercial ? undefined : balconies,
        furnishing,
        floor,
        totalFloors,
        facing,
        constructionStatus,
        possessionDate,
        maintenance,
        reraId,
        reraApproved: !!reraId,
        images: images.length > 0 ? images : [SAMPLE_PHOTO_PRESETS[0]],
        panoramaImages: media.panoramaImages,
        videoUrl: media.videoUrl || undefined,
        virtualTourUrl: media.virtualTourUrl || undefined,
        description,
        amenities: selectedAmenities,
        documentsSubmitted: documents,
        postedByUserId: user?.id || 'usr-owner-202',
        postedBy: {
          name: contactName,
          type: postedAs,
          phone: contactPhone,
          companyName: user?.companyName || (postedAs === 'Owner' ? 'Direct Property Owner' : 'Realty Partners'),
          responseTime: 'Within 2 hours',
          rating: 4.9
        }
      });

      setSubmittedPropertyId(created.id);
      setIsSubmitting(false);
    } catch {
      setIsSubmitting(false);
      setErrorMessage('Failed to submit listing. Please try again.');
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

      {/* Top Header Bar */}
      <header className="w-full bg-white border-b border-[#E2E8F0] py-4 px-4 sm:px-8 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group select-none">
              <BrandLogo variant="onLight" className="h-8 w-auto" />
            </Link>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-[#E7F6F1] text-[#0E7C5D] border border-[#18A67D]/20 uppercase">
              Free Property Listing Portal
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-xs sm:text-sm font-bold text-[#0F2A43] hover:text-[#18A67D] px-3 py-1.5 rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors"
            >
              My Dashboard
            </Link>
            <Link
              href="/"
              className="flex items-center gap-1 text-xs sm:text-sm font-bold text-[#64748B] hover:text-[#0F2A43]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back Home</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto w-full px-4 sm:px-8 py-8 flex-1">
        
        {/* If Not Authenticated, show login gatekeeper */}
        {!isAuthenticated ? (
          <div className="bg-white rounded-2xl shadow-xl border border-[#E2E8F0] p-8 max-w-xl mx-auto space-y-6 text-center animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border-2 border-amber-200 shadow-xs">
              <ShieldCheck className="w-8 h-8 text-[#18A67D]" />
            </div>

            <div className="space-y-2">
              <span className="bg-[#E7F6F1] text-[#0E7C5D] text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Authentication Required
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F2A43]">
                Sign In to Post Your Property
              </h1>
              <p className="text-xs sm:text-sm text-[#64748B] max-w-md mx-auto leading-relaxed">
                To prevent spam, maintain 100% verified listings, and connect you directly with genuine buyers, you must be logged into your BayBayt account.
              </p>
            </div>

            <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-left text-xs space-y-2 text-[#64748B]">
              <div className="flex items-center gap-2 text-[#0F2A43] font-bold">
                <CheckCircle2 className="w-4 h-4 text-[#18A67D]" />
                <span>Direct seller inquiries</span>
              </div>
              <div className="flex items-center gap-2 text-[#0F2A43] font-bold">
                <CheckCircle2 className="w-4 h-4 text-[#18A67D]" />
                <span>Live leads & views analytics in your Dashboard</span>
              </div>
              <div className="flex items-center gap-2 text-[#0F2A43] font-bold">
                <CheckCircle2 className="w-4 h-4 text-[#18A67D]" />
                <span>Instant RERA & document verification seal</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Link
                  href="/auth?mode=signin"
                  className="w-full py-3 px-4 bg-[#0F2A43] hover:bg-[#163b5c] text-white font-bold text-sm rounded-xl transition-all shadow-sm text-center flex items-center justify-center gap-2"
                >
                  <Key className="w-4 h-4" />
                  <span>Sign In</span>
                </Link>
                <Link
                  href="/auth?mode=signup"
                  className="w-full py-3 px-4 bg-[#18A67D] hover:bg-[#0E7C5D] text-white font-bold text-sm rounded-xl transition-all shadow-sm text-center flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Register Free</span>
                </Link>
              </div>
            </div>
          </div>
        ) : submittedPropertyId ? (
          <div className="bg-white rounded-2xl shadow-xl border border-[#E2E8F0] p-8 text-center max-w-2xl mx-auto space-y-6 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-[#E7F6F1] text-[#18A67D] flex items-center justify-center mx-auto ring-8 ring-[#E7F6F1]/50">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Status: Submitted for Admin Verification
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F2A43]">
                Your Property is Successfully Listed!
              </h1>
              <p className="text-sm text-[#64748B] max-w-md mx-auto">
                Our verification team reviews property titles, RERA numbers, and floor dimensions within <strong>2 to 4 business hours</strong> before granting the verified green seal.
              </p>
            </div>

            <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-left text-xs space-y-2 max-w-md mx-auto">
              <div className="flex justify-between">
                <span className="text-[#64748B]">Listing ID:</span>
                <span className="font-mono font-bold text-[#0F2A43]">{submittedPropertyId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Property:</span>
                <span className="font-bold text-[#0F2A43]">{title || `${bhk} BHK in ${locality}, ${city}`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Expected Price / Rent:</span>
                <span className="font-bold text-[#18A67D]">₹{price.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                href="/dashboard"
                className="w-full sm:w-auto px-6 py-3 bg-[#0F2A43] hover:bg-[#163b5c] text-white font-bold rounded-xl text-sm transition-colors text-center"
              >
                Track in My Dashboard
              </Link>
              <Link
                href={`/properties/${submittedPropertyId}`}
                className="w-full sm:w-auto px-6 py-3 bg-[#18A67D] hover:bg-[#0E7C5D] text-white font-bold rounded-xl text-sm transition-colors text-center"
              >
                Preview Public Listing Page
              </Link>
              <Link
                href="/admin"
                className="w-full sm:w-auto px-6 py-3 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F2A43] font-bold rounded-xl text-sm transition-colors text-center"
              >
                Go to Admin Verification Queue &rarr;
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* Page Title & Intro */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E7F6F1] text-[#0E7C5D] text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-[#18A67D]" />
                <span>100% Free • Direct Buyer Reach</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0F2A43] tracking-tight">
                Post Property on <span className="text-[#18A67D]">BayBayt</span>
              </h1>
              <p className="text-sm text-[#64748B] max-w-xl mx-auto">
                Reach verified home buyers and tenants. Get high-intent inquiries directly on your phone or WhatsApp.
              </p>
            </div>

            {/* Stepper Indicator */}
            <div className="bg-white p-4 rounded-2xl shadow-xs border border-[#E2E8F0]">
              <div className="grid grid-cols-4 gap-2">
                {[
                  { step: 1, title: 'Category & Location', icon: MapPin },
                  { step: 2, title: 'Specs & Pricing', icon: IndianRupee },
                  { step: 3, title: 'Photos & Amenities', icon: Upload },
                  { step: 4, title: 'Verify & Submit', icon: ShieldCheck }
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
                        isActive 
                          ? 'bg-[#E7F6F1] border border-[#18A67D] text-[#0E7C5D]' 
                          : isDone 
                          ? 'bg-[#F8FAFC] text-[#0F2A43] cursor-pointer' 
                          : 'text-[#94A3B8]'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        isActive 
                          ? 'bg-[#18A67D] text-white' 
                          : isDone 
                          ? 'bg-[#0F2A43] text-white' 
                          : 'bg-[#E2E8F0] text-[#64748B]'
                      }`}>
                        {isDone ? <Check className="w-3.5 h-3.5" /> : item.step}
                      </div>
                      <div className="hidden sm:block text-xs font-bold truncate">
                        {item.title}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Out-of-quota Banner */}
            {outOfQuota && (
              <div className="flex items-center justify-between gap-2 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold animate-in fade-in">
                <span className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  You&apos;ve used all your listings. Buy a plan to post more properties.
                </span>
                <Link href="/dashboard" className="px-3 py-1 rounded-lg bg-rose-600 text-white hover:bg-rose-700 whitespace-nowrap">
                  View plans
                </Link>
              </div>
            )}

            {/* Error Banner */}
            {errorMessage && (
              <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Step Forms */}
            <div className="bg-white rounded-2xl shadow-md border border-[#E2E8F0] p-6 sm:p-8">
              
              {/* ================= STEP 1: CATEGORY & LOCATION ================= */}
              {currentStep === 1 && (
                <div className="space-y-6 animate-in fade-in">
                  
                  {/* Listing Type Picker */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-[#172033] uppercase tracking-wider">
                      I Want to:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {[
                        { id: 'buy', label: 'Sell Property' },
                        { id: 'rent', label: 'Rent / Lease' },
                        { id: 'pg', label: 'List PG / Hostels' },
                        { id: 'commercial', label: 'Commercial' },
                        { id: 'plot', label: 'Plots / Land' }
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => handleListingTypeChange(t.id as ListingType)}
                          className={`py-3 px-3 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                            listingType === t.id
                              ? 'bg-[#0F2A43] text-white border-[#0F2A43] shadow-xs'
                              : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#172033] hover:border-[#18A67D]'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Commercial Rent / Sale deal type */}
                  {isCommercial && (
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-[#172033] uppercase tracking-wider">
                        Commercial Deal Type:
                      </label>
                      <div className="grid grid-cols-2 gap-2 max-w-xs">
                        {([
                          { id: 'sale', label: 'For Sale' },
                          { id: 'rent', label: 'For Rent' },
                        ] as { id: CommercialListingType; label: string }[]).map((d) => (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => setCommercialListingType(d.id)}
                            className={`py-2.5 px-3 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                              commercialListingType === d.id
                                ? 'bg-[#18A67D] text-white border-[#18A67D] shadow-xs'
                                : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#172033] hover:border-[#18A67D]'
                            }`}
                          >
                            {d.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Property Category */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-[#172033] uppercase tracking-wider">
                      {isCommercial ? 'Commercial Type:' : 'Property Category:'}
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(isCommercial
                        ? COMMERCIAL_CATEGORIES
                        : RESIDENTIAL_CATEGORIES.map((c) => ({ label: c, value: c }))
                      ).map((cat) => (
                        <button
                          key={cat.value}
                          type="button"
                          onClick={() => setCategory(cat.value as PropertyCategory)}
                          className={`py-2.5 px-3 rounded-xl text-xs font-semibold border text-left transition-all cursor-pointer ${
                            category === cat.value
                              ? 'bg-[#E7F6F1] border-[#18A67D] text-[#0E7C5D] font-bold ring-1 ring-[#18A67D]'
                              : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#172033] hover:border-[#CBD5E1]'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Country / State / City */}
                  <LocationSelect
                    value={{ country, state, city }}
                    onChange={(next) => {
                      setCountry(next.country);
                      setState(next.state);
                      if (next.city !== city) setLocality('');
                      setCity(next.city);
                    }}
                  />

                  {/* Locality */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#172033] uppercase">
                      Locality / Neighborhood *
                    </label>
                    <input
                      type="text"
                      value={locality}
                      onChange={(e) => setLocality(e.target.value)}
                      placeholder={`e.g. ${selectedCityData.popularLocalities[0] || 'Whitefield'}`}
                      className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs sm:text-sm font-medium text-[#172033] focus:bg-white focus:border-[#18A67D] outline-none"
                    />
                  </div>

                  {/* Popular suggestions */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] text-[#64748B] font-semibold">
                      Popular Localities in {city}:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedCityData.popularLocalities.map((loc) => (
                        <button
                          key={loc}
                          type="button"
                          onClick={() => setLocality(loc)}
                          className={`text-xs px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                            locality === loc 
                              ? 'bg-[#0F2A43] text-white border-[#0F2A43]' 
                              : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#0F2A43] hover:border-[#18A67D]'
                          }`}
                        >
                          {loc}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Project / Building Name */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#172033] uppercase">
                      Project or Society Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={subLocality}
                      onChange={(e) => setSubLocality(e.target.value)}
                      placeholder="e.g. Prestige Falcon City / Godrej Woods"
                      className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs sm:text-sm font-medium text-[#172033] focus:bg-white focus:border-[#18A67D] outline-none"
                    />
                  </div>

                  {/* Pin exact location on the map (OpenStreetMap, no Google) */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#172033] uppercase">
                      Pin Location on Map (Optional)
                    </label>
                    <p className="text-[11px] text-[#64748B]">
                      Search, tap the map, or drag the pin to set the exact spot. The address fills in automatically.
                    </p>
                    <LocationPicker
                      city={city}
                      value={{ address, coordinates }}
                      onChange={({ address: a, coordinates: c }) => {
                        setAddress(a ?? '');
                        setCoordinates(c);
                      }}
                    />
                  </div>

                </div>
              )}

              {/* ================= STEP 2: SPECS & PRICING ================= */}
              {currentStep === 2 && (
                <div className="space-y-6 animate-in fade-in">

                  {/* BHK & Bathrooms — not applicable to commercial (Size is used instead) */}
                  {!isCommercial && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-[#172033] uppercase">Bedrooms (BHK)</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setBhk(num)}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                              bhk === num
                                ? 'bg-[#18A67D] text-white border-[#18A67D]'
                                : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#172033] hover:border-[#18A67D]'
                            }`}
                          >
                            {num} BHK
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-[#172033] uppercase">Bathrooms</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setBathrooms(num)}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                              bathrooms === num
                                ? 'bg-[#18A67D] text-white border-[#18A67D]'
                                : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#172033] hover:border-[#18A67D]'
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-[#172033] uppercase">Balconies</label>
                      <div className="flex gap-2">
                        {[0, 1, 2, 3].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setBalconies(num)}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                              balconies === num
                                ? 'bg-[#18A67D] text-white border-[#18A67D]'
                                : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#172033] hover:border-[#18A67D]'
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  )}

                  {/* Area Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-[#172033] uppercase">
                        {isCommercial ? `Size (sq.ft) * — min ${MIN_COMMERCIAL_SIZE_SQFT}` : 'Carpet Area (sq.ft) *'}
                      </label>
                      <input
                        type="number"
                        min={isCommercial ? MIN_COMMERCIAL_SIZE_SQFT : undefined}
                        value={carpetAreaSqFt}
                        onChange={(e) => setCarpetAreaSqFt(Number(e.target.value))}
                        className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs sm:text-sm font-bold text-[#172033] focus:bg-white focus:border-[#18A67D] outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-[#172033] uppercase">Super Built-up Area (sq.ft)</label>
                      <input
                        type="number"
                        value={superBuiltUpAreaSqFt}
                        onChange={(e) => setSuperBuiltUpAreaSqFt(Number(e.target.value))}
                        className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs sm:text-sm font-bold text-[#172033] focus:bg-white focus:border-[#18A67D] outline-none"
                      />
                    </div>
                  </div>

                  {/* Price & Maintenance */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-[#172033] uppercase">
                        {isMonthlyPrice ? 'Monthly Rent (₹) *' : 'Total Expected Price (₹) *'}
                      </label>
                      <div className="relative flex items-center">
                        <span className="absolute left-3.5 text-xs font-bold text-[#64748B]">₹</span>
                        <input
                          type="number"
                          value={price}
                          onChange={(e) => setPrice(Number(e.target.value))}
                          className="w-full pl-8 pr-4 py-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-sm font-black text-[#0E7C5D] focus:bg-white focus:border-[#18A67D] outline-none"
                        />
                      </div>
                      <div className="text-[11px] text-[#64748B]">
                        Formatted: <strong>
                          {price >= 10000000 
                            ? `₹${(price / 10000000).toFixed(2)} Crore` 
                            : price >= 100000 
                            ? `₹${(price / 100000).toFixed(1)} Lakh` 
                            : `₹${price.toLocaleString('en-IN')}`}
                        </strong>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-[#172033] uppercase">Monthly Maintenance (₹)</label>
                      <input
                        type="number"
                        value={maintenance}
                        onChange={(e) => setMaintenance(Number(e.target.value))}
                        className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs sm:text-sm font-medium text-[#172033] focus:bg-white focus:border-[#18A67D] outline-none"
                      />
                    </div>
                  </div>

                  {/* Furnishing & Construction Status */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-[#172033] uppercase">Furnishing Status</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['Furnished', 'Semi-Furnished', 'Unfurnished'].map((f) => (
                          <button
                            key={f}
                            type="button"
                            onClick={() => setFurnishing(f as FurnishingStatus)}
                            className={`py-2 px-1 text-center rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                              furnishing === f
                                ? 'bg-[#0F2A43] text-white border-[#0F2A43]'
                                : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#172033] hover:border-[#18A67D]'
                            }`}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-[#172033] uppercase">Construction Status</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['Ready to Move', 'Under Construction', 'New Launch'].map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setConstructionStatus(c as ConstructionStatus)}
                            className={`py-2 px-1 text-center rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                              constructionStatus === c
                                ? 'bg-[#0F2A43] text-white border-[#0F2A43]'
                                : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#172033] hover:border-[#18A67D]'
                            }`}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Floor & Facing */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-[#172033] uppercase">Property Floor</label>
                      <input
                        type="number"
                        value={floor}
                        onChange={(e) => setFloor(Number(e.target.value))}
                        className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs sm:text-sm font-medium outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-[#172033] uppercase">Total Floors in Tower</label>
                      <input
                        type="number"
                        value={totalFloors}
                        onChange={(e) => setTotalFloors(Number(e.target.value))}
                        className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs sm:text-sm font-medium outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-[#172033] uppercase">Facing Direction</label>
                      <select
                        value={facing}
                        onChange={(e) => setFacing(e.target.value as FacingDirection)}
                        className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs sm:text-sm font-medium outline-none"
                      >
                        {['East', 'North', 'North-East', 'West', 'South'].map((fac) => (
                          <option key={fac} value={fac}>{fac} Facing</option>
                        ))}
                      </select>
                    </div>
                  </div>

                </div>
              )}

              {/* ================= STEP 3: PHOTOS & AMENITIES ================= */}
              {currentStep === 3 && (
                <div className="space-y-6 animate-in fade-in">
                  
                  {/* Photo Gallery & Uploads */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-[#172033] uppercase tracking-wider">
                        Property Photos ({images.length} added)
                      </label>
                      <span className="text-[11px] text-[#64748B]">High-res photos receive 3x more buyer views</span>
                    </div>

                    {/* Image thumbnails preview */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {images.map((img, idx) => (
                        <div key={idx} className="relative group rounded-xl overflow-hidden border border-[#E2E8F0] aspect-video bg-[#F1F5F9]">
                          <Image
                            src={img}
                            alt={`Property photo ${idx + 1}`}
                            fill
                            className="object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(idx)}
                            className="absolute top-1.5 right-1.5 p-1 bg-red-600 text-white rounded-lg opacity-90 hover:opacity-100 transition-opacity cursor-pointer z-10"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Upload from device */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/avif,image/gif"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-[#CBD5E1] hover:border-[#18A67D] hover:bg-[#E7F6F1] rounded-xl text-xs sm:text-sm font-bold text-[#0F2A43] transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Uploading…</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span>Upload photos from your device</span>
                        </>
                      )}
                    </button>
                    <span className="block text-[11px] text-[#64748B]">JPG, PNG, WEBP, AVIF or GIF · up to 5 MB each</span>
                    {uploadError && (
                      <p className="text-xs text-red-600 font-medium">{uploadError}</p>
                    )}

                    {/* Custom URL add */}
                    <div className="flex gap-2 pt-1">
                      <input
                        type="url"
                        value={customImageUrl}
                        onChange={(e) => setCustomImageUrl(e.target.value)}
                        placeholder="Or paste image URL (https://...)"
                        className="flex-1 p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs sm:text-sm outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddPhoto}
                        className="px-4 py-2 bg-[#0F2A43] hover:bg-[#163b5c] text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Photo</span>
                      </button>
                    </div>

                    {/* 1-Click Sample Preset Photos */}
                    <div className="space-y-1.5 pt-2">
                      <span className="text-[11px] font-semibold text-[#64748B]">Or add 1-click verified sample photos:</span>
                      <div className="flex flex-wrap gap-2">
                        {SAMPLE_PHOTO_PRESETS.map((preset, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleAddPresetPhoto(preset)}
                            className="text-xs px-2.5 py-1 bg-[#F1F5F9] hover:bg-[#E2E8F0] rounded-lg text-[#0F2A43] font-medium transition-colors cursor-pointer"
                          >
                            + Sample Interior #{i + 1}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <MediaUploadFields value={media} onChange={setMedia} />

                  {/* Amenities Multi-picker */}
                  <div className="space-y-3 pt-2">
                    <label className="block text-xs font-bold text-[#172033] uppercase tracking-wider">
                      Select Key Amenities & Society Features
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {AMENITIES_LIST.map((amenity) => {
                        const isSelected = selectedAmenities.includes(amenity);
                        return (
                          <button
                            key={amenity}
                            type="button"
                            onClick={() => handleToggleAmenity(amenity)}
                            className={`p-2.5 rounded-xl text-left text-xs font-medium border transition-all cursor-pointer flex items-center justify-between ${
                              isSelected
                                ? 'bg-[#E7F6F1] border-[#18A67D] text-[#0E7C5D] font-bold'
                                : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] hover:border-[#CBD5E1]'
                            }`}
                          >
                            <span className="truncate">{amenity}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-[#18A67D] shrink-0 ml-1" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5 pt-2">
                    <label className="block text-xs font-bold text-[#172033] uppercase">
                      Detailed Property Description
                    </label>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Highlight special features, nearby schools, metro connectivity, sunlight, or woodwork..."
                      className="w-full p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs sm:text-sm outline-none"
                    />
                  </div>

                </div>
              )}

              {/* ================= STEP 4: VERIFICATION & SELLER INFO ================= */}
              {currentStep === 4 && (
                <div className="space-y-6 animate-in fade-in">
                  
                  {/* Trust & Verification Credentials */}
                  <div className="p-4 bg-[#F8FAFC] border border-[#18A67D]/30 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2 text-[#0E7C5D] font-bold text-sm">
                      <ShieldCheck className="w-5 h-5 text-[#18A67D]" />
                      <span>Admin Verification & RERA Clearance</span>
                    </div>
                    <p className="text-xs text-[#64748B]">
                      BayBayt verifies property titles, ownership authenticity, and RERA approval before awarding the Green Verification badge.
                    </p>

                    <div className="space-y-2 pt-1">
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-[#172033] uppercase">
                          State RERA ID / Registration Number
                        </label>
                        <input
                          type="text"
                          value={reraId}
                          onChange={(e) => setReraId(e.target.value)}
                          placeholder="e.g. PRM/KA/RERA/1251/310/PR/..."
                          className="w-full p-2.5 bg-white border border-[#CBD5E1] rounded-xl text-xs sm:text-sm font-mono uppercase font-bold outline-none"
                        />
                      </div>

                      <div className="space-y-1.5 pt-2">
                        <span className="text-xs font-bold text-[#172033]">Submitted Documents for Fast Verification:</span>
                        <div className="space-y-1">
                          <label className="flex items-center gap-2 text-xs text-[#172033] cursor-pointer">
                            <input
                              type="checkbox"
                              checked={hasEncumbranceCert}
                              onChange={(e) => setHasEncumbranceCert(e.target.checked)}
                              className="rounded text-[#18A67D] focus:ring-[#18A67D]"
                            />
                            <span>Encumbrance Certificate (EC) / Title Deed copy available</span>
                          </label>
                          <label className="flex items-center gap-2 text-xs text-[#172033] cursor-pointer">
                            <input
                              type="checkbox"
                              checked={hasFloorPlanDoc}
                              onChange={(e) => setHasFloorPlanDoc(e.target.checked)}
                              className="rounded text-[#18A67D] focus:ring-[#18A67D]"
                            />
                            <span>Approved Sanctioned Building / Flat Floor Plan</span>
                          </label>
                          <label className="flex items-center gap-2 text-xs text-[#172033] cursor-pointer">
                            <input
                              type="checkbox"
                              checked={hasTaxReceipt}
                              onChange={(e) => setHasTaxReceipt(e.target.checked)}
                              className="rounded text-[#18A67D] focus:ring-[#18A67D]"
                            />
                            <span>Latest Property Tax Clearance & Electricity Utility bill</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Seller / Lister Info */}
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-[#172033] uppercase tracking-wider">
                      Contact & Ownership Credentials
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pb-1">
                      {['Owner', 'Verified Agent', 'Builder'].map((role) => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => setPostedAs(role as any)}
                          className={`py-2 px-3 rounded-xl text-xs font-bold border text-center transition-colors cursor-pointer ${
                            postedAs === role
                              ? 'bg-[#0F2A43] text-white border-[#0F2A43]'
                              : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#172033]'
                          }`}
                        >
                          I am {role === 'Owner' ? 'Direct Owner' : role}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-[#64748B] uppercase">Full Name *</label>
                        <input
                          type="text"
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          required
                          className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs sm:text-sm font-medium outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-[#64748B] uppercase">Mobile Number *</label>
                        <input
                          type="tel"
                          value={contactPhone}
                          onChange={(e) => setContactPhone(e.target.value)}
                          required
                          className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs sm:text-sm font-medium outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-[#64748B] uppercase">Email Address *</label>
                        <input
                          type="email"
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          required
                          className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs sm:text-sm font-medium outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Summary Check */}
                  <div className="p-3 bg-[#E7F6F1] border border-[#18A67D]/20 rounded-xl flex items-start gap-2.5 text-xs text-[#0E7C5D]">
                    <CheckCircle2 className="w-4 h-4 text-[#18A67D] shrink-0 mt-0.5" />
                    <span>
                      By clicking Submit, your listing will be dispatched to the BayBayt Verification Queue and indexed in the Master Catalog.
                    </span>
                  </div>

                </div>
              )}

              {/* Navigation Actions Footer */}
              <div className="pt-6 mt-6 border-t border-[#E2E8F0] flex items-center justify-between">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentStep((prev) => prev - 1)}
                    className="px-5 py-2.5 rounded-xl border border-[#CBD5E1] text-[#0F2A43] text-xs font-bold hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                  >
                    &larr; Previous Step
                  </button>
                ) : (
                  <Link
                    href="/"
                    className="text-xs font-semibold text-[#64748B] hover:text-[#0F2A43]"
                  >
                    Cancel
                  </Link>
                )}

                {currentStep < 4 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="px-6 py-2.5 bg-[#18A67D] hover:bg-[#0E7C5D] text-white font-bold rounded-xl text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-1.5 shadow-md active:scale-98"
                  >
                    <span>Continue to Step {currentStep + 1}</span>
                    <span>&rarr;</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmitListing}
                    disabled={isSubmitting || outOfQuota}
                    className="px-8 py-3 bg-[#18A67D] hover:bg-[#0E7C5D] text-white font-bold rounded-xl text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2 shadow-lg active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Submit for Verification & Publish</span>
                      </>
                    )}
                  </button>
                )}
              </div>

            </div>

          </div>
        )}

      </main>

      {/* Simple Footer */}
      <footer className="w-full border-t border-[#E2E8F0] bg-white py-4 px-4 text-center text-xs text-[#64748B]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; {new Date().getFullYear()} BayBayt. All rights reserved.</span>
          <div className="flex items-center gap-4 text-xs font-medium">
            <Link href="/" className="hover:text-[#18A67D]">Home</Link>
            <span className="text-slate-300">•</span>
            <Link href="/properties" className="hover:text-[#18A67D]">Browse Catalog</Link>
            <span className="text-slate-300">•</span>
            <Link href="/dashboard" className="hover:text-[#18A67D]">User Dashboard</Link>
            <span className="text-slate-300">•</span>
            <Link href="/admin" className="hover:text-[#18A67D]">Admin Verification</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
