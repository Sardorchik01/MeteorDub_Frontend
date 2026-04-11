import * as React from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { AdConfig } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '@/lib/utils';

interface AdBannerProps {
  location: AdConfig['location'];
  className?: string;
}

export function AdBanner({ location, className }: AdBannerProps) {
  const { profile } = useAuth();
  const [ad, setAd] = React.useState<AdConfig | null>(null);
  const [isVisible, setIsVisible] = React.useState(false);

  // Premium users don't see ads
  const isPremium = profile?.status === 'premium' || !!profile?.tariffId;

  React.useEffect(() => {
    if (isPremium) {
      setIsVisible(false);
      return;
    }

    const q = query(
      collection(db, 'ads'),
      where('location', '==', location),
      where('isEnabled', '==', true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setAd({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as AdConfig);
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    });

    return () => unsubscribe();
  }, [location, isPremium]);

  if (!isVisible || !ad) return null;

  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-sm transition-all duration-500",
        location === 'top' && "w-full h-24 mb-6",
        location === 'sidebar' && "w-full aspect-square mb-6",
        location === 'bottom' && "w-full h-32 mt-8",
        className
      )}
    >
      <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-zinc-800/80 text-[8px] text-zinc-500 font-bold tracking-widest uppercase">
        Advertisement
      </div>
      
      <div 
        className="w-full h-full flex items-center justify-center p-4 text-center"
        dangerouslySetInnerHTML={{ __html: ad.content }}
      />
      
      {/* Visual flair for the "chiroqli" (lighted) effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent animate-pulse" />
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent animate-pulse" />
      </div>
    </div>
  );
}
