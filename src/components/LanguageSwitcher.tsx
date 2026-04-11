import * as React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Language } from '../types';
import { cn } from '@/lib/utils';
import { Globe } from 'lucide-react';

export function LanguageSwitcher({ className }: { className?: string }) {
  const { language, setLanguage } = useLanguage();

  const langs: { code: Language; label: string; flag: string }[] = [
    { code: 'uz', label: 'O\'zbek', flag: '🇺🇿' },
    { code: 'ru', label: 'Русский', flag: '🇷🇺' },
    { code: 'en', label: 'English', flag: '🇺🇸' },
  ];

  return (
    <div className={cn("flex flex-col gap-1 p-2 bg-zinc-900/50 rounded-xl border border-zinc-800", className)}>
      <div className="flex items-center gap-2 px-2 py-1 mb-1">
        <Globe className="h-3 w-3 text-zinc-500" />
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Language</span>
      </div>
      <div className="grid grid-cols-3 gap-1">
        {langs.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={cn(
              "flex flex-col items-center justify-center py-2 rounded-lg transition-all border",
              language === lang.code 
                ? "bg-blue-500/10 border-blue-500/50 text-blue-500" 
                : "bg-zinc-900 border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
            )}
          >
            <span className="text-lg mb-0.5">{lang.flag}</span>
            <span className="text-[9px] font-bold uppercase">{lang.code}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
