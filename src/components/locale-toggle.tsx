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
    <div className="inline-grid grid-cols-2 rounded-md border border-slate-200 bg-white p-1 shadow-sm">
      {locales.map((item) => {
        const active = item === locale;

        if (persist) {
          return (
            <form action={updatePreferredLocale} key={item}>
              <input type="hidden" name="locale" value={item} />
              <button
                type="submit"
                className={cn(
                  "h-8 min-w-14 rounded px-3 text-sm font-medium transition",
                  active ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100",
                )}
              >
                {item === "pt-BR" ? "PT" : "EN"}
              </button>
            </form>
          );
        }

        return (
          <button
            type="button"
            key={item}
            onClick={() => onChange?.(item)}
            className={cn(
              "h-8 min-w-14 rounded px-3 text-sm font-medium transition",
              active ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100",
            )}
          >
            {item === "pt-BR" ? "PT" : "EN"}
          </button>
        );
      })}
    </div>
  );
}
