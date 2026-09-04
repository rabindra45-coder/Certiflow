import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/usePWAInstall';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 bg-amber-500 py-1.5 px-4 text-xs font-bold text-slate-950 shadow-md">
      <WifiOff className="h-4 w-4 animate-pulse" />
      <span>You are currently working offline. Changes will save locally.</span>
    </div>
  );
};
