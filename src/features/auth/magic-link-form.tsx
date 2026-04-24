"use client";

import { Mail } from "lucide-react";
import { useActionState, useState } from "react";
import { LocaleToggle } from "@/components/locale-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signInWithMagicLink } from "@/features/auth/actions";
import { copy } from "@/features/i18n/copy";
import type { Locale } from "@/features/i18n/types";

type MagicLinkFormProps = {
  initialLocale: Locale;
};

const initialState = {
  ok: false,
  message: "",
};

export function MagicLinkForm({ initialLocale }: MagicLinkFormProps) {
  const [locale, setLocale] = useState(initialLocale);
  const [state, formAction, pending] = useActionState(signInWithMagicLink, initialState);
  const content = copy[locale].login;

  return (
    <div className="w-full max-w-sm">
      <div className="fixed right-5 top-4 z-10 sm:right-8 lg:right-12">
        <LocaleToggle locale={locale} onChange={setLocale} />
      </div>

      <p className="mb-6 text-xs font-semibold text-emerald-600 dark:text-emerald-300">
        {content.eyebrow}
      </p>

      <div className="space-y-3">
        <h1 className="text-3xl font-semibold leading-tight text-slate-950 sm:text-4xl dark:text-slate-50">
          {content.title}
        </h1>
        <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">{content.subtitle}</p>
      </div>

      <form action={formAction} className="mt-7 space-y-3">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-slate-800 dark:text-slate-200">
            {content.emailLabel}
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder={content.emailPlaceholder}
            autoComplete="email"
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          <Mail className="size-4" />
          {content.magicLink}
        </Button>
      </form>

      {state.message ? (
        <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-100">
          {state.ok ? content.checkEmail : state.message}
        </p>
      ) : null}
    </div>
  );
}
