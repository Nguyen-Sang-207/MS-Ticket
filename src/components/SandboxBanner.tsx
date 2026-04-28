'use client';

import { useEffect, useState } from 'react';
import { isFirebaseDown } from '@/lib/dataService';
import { sandboxHasChanges, sandboxReset } from '@/lib/sandboxStore';
import { useAuth } from '@/context/AuthContext';
import { isMasterAdmin } from '@/lib/masterConfig';

/**
 * SandboxBanner - Shows a non-intrusive banner at the top of the page
 * indicating whether the user is in sandbox mode or offline/backup mode.
 * Only visible to non-master-admin users.
 */
export default function SandboxBanner() {
  const { user } = useAuth();
  const [isOffline, setIsOffline] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const isMaster = isMasterAdmin(user?.email);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsOffline(isFirebaseDown());
      setHasChanges(sandboxHasChanges());
    }, 0);

    const handler = (e: Event) => {
      setIsOffline((e as CustomEvent).detail?.isOffline ?? false);
    };
    window.addEventListener('cineme:offline', handler);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('cineme:offline', handler);
    };
  }, []);

  // Master admin sees nothing
  if (isMaster) return null;
  if (dismissed && !isOffline) return null;

  const handleReset = () => {
    sandboxReset();
    setHasChanges(false);
    setResetDone(true);
    setTimeout(() => window.location.reload(), 800);
  };

  // Offline / backup mode banner
  if (isOffline) {
    return (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[999] flex items-center gap-4 bg-[#18181b] border border-amber-500/30 text-amber-400 px-6 py-3 rounded-sm shadow-2xl text-[11px] font-bold uppercase tracking-widest">
        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        Chế độ Demo · Đang dùng dữ liệu dự phòng
        <button
          onClick={() => setDismissed(true)}
          className="ml-2 text-amber-600 hover:text-amber-300 transition-colors text-lg leading-none"
        >
          ×
        </button>
      </div>
    );
  }

  // Sandbox mode banner (guest with changes)
  if (!isMaster && !dismissed) {
    return (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[999] flex items-center gap-4 bg-[#09090b] border border-zinc-700 text-zinc-400 px-5 py-3 rounded-sm shadow-2xl text-[10px] font-bold uppercase tracking-widest max-w-[90vw]">
        <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
        <span>Chế độ thử nghiệm · Thay đổi chỉ lưu trên máy bạn</span>
        {hasChanges && (
          <button
            onClick={handleReset}
            className="ml-2 border border-zinc-700 hover:border-white text-zinc-400 hover:text-white transition-colors px-2 py-0.5 text-[9px]"
          >
            {resetDone ? 'Đã reset...' : 'Reset'}
          </button>
        )}
        <button
          onClick={() => setDismissed(true)}
          className="ml-1 text-zinc-600 hover:text-white transition-colors text-base leading-none"
        >
          ×
        </button>
      </div>
    );
  }

  return null;
}
