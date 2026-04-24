"use client";

import type { ComponentProps } from "react";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ConversationProps = ComponentProps<typeof StickToBottom>;

export function Conversation({ className, ...props }: ConversationProps) {
  return (
    <StickToBottom
      className={cn("relative min-h-0 flex-1 overflow-y-hidden", className)}
      initial="smooth"
      resize="smooth"
      role="log"
      {...props}
    />
  );
}

export type ConversationContentProps = ComponentProps<typeof StickToBottom.Content>;

export function ConversationContent({ className, ...props }: ConversationContentProps) {
  return <StickToBottom.Content className={cn("flex flex-col gap-4", className)} {...props} />;
}

export type ConversationEmptyStateProps = ComponentProps<"div"> & {
  title: string;
  description: string;
};

export function ConversationEmptyState({
  className,
  title,
  description,
  ...props
}: ConversationEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex size-full min-h-80 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300/80 bg-white/80 p-6 text-center dark:border-slate-800 dark:bg-slate-950/60",
        className,
      )}
      {...props}
    >
      <h2 className="text-base font-medium text-slate-950 dark:text-slate-100">{title}</h2>
      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-600 dark:text-slate-400">
        {description}
      </p>
    </div>
  );
}

export type ConversationScrollButtonProps = ComponentProps<typeof Button>;

export function ConversationScrollButton({ className, ...props }: ConversationScrollButtonProps) {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();

  if (isAtBottom) {
    return null;
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn("absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full", className)}
      onClick={() => scrollToBottom()}
      {...props}
    >
      Scroll to latest
    </Button>
  );
}
