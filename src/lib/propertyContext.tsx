'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Property, PropertyInquiry, VerificationStatus } from '@/lib/types';
import { useAuth } from '@/lib/authContext';
import { isAdminRole } from '@/lib/roles';

interface PropertyContextType {
  properties: Property[];
  inquiries: PropertyInquiry[];
  shortlistIds: string[];
  isLoading: boolean;
  toggleShortlist: (id: string) => void;
  isShortlisted: (id: string) => boolean;
  getPropertyById: (id: string) => Property | undefined;
  addProperty: (property: Partial<Property>) => Property;
  updateProperty: (id: string, updates: Partial<Property>) => void;
  updateVerificationStatus: (id: string, status: VerificationStatus, reason?: string) => void;
  deleteProperty: (id: string) => void;
  addInquiry: (inquiryData: {
    propertyId: string;
    propertyTitle: string;
    buyerName: string;
    buyerPhone: string;
    buyerEmail: string;
    message: string;
    preferredTime?: string;
    sellerUserId?: string;
    buyerUserId?: string;
  }) => PropertyInquiry;
  updateInquiryStatus: (id: string, status: PropertyInquiry['status']) => void;
  resetToDefaultData: () => void;
}

const PropertyContext = createContext<PropertyContextType | undefined>(undefined);

const SHORTLIST_STORAGE_KEY = 'baybayt_shortlists_store_v2';

