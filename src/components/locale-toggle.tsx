"use client";

import type { Locale } from "@/features/i18n/types";
import { updatePreferredLocale } from "@/features/profile/actions";
import { cn } from "@/lib/utils";

type LocaleToggleProps = {
  locale: Locale;
  persist?: boolean;
  onChange?: (locale: Locale) => void;
};

export function LocaleToggle({ locale, persist = false, onChange }: LocaleToggleProps) {
  const locales: Locale[] = ["pt-BR", "en"];

  return (
    <div className="inline-flex items-center gap-1">
      {locales.map((item) => {
        const active = item === locale;
        const label = item === "pt-BR" ? "PT" : "EN";
        const className = cn(
          "h-7 min-w-8 rounded-none border-b px-1.5 text-xs font-medium tracking-wide transition",
          active
            ? "border-emerald-500 text-slate-950 dark:border-emerald-300 dark:text-slate-50"
            : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-500 dark:hover:text-slate-200",
        );

        if (persist) {
          return (
            <form action={updatePreferredLocale} key={item}>
              <input type="hidden" name="locale" value={item} />
              <button type="submit" className={className} aria-pressed={active}>
                {label}
              </button>
            </form>
          );
        }

        return (
          <button
            type="button"
            key={item}
            onClick={() => onChange?.(item)}
            className={className}
            aria-pressed={active}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
