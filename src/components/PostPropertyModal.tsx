'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  X, 
  PlusCircle, 
  Home, 
  MapPin, 
  IndianRupee, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle, 
  Check, 
  Camera, 
  Phone,
  Building,
  Key,
  Layers,
  ArrowRight,
  ArrowLeft,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { Property, ListingType, CommercialListingType, PropertyCategory, FurnishingStatus, FacingDirection, ConstructionStatus } from '@/lib/types';
import { LocationSelect } from '@/components/location/LocationSelect';
import { findStateForCity, DEFAULT_COUNTRY } from '@/lib/locationData';
import { formatIndianCurrency } from '@/lib/formatters';

const COMMERCIAL_CATEGORIES: { label: string; value: PropertyCategory }[] = [
  { label: 'Office', value: 'Commercial Office' },
  { label: 'Shop', value: 'Retail Shop' },
  { label: 'Warehouse', value: 'Warehouse' },
  { label: 'Land', value: 'Commercial Land' },
];
const RESIDENTIAL_CATEGORIES: PropertyCategory[] = ['Apartment', 'Villa', 'Builder Floor', 'Penthouse', 'Residential Plot'];
const MIN_COMMERCIAL_SIZE_SQFT = 80;

interface PostPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPropertyAdded: (newProperty: Property) => void;
}