async function api(path: string, options?: RequestInit) {
  const res = await fetch(path, {
    headers: options?.body ? { 'Content-Type': 'application/json' } : undefined,
    credentials: 'same-origin',
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

export function PropertyProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [inquiries, setInquiries] = useState<PropertyInquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [shortlistIds, setShortlistIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(SHORTLIST_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Load properties (admins get everything; others get approved + their own).
  const loadProperties = useCallback(async () => {
    const scope = isAdminRole(user?.role) ? 'all' : 'public';
    const { ok, data } = await api(`/api/properties?scope=${scope}`);
    if (ok && data?.properties) setProperties(data.properties);
  }, [user?.role]);

  const loadInquiries = useCallback(async () => {
    if (!user) { setInquiries([]); return; }
    const { ok, data } = await api('/api/inquiries');
    if (ok && data?.inquiries) setInquiries(data.inquiries);
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let active = true;
    (async () => {
      setIsLoading(true);
      await loadProperties();
      if (active) setIsLoading(false);
    })();
    return () => { active = false; };
  }, [loadProperties]);

  useEffect(() => {
    let active = true;
    if (!user) {
      queueMicrotask(() => {
        if (active) setInquiries([]);
      });
      return () => { active = false; };
    }
    api('/api/inquiries').then(({ ok, data }) => {
      if (!active) return;
      if (ok && data?.inquiries) setInquiries(data.inquiries);
    });
    return () => { active = false; };
  }, [user]);

  // --- Shortlist ---
  // Guests keep their shortlist in localStorage; signed-in users persist to the
  // DB (/api/shortlist) so it follows them across devices. On login we merge the
  // guest's local set into the server, then clear local and trust the server.
  const writeLocal = (next: string[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(SHORTLIST_STORAGE_KEY, JSON.stringify(next));
    }
  };
  const clearLocal = () => {
    if (typeof window !== 'undefined') localStorage.removeItem(SHORTLIST_STORAGE_KEY);
  };

  useEffect(() => {
    let active = true;
    if (!user) {
      // Logged out: drop any server-loaded list, fall back to the guest's local set.
      let local: string[] = [];
      if (typeof window !== 'undefined') {
        try {
          local = JSON.parse(localStorage.getItem(SHORTLIST_STORAGE_KEY) || '[]');
        } catch {
          local = [];
        }
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShortlistIds(local);
      return () => { active = false; };
    }
    (async () => {
      // Merge any guest shortlist accumulated before login, else just load.
      let local: string[] = [];
      if (typeof window !== 'undefined') {
        try {
          local = JSON.parse(localStorage.getItem(SHORTLIST_STORAGE_KEY) || '[]');
        } catch {
          local = [];
        }
      }
      const req = local.length
        ? api('/api/shortlist', { method: 'POST', body: JSON.stringify({ propertyIds: local }) })
        : api('/api/shortlist');
      const { ok, data } = await req;
      if (!active) return;
      if (ok && Array.isArray(data?.propertyIds)) {
        setShortlistIds(data.propertyIds);
        if (local.length) clearLocal();
      }
    })();
    return () => { active = false; };
  }, [user]);

  const toggleShortlist = (id: string) => {
    const has = shortlistIds.includes(id);
    const next = has ? shortlistIds.filter((x) => x !== id) : [...shortlistIds, id];
    setShortlistIds(next); // optimistic for both guests and signed-in users
    if (user) {
      if (has) api(`/api/shortlist?propertyId=${encodeURIComponent(id)}`, { method: 'DELETE' });
      else api('/api/shortlist', { method: 'POST', body: JSON.stringify({ propertyId: id }) });
    } else {
      writeLocal(next);
    }
  };
  const isShortlisted = (id: string) => shortlistIds.includes(id);

  const getPropertyById = (id: string) => properties.find((p) => p.id === id);

  // --- Mutations (optimistic UI + API persistence) ---
  const addProperty = (newProp: Partial<Property>): Property => {
    const tempId = `temp-${Date.now()}`;
    const optimistic: Property = { ...(newProp as Property), id: newProp.id || tempId, verificationStatus: 'pending', isVerified: false };
    setProperties((prev) => [optimistic, ...prev]);

    api('/api/properties', { method: 'POST', body: JSON.stringify(newProp) }).then(({ ok, data }) => {
      if (ok && data?.property) {
        setProperties((prev) => prev.map((p) => (p.id === optimistic.id ? data.property : p)));
      } else {
        // roll back on failure
        setProperties((prev) => prev.filter((p) => p.id !== optimistic.id));
      }
    });

    return optimistic;
  };

  const updateProperty = (id: string, updates: Partial<Property>) => {
    setProperties((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    api(`/api/properties/${id}`, { method: 'PATCH', body: JSON.stringify(updates) });
  };

  const updateVerificationStatus = (id: string, status: VerificationStatus, reason?: string) => {
    setProperties((prev) =>
      prev.map((p) => (p.id === id ? { ...p, verificationStatus: status, isVerified: status === 'approved', rejectionReason: status === 'rejected' ? reason : undefined } : p))
    );
    api(`/api/properties/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ verificationStatus: status, rejectionReason: reason }),
    });
  };

  const deleteProperty = (id: string) => {
    setProperties((prev) => prev.filter((p) => p.id !== id));
    api(`/api/properties/${id}`, { method: 'DELETE' });
  };

  const addInquiry: PropertyContextType['addInquiry'] = (inquiryData) => {
    const optimistic: PropertyInquiry = {
      id: `temp-${Date.now()}`,
      propertyId: inquiryData.propertyId,
      propertyTitle: inquiryData.propertyTitle,
      sellerUserId: inquiryData.sellerUserId,
      buyerUserId: inquiryData.buyerUserId,
      buyerName: inquiryData.buyerName,
      buyerPhone: inquiryData.buyerPhone,
      buyerEmail: inquiryData.buyerEmail,
      message: inquiryData.message,
      preferredTime: inquiryData.preferredTime,
      status: 'new',
      createdAt: 'Just now',
    };
    setInquiries((prev) => [optimistic, ...prev]);

    api('/api/inquiries', { method: 'POST', body: JSON.stringify(inquiryData) }).then(({ ok, data }) => {
      if (ok && data?.inquiry) {
        setInquiries((prev) => prev.map((i) => (i.id === optimistic.id ? data.inquiry : i)));
      }
    });

    return optimistic;
  };

  const updateInquiryStatus = (id: string, status: PropertyInquiry['status']) => {
    setInquiries((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
    api(`/api/inquiries/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
  };

  // Re-sync from the server (used by the admin "reset/refresh" control).
  const resetToDefaultData = () => {
    loadProperties();
    loadInquiries();
  };

  return (
    <PropertyContext.Provider
      value={{
        properties,
        inquiries,
        shortlistIds,
        isLoading,
        toggleShortlist,
        isShortlisted,
        getPropertyById,
        addProperty,
        updateProperty,
        updateVerificationStatus,
        deleteProperty,
        addInquiry,
        updateInquiryStatus,
        resetToDefaultData,
      }}
    >
      {children}
    </PropertyContext.Provider>
  );
}

export function useProperties() {
  const context = useContext(PropertyContext);
  if (!context) {
    throw new Error('useProperties must be used within a PropertyProvider');
  }
  return context;
}
