"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const updateLocaleSchema = z.object({
  locale: z.enum(["pt-BR", "en"]),
});

export async function updatePreferredLocale(formData: FormData) {
  const parsed = updateLocaleSchema.safeParse({
    locale: formData.get("locale"),
  });

  if (!parsed.success) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  await supabase
    .from("profiles")
    .update({ preferred_locale: parsed.data.locale })
    .eq("id", user.id);

  revalidatePath("/");
  revalidatePath("/login");
}
