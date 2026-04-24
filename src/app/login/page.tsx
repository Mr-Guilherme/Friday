import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signInWithGoogle } from "@/features/auth/actions";
import { MagicLinkForm } from "@/features/auth/magic-link-form";

export default function LoginPage() {
  return (
    <main className="min-h-dvh bg-slate-50">
      <div className="grid min-h-dvh lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <section className="flex items-center px-5 py-10 sm:px-8 lg:px-12">
          <MagicLinkForm initialLocale="pt-BR" />
        </section>

        <section className="flex min-h-[42dvh] items-end bg-[linear-gradient(135deg,#064e3b_0%,#0f766e_42%,#1e293b_100%)] px-5 py-8 text-white sm:px-8 lg:min-h-dvh lg:px-12">
          <div className="max-w-xl space-y-6">
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-100">
                Engineering English
              </p>
              <h2 className="text-3xl font-semibold leading-tight sm:text-5xl">
                Practice the conversations your career already requires.
              </h2>
            </div>
            <form action={signInWithGoogle}>
              <Button
                type="submit"
                variant="secondary"
                className="w-full bg-white text-slate-950 hover:bg-emerald-50 sm:w-auto"
              >
                <LogIn className="size-4" />
                Continue with Google
              </Button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
