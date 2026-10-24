'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, 
} from 'lucide-react';
import { Property, SearchFilters, CityInfo, ListingType } from '@/lib/types';
import { resolveCityInfo } from '@/lib/realEstateData';
import { useProperties } from '@/lib/propertyContext';
import { useAuth } from '@/lib/authContext';
import { useGenie } from '@/lib/genieContext';
import { Navbar } from '@/components/Navbar';
import { HeroSearch } from '@/components/HeroSearch';
import { PropertyDetailModal } from '@/components/PropertyDetailModal';
import { PostPropertyModal } from '@/components/PostPropertyModal';
import { AiValuationModal } from '@/components/AiValuationModal';
import { ShortlistDrawer } from '@/components/ShortlistDrawer';
import { CitySelectorModal } from '@/components/CitySelectorModal';
import { AuthModal } from '@/components/AuthModal';
import { LocalityTrendsSection } from '@/components/LocalityTrendsSection';
import { ExploreCategoriesSection } from '@/components/ExploreCategoriesSection';
import { CuratedCollectionsSection } from '@/components/CuratedCollectionsSection';
import { TopBuildersSection } from '@/components/TopBuildersSection';
import { FeaturedProjectsSection } from '@/components/home/FeaturedProjectsSection';
import { PreferredAgentsSection } from '@/components/home/PreferredAgentsSection';
import { TopProjectsSection } from '@/components/home/TopProjectsSection';
import { ExplorePopularLocalitiesSection } from '@/components/home/ExplorePopularLocalitiesSection';
import { ExclusiveOwnerPropertiesSection } from '@/components/home/ExclusiveOwnerPropertiesSection';
import { FreshPropertiesSection } from '@/components/home/FreshPropertiesSection';
import { Footer } from '@/components/Footer';

const CITY_STORAGE_KEY = 'baybayt_selected_city';
// Server-readable mirror of the user's city. The server component resolves the
// initial city from this cookie (then Vercel geo headers) and passes it in as
// `initialCityName`, so SSR and the client's first paint agree — no post-mount
// city swap, hence no layout shift (CLS) on first load.
const CITY_COOKIE = 'bb_city';

