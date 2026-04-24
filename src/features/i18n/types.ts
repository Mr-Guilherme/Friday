export type Locale = "pt-BR" | "en";

export const locales: Locale[] = ["pt-BR", "en"];

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}
