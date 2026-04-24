"use client";

import { Send } from "lucide-react";
import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type PromptInputProps = ComponentProps<"form">;

export function PromptInput({ className, ...props }: PromptInputProps) {
  return (
    <form
      className={cn(
        "rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/95",
        className,
      )}
      {...props}
    />
  );
}

export type PromptInputTextareaProps = ComponentProps<"textarea">;

export function PromptInputTextarea({ className, ...props }: PromptInputTextareaProps) {
  return (
    <textarea
      className={cn(
        "max-h-40 min-h-12 w-full resize-none bg-transparent px-2 py-2 text-sm text-slate-950 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500",
        className,
      )}
      rows={2}
      {...props}
    />
  );
}

export type PromptInputSubmitProps = ComponentProps<typeof Button> & {
  status?: "submitted" | "streaming" | "ready" | "error";
};

export function PromptInputSubmit({
  className,
  status,
  children,
  ...props
}: PromptInputSubmitProps) {
  const isBusy = status === "submitted" || status === "streaming";

  return (
    <Button
      type="submit"
      size="icon"
      className={cn("size-8 rounded-xl", className)}
      disabled={isBusy || props.disabled}
      {...props}
    >
      {children ?? <Send className="size-4" />}
    </Button>
  );
}
