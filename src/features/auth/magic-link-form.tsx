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
    <div className="w-full max-w-md">
      <div className="mb-6 flex items-center justify-between gap-4">
        <p className="text-sm font-semibold text-emerald-700">{content.eyebrow}</p>
        <LocaleToggle locale={locale} onChange={setLocale} />
      </div>

      <div className="space-y-3">
        <h1 className="text-3xl font-semibold leading-tight text-slate-950 sm:text-4xl">
          {content.title}
        </h1>
        <p className="text-base leading-7 text-slate-600">{content.subtitle}</p>
      </div>

      <form action={formAction} className="mt-8 space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-slate-800">
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
        <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          {state.ok ? content.checkEmail : state.message}
        </p>
      ) : null}
    </div>
  );
}
