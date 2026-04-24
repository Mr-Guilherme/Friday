"use client";

import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type MessageRole = "user" | "assistant" | "system";

export type MessageProps = HTMLAttributes<HTMLDivElement> & {
  from: MessageRole;
};

export function Message({ className, from, ...props }: MessageProps) {
  return (
    <div
      className={cn(
        "group flex w-full",
        from === "user" ? "justify-end" : "justify-start",
        className,
      )}
      data-role={from}
      {...props}
    />
  );
}

export type MessageContentProps = HTMLAttributes<HTMLDivElement>;

export function MessageContent({ className, ...props }: MessageContentProps) {
  return (
    <div
      className={cn(
        "max-w-[88%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-6 shadow-sm sm:max-w-[72%]",
        "group-data-[role=user]:bg-emerald-400 group-data-[role=user]:text-slate-950",
        "group-data-[role=assistant]:border group-data-[role=assistant]:border-slate-200 group-data-[role=assistant]:bg-white group-data-[role=assistant]:text-slate-800",
        "dark:group-data-[role=user]:bg-emerald-300 dark:group-data-[role=assistant]:border-slate-800 dark:group-data-[role=assistant]:bg-slate-900/70 dark:group-data-[role=assistant]:text-slate-100",
        className,
      )}
      {...props}
    />
  );
}

export type MessageResponseProps = HTMLAttributes<HTMLDivElement>;

export function MessageResponse({ children, ...props }: MessageResponseProps) {
  return <MessageContent {...props}>{children}</MessageContent>;
}

export type ThinkingMessageProps = {
  label: string;
};

export function ThinkingMessage({ label }: ThinkingMessageProps) {
  return (
    <MessageContent
      aria-label={label}
      aria-live="polite"
      className="text-slate-500 dark:text-slate-400"
    >
      <span className="inline-flex items-center gap-1 motion-reduce:animate-none">
        <span className="animate-pulse motion-reduce:animate-none">{label}</span>
        <span className="flex gap-0.5" aria-hidden="true">
          <span className="size-1 rounded-full bg-current opacity-40 [animation:thinking-dot_1.2s_ease-in-out_infinite]" />
          <span className="size-1 rounded-full bg-current opacity-40 [animation:thinking-dot_1.2s_ease-in-out_infinite_150ms]" />
          <span className="size-1 rounded-full bg-current opacity-40 [animation:thinking-dot_1.2s_ease-in-out_infinite_300ms]" />
        </span>
      </span>
    </MessageContent>
  );
}
