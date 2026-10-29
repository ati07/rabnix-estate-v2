'use client';

import { useState } from 'react';
import { Eye, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/authContext';

// Sitewide banner shown only while a superadmin is viewing another user's
// dashboard. It makes the impersonation unmistakable and offers a one-click
// exit back to the superadmin's own session.
export default function ImpersonationBanner() {
  const { user, stopImpersonation } = useAuth();
  const [exiting, setExiting] = useState(false);

  if (!user?.impersonatedBy) return null;

  const handleExit = async () => {
    setExiting(true);
    await stopImpersonation();
    // stopImpersonation hard-navigates; keep the button disabled meanwhile.
  };

  return (
    <div className="sticky top-0 z-[60] w-full bg-amber-500 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-2 font-semibold min-w-0">
          <Eye className="w-4 h-4 shrink-0" />
          <span className="truncate">
            Viewing <strong>{user.name}</strong>&apos;s dashboard as Super Admin
            {' '}({user.impersonatedBy.name})
          </span>
        </div>
        <button
          onClick={handleExit}
          disabled={exiting}
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-amber-700 font-bold hover:bg-amber-50 transition-colors cursor-pointer disabled:opacity-60"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{exiting ? 'Exiting…' : 'Exit view'}</span>
        </button>
      </div>
    </div>
  );
}