export default function HomeClient({ initialCityName }: { initialCityName?: string }) {
  const router = useRouter();
  const { properties, addProperty, shortlistIds, toggleShortlist } = useProperties();
  const { user } = useAuth();
  const { openGenie } = useGenie();

  // Active City. The initial value is driven solely by `initialCityName` (from
  // the server) so the first client render matches the server HTML exactly.
  // A returning user's localStorage preference is reconciled in an effect below
  // — never in the initializer, which would cause a hydration mismatch.
  const [selectedCity, setSelectedCity] = useState<CityInfo>(() =>
    resolveCityInfo(initialCityName || 'Bangalore')
  );

  // Active Search & Filter State
  const [filters, setFilters] = useState<SearchFilters>(() => {
    return {
      listingType: 'buy',
      city: initialCityName || 'Bangalore',
      locality: '',
      category: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      bhk: [],
      furnishing: undefined,
      constructionStatus: undefined,
      isVerifiedOnly: false,
      isOwnerOnly: false,
      isReraApprovedOnly: false,
      sortBy: 'recommended'
    };
  });

  // Navbar's active-menu highlight is independent of the Hero search tabs.
  // Selecting a Hero tab only drives the search (filters.listingType); it must
  // NOT light up the navbar menu. Navbar clicks navigate away, so this is just
  // the transient highlight for the navbar's own buttons.
  const [navListingType, setNavListingType] = useState<ListingType>('buy');

  // Modal & Drawer visibility
  const [isCitySelectorOpen, setIsCitySelectorOpen] = useState(false);
  const [isPostPropertyOpen, setIsPostPropertyOpen] = useState(false);
  const [isAiValuationOpen, setIsAiValuationOpen] = useState(false);
  const [isShortlistDrawerOpen, setIsShortlistDrawerOpen] = useState(false);
  const [selectedPropertyForModal, setSelectedPropertyForModal] = useState<Property | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');

  // "Post Property" entry points: signed-in users go straight to the dashboard
  // upload form; guests get the sign-in gatekeeper popup (which prompts auth).
  const handleOpenPostProperty = () => {
    if (user) router.push('/dashboard?tab=upload');
    else setIsPostPropertyOpen(true);
  };

  // Sync city selection to filter (and remember the user's explicit choice)
  const handleSelectCity = (city: CityInfo) => {
    setSelectedCity(city);
    setFilters((prev) => ({
      ...prev,
      city: city.name,
      locality: '' // reset locality on city change
    }));
    if (typeof window !== 'undefined') {
      localStorage.setItem(CITY_STORAGE_KEY, city.name);
      // Mirror into a cookie the server can read, so the next SSR renders this
      // city directly (keeps server/client in sync, avoids a first-paint swap).
      document.cookie = `${CITY_COOKIE}=${encodeURIComponent(city.name)}; path=/; max-age=31536000; samesite=lax`;
    }
  };

  // Reconcile a returning user's saved city after mount. The server resolves the
  // initial city from the `bb_city` cookie (then geo headers); for users whose
  // preference predates that cookie we still have it in localStorage, so adopt
  // it here and backfill the cookie so future loads are server-correct (no swap,
  // no CLS). First-time visitors have no saved city → this is a no-op, so the
  // common/Lighthouse path never shifts.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedName = localStorage.getItem(CITY_STORAGE_KEY);
    if (!savedName || savedName === selectedCity.name) return;
    const city = resolveCityInfo(savedName);
    setSelectedCity(city);
    setFilters((prev) => ({ ...prev, city: city.name, locality: '' }));
    document.cookie = `${CITY_COOKIE}=${encodeURIComponent(savedName)}; path=/; max-age=31536000; samesite=lax`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggleShortlist = (propertyId: string) => {
    toggleShortlist(propertyId);
  };

  const handlePropertyAdded = (newProperty: Property) => {
    addProperty(newProperty);
    router.push(`/properties?city=${encodeURIComponent(newProperty.city)}&listingType=${newProperty.listingType}`);
  };

  // Serialize the active filters into URL params. Shared by the catalog search
  // (/properties) and the "Explore on map" action (/properties/map) so both
  // pages read exactly the same filter scheme.
  const buildSearchParams = (current: SearchFilters): URLSearchParams => {
    const params = new URLSearchParams();

    if (selectedCity?.name && selectedCity.name !== 'All Cities') {
      params.set('city', selectedCity.name);
    }
    if (current.listingType) {
      params.set('listingType', current.listingType);
    }
    if (current.locality && current.locality.trim() !== '') {
      params.set('locality', current.locality.trim());
    }
    if (current.category) {
      params.set('category', current.category);
    } else if (current.categories && current.categories.length === 1) {
      params.set('category', current.categories[0]);
    }
    if (current.bhk && current.bhk.length > 0) {
      params.set('bhk', current.bhk.join(','));
    }
    if (current.listingType === 'commercial') {
      if (current.commercialListingType) {
        params.set('commercialType', current.commercialListingType);
      }
      if (current.minSizeSqFt !== undefined && current.minSizeSqFt > 80) {
        params.set('minSize', current.minSizeSqFt.toString());
      }
      if (current.maxSizeSqFt !== undefined && current.maxSizeSqFt > 0) {
        params.set('maxSize', current.maxSizeSqFt.toString());
      }
    }
    if (current.minPrice !== undefined && current.minPrice > 0) {
      params.set('minPrice', current.minPrice.toString());
    }
    if (current.maxPrice !== undefined && current.maxPrice < 200000000) {
      params.set('maxPrice', current.maxPrice.toString());
    }
    if (current.isOwnerOnly) {
      params.set('owner', 'true');
    }
    if (current.isVerifiedOnly) {
      params.set('verified', 'true');
    }
    if (current.isReraApprovedOnly) {
      params.set('rera', 'true');
    }
    if (current.constructionStatus) {
      const statusStr = Array.isArray(current.constructionStatus)
        ? current.constructionStatus.join(',')
        : current.constructionStatus;
      params.set('constructionStatus', statusStr);
    }

    return params;
  };

  // Execute Search & Route to Dedicated Filter Page
  const handleExecuteSearch = (overrideFilters?: Partial<SearchFilters>) => {
    const current = { ...filters, ...overrideFilters };
    router.push(`/properties?${buildSearchParams(current).toString()}`);
  };

  // Explore on map — carry the current filters into the interactive discovery
  // map. When a locality/area with real coordinates was picked, deep-link
  // straight into radius ("area distance") mode centered on it.
  const handleExploreMap = (geo?: { lat: number; lng: number; radius?: number }) => {
    const params = buildSearchParams(filters);
    if (geo) {
      params.set('lat', geo.lat.toFixed(6));
      params.set('lng', geo.lng.toFixed(6));
      params.set('radius', String(geo.radius ?? 3000));
    }
    router.push(`/properties/map?${params.toString()}`);
  };

  const shortlistedProperties = useMemo(() => {
    return properties.filter((p) => shortlistIds.includes(p.id));
  }, [properties, shortlistIds]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col selection:bg-[#18A67D] selection:text-white font-sans text-[#172033]">

      {/* Warm up the connection to Google Maps — the hero mini-map pulls tiles
          from here, so preconnecting shaves ~80ms off their first request. */}
      <link rel="preconnect" href="https://maps.googleapis.com" />

      {/* 1. TOP NAVBAR */}
      <Navbar
        selectedCity={selectedCity}
        onOpenCitySelector={() => setIsCitySelectorOpen(true)}
        onSelectListingType={(type) => {
          setNavListingType(type);
          router.push(`/properties?city=${encodeURIComponent(selectedCity.name)}&listingType=${type}`);
        }}
        currentListingType={navListingType}
        shortlistCount={shortlistIds.length}
        onOpenShortlist={() => setIsShortlistDrawerOpen(true)}
        onOpenPostProperty={handleOpenPostProperty}
        onOpenAiValuation={() => setIsAiValuationOpen(true)}
        onOpenAiGenie={() => openGenie(null)}
        onOpenAuthModal={(mode) => {
          setAuthModalMode(mode || 'signin');
          setIsAuthModalOpen(true);
        }}
      />

      {/* Primary page content landmark (one <main> per document for a11y). */}
      <main className="flex-1">

      {/* 2. HERO SEARCH MODULE */}
      <HeroSearch
        selectedCity={selectedCity}
        currentListingType={filters.listingType}
        onListingTypeChange={(type) => setFilters((prev) => ({ ...prev, listingType: type }))}
        filters={filters}
        onFilterChange={(newFilters) => setFilters((prev) => ({ ...prev, ...newFilters }))}
        onExecuteSearch={() => handleExecuteSearch()}
        onExploreMap={handleExploreMap}
        onOpenPostProperty={handleOpenPostProperty}
      />

      {/* 3. EXPLORE POPULAR LOCALITIES IN [CITY] (Reference Screenshot 5 Top) */}
      <ExplorePopularLocalitiesSection
        cityName={selectedCity.name}
        popularLocalities={selectedCity.popularLocalities}
        onSelectLocality={(localityName) => {
          router.push(`/properties?city=${encodeURIComponent(selectedCity.name)}&locality=${encodeURIComponent(localityName)}`);
        }}
      />

      {/* 4. FEATURED PROJECTS (Reference Screenshot 1) */}
      <FeaturedProjectsSection
        cityName={selectedCity.name}
        onSelectProject={(project) => {
          router.push(`/projects/${project.id}`);
        }}
      />

      {/* 6. BAYBAYT PREFERRED AGENTS IN [CITY] (Reference Screenshot 3) */}
      {/* <PreferredAgentsSection
        cityName={selectedCity.name}
        onContactAgent={(agent) => {
          router.push(`/agents/${agent.id}`);
        }}
      /> */}

      {/* 7. TOP PROJECTS [baybaytHomes] (Reference Screenshot 4) */}
      <TopProjectsSection
        cityName={selectedCity.name}
        onSelectProject={(project) => {
          router.push(`/projects/${project.id}`);
        }}
      />

      {/* 8. EXCLUSIVE OWNER PROPERTIES (Reference Screenshot 5 Bottom) */}
      <ExclusiveOwnerPropertiesSection
        cityName={selectedCity.name}
        properties={properties}
        onSelectProperty={(property) => {
          router.push(`/properties/${property.id}`);
        }}
      />

      {/* 9. FRESH PROPERTIES IN [CITY] (Reference Screenshot 6) */}
      <FreshPropertiesSection
        cityName={selectedCity.name}
        properties={properties}
        onSelectProperty={(property) => {
          router.push(`/properties/${property.id}`);
        }}
      />

      {/* 10. EXPLORE REAL ESTATE CATEGORIES (Visual Explorer) */}
      <ExploreCategoriesSection
        cityName={selectedCity.name}
        properties={properties}
      />

      {/* 11. CURATED PROPERTY COLLECTIONS (Handpicked Portfolios) */}
      <CuratedCollectionsSection
        cityName={selectedCity.name}
        onApplyPreset={(presetFilters) => {
          handleExecuteSearch(presetFilters);
        }}
      />

      {/* 12. TOP REPUTED BUILDERS & DEVELOPER SPOTLIGHT */}
      {/* <TopBuildersSection
        cityName={selectedCity.name}
      /> */}

      {/* 13. LOCALITY TRENDS & PRICE INTELLIGENCE */}
      <LocalityTrendsSection
        selectedCity={selectedCity}
        onSelectLocality={(loc) => {
          router.push(`/properties?city=${encodeURIComponent(selectedCity.name)}&locality=${encodeURIComponent(loc)}`);
        }}
        onOpenAiValuation={() => setIsAiValuationOpen(true)}
      />

      </main>

      {/* 7. FOOTER */}
      <Footer
        onSelectCity={handleSelectCity}
        onOpenAiValuation={() => setIsAiValuationOpen(true)}
        onOpenPostProperty={handleOpenPostProperty}
      />

      {/* 8. FLOATING AI GENIE CHAT BUTTON */}
      <button
        id="floating-genie-btn"
        onClick={() => openGenie(null)}
        aria-label="Open BayBayt Genie AI assistant"
        className="fixed bottom-6 right-6 z-40 bg-[#0F2A43] hover:bg-[#163b5c] text-white p-3 sm:px-4 sm:py-3 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2.5 border border-[#163b5c] cursor-pointer group"
      >
        <div className="w-7 h-7 rounded-md bg-[#18A67D] flex items-center justify-center text-white shadow-sm transform rotate-45">
          <Sparkles className="w-3.5 h-3.5 transform -rotate-45" />
        </div>
        <div className="hidden sm:block text-left">
          <div className="text-xs font-bold flex items-center gap-1">
            <span>BayBayt Genie AI</span>
            <span className="bg-[#18A67D] text-white text-[9px] font-bold px-1 rounded uppercase">Live</span>
          </div>
          <div className="text-[10px] text-slate-300">
            Real Estate & Price Advisor
          </div>
        </div>
      </button>

      {/* MODALS & DRAWERS */}
      {/* 1. Property Detail Modal */}
      {selectedPropertyForModal && (
        <PropertyDetailModal
          property={selectedPropertyForModal}
          isOpen={!!selectedPropertyForModal}
          onClose={() => setSelectedPropertyForModal(null)}
          isShortlisted={shortlistIds.includes(selectedPropertyForModal.id)}
          onToggleShortlist={handleToggleShortlist}
          onOpenAiGenieWithContext={(p) => openGenie(p)}
        />
      )}

      {/* 2. Post Property Modal */}
      <PostPropertyModal
        isOpen={isPostPropertyOpen}
        onClose={() => setIsPostPropertyOpen(false)}
        onPropertyAdded={handlePropertyAdded}
      />

      {/* 3. AI Valuation Modal */}
      <AiValuationModal
        isOpen={isAiValuationOpen}
        onClose={() => setIsAiValuationOpen(false)}
        defaultCity={selectedCity.name}
      />

      {/* 5. BayBayt Genie Chat Drawer is now mounted globally via GenieProvider. */}

      {/* 6. Shortlist Drawer */}
      <ShortlistDrawer
        isOpen={isShortlistDrawerOpen}
        onClose={() => setIsShortlistDrawerOpen(false)}
        shortlistedProperties={shortlistedProperties}
        onRemoveFromShortlist={handleToggleShortlist}
        onViewPropertyDetails={(p) => setSelectedPropertyForModal(p)}
        onContactAgent={(p) => setSelectedPropertyForModal(p)}
      />

      {/* 7. City Selector Modal */}
      <CitySelectorModal
        isOpen={isCitySelectorOpen}
        onClose={() => setIsCitySelectorOpen(false)}
        selectedCity={selectedCity}
        onSelectCity={handleSelectCity}
      />

      {/* 8. Authentication & Registration Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => {
          setIsAuthModalOpen(false);
          router.push('/dashboard');
        }}
        initialMode={authModalMode}
      />

    </div>
  );
}