export function PostPropertyModal({
  isOpen,
  onClose,
  onPropertyAdded,
}: PostPropertyModalProps) {
  const { user, isAuthenticated } = useAuth();
  const [step, setStep] = useState<number>(1);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Form Fields
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
  const [title, setTitle] = useState<string>('');
  const [bhk, setBhk] = useState<number>(2);
  const [bathrooms, setBathrooms] = useState<number>(2);
  const [carpetAreaSqFt, setCarpetAreaSqFt] = useState<number>(1150);
  const [price, setPrice] = useState<number>(8500000);
  const [maintenance, setMaintenance] = useState<number>(3500);
  const [furnishing, setFurnishing] = useState<FurnishingStatus>('Semi-Furnished');
  const [floor, setFloor] = useState<number>(4);
  const [totalFloors, setTotalFloors] = useState<number>(14);
  const [facing, setFacing] = useState<FacingDirection>('East');
  const [constructionStatus, setConstructionStatus] = useState<ConstructionStatus>('Ready to Move');
  const [reraId, setReraId] = useState<string>('PRM/KA/RERA/2026/0019');
  const [description, setDescription] = useState<string>('');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    'Clubhouse (40,000 sq.ft)',
    'Temperature Controlled Infinity Pool',
    'Fully Equipped Gymnasium',
    '24/7 Power Backup',
    'Children Play Area with Splash Pool'
  ]);
  const [ownerName, setOwnerName] = useState<string>(user?.name || 'Amit Sharma');
  const [ownerPhone, setOwnerPhone] = useState<string>(user?.phone || '+91 98765 43210');
  const [photoUrl, setPhotoUrl] = useState<string>(
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'
  );
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadError(null);
    setIsUploading(true);
    try {
      const form = new FormData();
      Array.from(files).forEach((f) => form.append('files', f));
      const res = await fetch('/api/upload', { method: 'POST', body: form, credentials: 'same-origin' });
      const data = await res.json();
      if (res.ok && data.success) {
        setUploadedImages((prev) => [...prev, ...data.urls]);
      } else {
        setUploadError(data.error || 'Upload failed.');
      }
    } catch {
      setUploadError('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const removeUploadedImage = (url: string) => {
    setUploadedImages((prev) => prev.filter((u) => u !== url));
  };

  if (!isOpen) return null;

  const isCommercial = listingType === 'commercial';
  const isMonthlyPrice = listingType === 'rent' || listingType === 'pg' || (isCommercial && commercialListingType === 'rent');

  const handleListingTypeChange = (next: ListingType) => {
    setListingType(next);
    if (next === 'commercial') {
      if (!COMMERCIAL_CATEGORIES.some((c) => c.value === category)) setCategory('Commercial Office');
    } else if (COMMERCIAL_CATEGORIES.some((c) => c.value === category)) {
      setCategory('Apartment');
    }
  };

  const AMENITIES_LIST = [
    'Clubhouse (40,000 sq.ft)',
    'Temperature Controlled Infinity Pool',
    'Fully Equipped Gymnasium',
    'Squash & Badminton Courts',
    '24/7 Power Backup',
    'EV Charging Stations',
    'Multipurpose Hall',
    'Children Play Area with Splash Pool',
    'Jogging & Cycling Track',
    'Private Lift Foyer',
    '100% DG Power Backup',
    'CCTV Survaillance with Smart App access'
  ];

  const handleAmenityToggle = (amenity: string) => {
    if (selectedAmenities.includes(amenity)) {
      setSelectedAmenities(selectedAmenities.filter(a => a !== amenity));
    } else {
      setSelectedAmenities([...selectedAmenities, amenity]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const formattedPrice = isMonthlyPrice
      ? `₹${price.toLocaleString('en-IN')} / mo`
      : formatIndianCurrency(price);

    const commercialCategoryLabel = COMMERCIAL_CATEGORIES.find((c) => c.value === category)?.label ?? 'Commercial';
    const fallbackTitle = isCommercial
      ? `${commercialCategoryLabel} for ${commercialListingType === 'rent' ? 'Rent' : 'Sale'} in ${locality || 'Prime Locality'}, ${city}`
      : `${bhk} BHK ${category} in ${locality || 'Prime Locality'}, ${city}`;

    const newProp: Property = {
      id: `mb-user-${Date.now()}`,
      title: title || fallbackTitle,
      listingType,
      commercialListingType: isCommercial ? commercialListingType : undefined,
      category,
      city,
      state: state || undefined,
      country: country || DEFAULT_COUNTRY,
      locality: locality || 'Central Hub',
      price,
      priceFormatted: formattedPrice,
      pricePerSqFt: Math.round(price / (carpetAreaSqFt || 1000)),
      maintenance,
      bhk: isCommercial ? undefined : bhk,
      bathrooms,
      carpetAreaSqFt,
      superBuiltUpAreaSqFt: Math.round(carpetAreaSqFt * 1.3),
      furnishing,
      floor,
      totalFloors,
      facing,
      constructionStatus,
      possessionDate: 'Immediate',
      reraId,
      reraApproved: !!reraId,
      isVerified: true,
      isFeatured: true,
      isExclusiveOwner: true,
      images: uploadedImages.length > 0
        ? uploadedImages
        : [
            photoUrl || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80'
          ],
      description: description || (isCommercial
        ? `Direct owner commercial listing (${commercialCategoryLabel}) for ${commercialListingType === 'rent' ? 'rent' : 'sale'} in ${locality}, ${city}. Prime location, ${carpetAreaSqFt} sq.ft, 24/7 security and full power backup. Connect directly with the owner.`
        : `Direct owner listing for ${bhk} BHK in ${locality}, ${city}. Prime location, well-ventilated, 24/7 security and full power backup. Connect directly with the owner.`),
      amenities: selectedAmenities,
      postedBy: {
        name: `${ownerName} (Owner)`,
        type: 'Owner',
        phone: ownerPhone,
        responseTime: 'Direct Owner',
        rating: 5.0
      },
      createdAt: new Date().toISOString().split('T')[0]
    };

    onPropertyAdded(newProp);
    setIsSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden my-auto border border-neutral-200">
        
        {/* Header */}
        <div className="bg-[#0F2A43] text-white px-6 py-4 flex items-center justify-between border-b border-[#163b5c]">
          <div className="flex items-center gap-2">
            <div className="bg-[#18A67D] text-white text-xs font-black px-2 py-0.5 rounded-xs">
              BayBayt
            </div>
            <h2 className="text-sm font-bold">Post Property for Sale or Rent - 100% FREE</h2>
          </div>
          <button
            id="post-property-close-btn"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Bar */}
        {isAuthenticated && (
          <div className="bg-[#F8FAFC] px-6 py-3 border-b border-[#E2E8F0] flex items-center justify-between text-xs font-bold text-[#64748B]">
            <div className={`flex items-center gap-1.5 ${step >= 1 ? 'text-[#18A67D]' : ''}`}>
              <span className="w-5 h-5 rounded-full bg-current text-white flex items-center justify-center text-[10px]">1</span>
              <span>Type & City</span>
            </div>
            <div className="w-12 h-0.5 bg-[#CBD5E1]" />
            <div className={`flex items-center gap-1.5 ${step >= 2 ? 'text-[#18A67D]' : ''}`}>
              <span className="w-5 h-5 rounded-full bg-current text-white flex items-center justify-center text-[10px]">2</span>
              <span>Area & Price</span>
            </div>
            <div className="w-12 h-0.5 bg-[#CBD5E1]" />
            <div className={`flex items-center gap-1.5 ${step >= 3 ? 'text-[#18A67D]' : ''}`}>
              <span className="w-5 h-5 rounded-full bg-current text-white flex items-center justify-center text-[10px]">3</span>
              <span>Photos & Publish</span>
            </div>
          </div>
        )}

        {!isAuthenticated ? (
          <div className="p-8 text-center space-y-5 animate-fade-in">
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto border-2 border-amber-200">
              <ShieldCheck className="w-7 h-7 text-[#18A67D]" />
            </div>
            <div className="space-y-1.5">
              <span className="bg-[#E7F6F1] text-[#0E7C5D] text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Authentication Required
              </span>
              <h3 className="text-xl font-black text-[#0F2A43]">Sign In to Post Property</h3>
              <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                Please log in to your account to upload and manage property listings with direct buyer inquiries.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
              <Link
                href="/auth?mode=signin"
                onClick={onClose}
                className="py-2.5 px-3 bg-[#0F2A43] hover:bg-[#163b5c] text-white font-bold text-xs rounded-xl text-center"
              >
                Sign In
              </Link>
              <Link
                href="/auth?mode=signup"
                onClick={onClose}
                className="py-2.5 px-3 bg-[#18A67D] hover:bg-[#0E7C5D] text-white font-bold text-xs rounded-xl text-center"
              >
                Register Free
              </Link>
            </div>
          </div>
        ) : isSubmitted ? (
          <div className="p-8 text-center space-y-4 animate-fade-in">
            <div className="w-16 h-16 bg-[#E7F6F1] text-[#0E7C5D] rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-[#0F2A43]">Property Published Successfully!</h3>
            <p className="text-sm text-[#64748B] max-w-md mx-auto">
              Your property has been listed on BayBayt with verified status. You will start receiving direct buyer enquiries.
            </p>
            <button
              onClick={onClose}
              className="bg-[#18A67D] hover:bg-[#0E7C5D] text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-all shadow-md cursor-pointer"
            >
              View My Live Listing
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            
            {/* STEP 1 */}
            {step === 1 && (
              <div className="space-y-4 animate-fade-in">
                
                {/* Intent: Sell or Rent */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                    I want to:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'buy', label: 'Sell Property' },
                      { id: 'rent', label: 'Rent Out' },
                      { id: 'pg', label: 'PG / Co-Living' },
                      { id: 'commercial', label: 'Commercial' }
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleListingTypeChange(item.id as ListingType)}
                        className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          listingType === item.id
                            ? 'border-[#18A67D] bg-[#E7F6F1] text-[#0E7C5D] shadow-xs'
                            : 'border-[#E2E8F0] bg-white text-[#172033] hover:bg-[#F8FAFC]'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Commercial Deal Type: Rent or Sale */}
                {isCommercial && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                      Commercial Deal Type:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'sale', label: 'For Sale' },
                        { id: 'rent', label: 'For Rent' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setCommercialListingType(item.id as CommercialListingType)}
                          className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            commercialListingType === item.id
                              ? 'border-[#18A67D] bg-[#E7F6F1] text-[#0E7C5D] shadow-xs'
                              : 'border-[#E2E8F0] bg-white text-[#172033] hover:bg-[#F8FAFC]'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Category */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                    {isCommercial ? 'Commercial Type:' : 'Property Category:'}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {(isCommercial
                      ? COMMERCIAL_CATEGORIES
                      : RESIDENTIAL_CATEGORIES.map((c) => ({ label: c, value: c }))
                    ).map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setCategory(cat.value)}
                        className={`p-2.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                          category === cat.value
                            ? 'border-[#0F2A43] bg-[#0F2A43] text-white'
                            : 'border-[#E2E8F0] bg-white text-[#172033] hover:bg-[#F8FAFC]'
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
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#172033]">Locality / Neighborhood</label>
                  <input
                    type="text"
                    required
                    value={locality}
                    onChange={(e) => setLocality(e.target.value)}
                    placeholder="e.g. Indiranagar, Bandra West, Whitefield"
                    className="w-full text-xs font-semibold bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg p-2.5 outline-none focus:border-[#18A67D] text-[#172033]"
                  />
                </div>

                {/* Title */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#172033]">Project / Listing Headline</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. 3 BHK Luxury Gated Highrise Apartment with Sea View"
                    className="w-full text-xs font-semibold bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg p-2.5 outline-none focus:border-[#18A67D] text-[#172033]"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="bg-[#18A67D] hover:bg-[#0E7C5D] text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <span>Next: Area & Pricing</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <div className="space-y-4 animate-fade-in">
                
                {/* Configuration: BHK & Bathrooms */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {!isCommercial && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#172033]">BHK</label>
                      <select
                        value={bhk}
                        onChange={(e) => setBhk(Number(e.target.value))}
                        className="w-full text-xs font-semibold bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg p-2.5 outline-none focus:border-[#18A67D] text-[#172033]"
                      >
                        <option value={1}>1 BHK</option>
                        <option value={2}>2 BHK</option>
                        <option value={3}>3 BHK</option>
                        <option value={4}>4 BHK</option>
                        <option value={5}>5+ BHK</option>
                      </select>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#172033]">{isCommercial ? 'Washrooms' : 'Bathrooms'}</label>
                    <select
                      value={bathrooms}
                      onChange={(e) => setBathrooms(Number(e.target.value))}
                      className="w-full text-xs font-semibold bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg p-2.5 outline-none focus:border-[#18A67D] text-[#172033]"
                    >
                      <option value={1}>1</option>
                      <option value={2}>2</option>
                      <option value={3}>3</option>
                      <option value={4}>4</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#172033]">
                      {isCommercial ? `Size (sq.ft) · min ${MIN_COMMERCIAL_SIZE_SQFT}` : 'Carpet Area (sq.ft)'}
                    </label>
                    <input
                      type="number"
                      required
                      min={isCommercial ? MIN_COMMERCIAL_SIZE_SQFT : undefined}
                      value={carpetAreaSqFt}
                      onChange={(e) => setCarpetAreaSqFt(Number(e.target.value))}
                      className="w-full text-xs font-semibold bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg p-2.5 outline-none focus:border-[#18A67D] text-[#172033]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#172033]">Furnishing</label>
                    <select
                      value={furnishing}
                      onChange={(e) => setFurnishing(e.target.value as FurnishingStatus)}
                      className="w-full text-xs font-semibold bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg p-2.5 outline-none focus:border-[#18A67D] text-[#172033]"
                    >
                      <option value="Furnished">Furnished</option>
                      <option value="Semi-Furnished">Semi-Furnished</option>
                      <option value="Unfurnished">Unfurnished</option>
                    </select>
                  </div>
                </div>

                {/* Price & Maintenance */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#172033]">
                      {isMonthlyPrice ? 'Expected Monthly Rent (₹)' : 'Expected Total Price (₹)'}
                    </label>
                    <input
                      type="number"
                      required
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="w-full text-xs font-semibold bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg p-2.5 outline-none focus:border-[#18A67D] text-[#172033]"
                    />
                    <span className="text-[11px] font-bold text-[#64748B]">
                      Formatted: {formatIndianCurrency(price)}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#172033]">Monthly Maintenance (₹)</label>
                    <input
                      type="number"
                      value={maintenance}
                      onChange={(e) => setMaintenance(Number(e.target.value))}
                      className="w-full text-xs font-semibold bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg p-2.5 outline-none focus:border-[#18A67D] text-[#172033]"
                    />
                  </div>
                </div>

                {/* Floor & Facing */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#172033]">Floor</label>
                    <input
                      type="number"
                      value={floor}
                      onChange={(e) => setFloor(Number(e.target.value))}
                      className="w-full text-xs font-semibold bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg p-2.5 outline-none focus:border-[#18A67D] text-[#172033]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#172033]">Total Floors</label>
                    <input
                      type="number"
                      value={totalFloors}
                      onChange={(e) => setTotalFloors(Number(e.target.value))}
                      className="w-full text-xs font-semibold bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg p-2.5 outline-none focus:border-[#18A67D] text-[#172033]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#172033]">Facing</label>
                    <select
                      value={facing}
                      onChange={(e) => setFacing(e.target.value as FacingDirection)}
                      className="w-full text-xs font-semibold bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg p-2.5 outline-none focus:border-[#18A67D] text-[#172033]"
                    >
                      <option value="East">East</option>
                      <option value="North">North</option>
                      <option value="North-East">North-East</option>
                      <option value="West">West</option>
                      <option value="South">South</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="bg-[#F8FAFC] text-[#172033] border border-[#E2E8F0] font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-[#E2E8F0] transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="bg-[#18A67D] hover:bg-[#0E7C5D] text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <span>Next: Amenities & Photos</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <div className="space-y-4 animate-fade-in">
                
                {/* Amenities Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                    Select Amenities:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-1">
                    {AMENITIES_LIST.map((am) => {
                      const isSel = selectedAmenities.includes(am);
                      return (
                        <div
                          key={am}
                          onClick={() => handleAmenityToggle(am)}
                          className={`p-2 rounded-lg border text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5 ${
                            isSel
                              ? 'bg-[#E7F6F1] border-[#18A67D] text-[#0E7C5D] font-bold'
                              : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#172033]'
                          }`}
                        >
                          <div className={`w-3.5 h-3.5 rounded-xs border flex items-center justify-center ${isSel ? 'bg-[#18A67D] border-[#18A67D] text-white' : 'border-[#CBD5E1]'}`}>
                            {isSel && <Check className="w-3 h-3" />}
                          </div>
                          <span className="truncate">{am}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Upload Property Photos */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#172033]">Upload Property Photos</label>
                  <label
                    htmlFor="property-photo-upload"
                    className="flex flex-col items-center justify-center gap-1 w-full border-2 border-dashed border-[#CBD5E1] rounded-lg p-4 cursor-pointer hover:border-[#18A67D] hover:bg-[#F8FAFC] transition-colors"
                  >
                    <span className="text-xs font-bold text-[#0F2A43]">
                      {isUploading ? 'Uploading…' : 'Click to upload images'}
                    </span>
                    <span className="text-[11px] text-[#64748B]">JPG, PNG or WEBP · up to 5MB each</span>
                    <input
                      id="property-photo-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileUpload}
                      disabled={isUploading}
                      className="hidden"
                    />
                  </label>
                  {uploadError && <p className="text-[11px] font-semibold text-red-600">{uploadError}</p>}
                  {uploadedImages.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {uploadedImages.map((url) => (
                        <div key={url} className="relative w-16 h-16 rounded-lg overflow-hidden border border-[#E2E8F0]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt="Uploaded" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeUploadedImage(url)}
                            className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] leading-none"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Photo URL (optional fallback if no files uploaded) */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#172033]">Or paste a Photo URL (optional)</label>
                  <input
                    type="text"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full text-xs font-semibold bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg p-2.5 outline-none focus:border-[#18A67D] text-[#172033]"
                  />
                </div>

                {/* Owner Contact */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#172033]">Your Full Name (Owner)</label>
                    <input
                      type="text"
                      required
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      className="w-full text-xs font-semibold bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg p-2.5 outline-none focus:border-[#18A67D] text-[#172033]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#172033]">Mobile Number (+91)</label>
                    <input
                      type="tel"
                      required
                      value={ownerPhone}
                      onChange={(e) => setOwnerPhone(e.target.value)}
                      className="w-full text-xs font-semibold bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg p-2.5 outline-none focus:border-[#18A67D] text-[#172033]"
                    />
                  </div>
                </div>

                {/* RERA and Description */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#172033]">Property Description</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe unique features, view, sunlight, nearby schools, road connectivity..."
                    className="w-full text-xs font-medium bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg p-2.5 outline-none focus:border-[#18A67D] text-[#172033]"
                  />
                </div>

                <div className="flex justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="bg-[#F8FAFC] text-[#172033] border border-[#E2E8F0] font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-[#E2E8F0] transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                  <button
                    type="submit"
                    className="bg-[#18A67D] hover:bg-[#0E7C5D] text-white font-bold text-sm px-8 py-3 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Publish Listing 100% FREE</span>
                  </button>
                </div>
              </div>
            )}

          </form>
        )}

      </div>
    </div>
  );
}
