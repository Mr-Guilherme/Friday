"use client";

import { LogOut, Menu, MessageSquarePlus, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { LocaleToggle } from "@/components/locale-toggle";
import { Button } from "@/components/ui/button";
import { signOut } from "@/features/auth/actions";
import type {
  ChatMessage,
  MessageGroup,
  Conversation as SavedConversation,
} from "@/features/chat/types";
import { copy } from "@/features/i18n/copy";
import type { Locale } from "@/features/i18n/types";
import { cn } from "@/lib/utils";

type ChatShellProps = {
  locale: Locale;
  conversations: SavedConversation[];
  messagesByConversation: MessageGroup;
};

type DisplayMessage = Pick<
  ChatMessage,
  "id" | "conversation_id" | "role" | "content" | "created_at"
>;
type DisplayMessageGroup = Record<string, DisplayMessage[]>;

function createDraftMessage(input: {
  conversationId: string;
  role: "user" | "assistant";
  content: string;
}): DisplayMessage {
  return {
    id: crypto.randomUUID(),
    conversation_id: input.conversationId,
    role: input.role,
    content: input.content,
    created_at: new Date().toISOString(),
  };
}

function getDraftConversation(conversationId: string, title: string): SavedConversation {
  const now = new Date().toISOString();

  return {
    id: conversationId,
    user_id: "local",
    title,
    created_at: now,
    updated_at: now,
  };
}

export function ChatShell({ locale, conversations, messagesByConversation }: ChatShellProps) {
  const content = copy[locale].chat;
  const draftConversationId = useRef(crypto.randomUUID());
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>(
    conversations[0]?.id,
  );
  const [conversationList, setConversationList] = useState(conversations);
  const [messageGroups, setMessageGroups] = useState<DisplayMessageGroup>(messagesByConversation);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const activeConversationId = selectedConversationId ?? draftConversationId.current;
  const activeMessages = useMemo(
    () => messageGroups[activeConversationId] ?? [],
    [activeConversationId, messageGroups],
  );

  function startNewConversation() {
    draftConversationId.current = crypto.randomUUID();
    setSelectedConversationId(undefined);
    setSidebarOpen(false);
    setError("");
  }

  function selectConversation(conversationId: string) {
    setSelectedConversationId(conversationId);
    setSidebarOpen(false);
    setError("");
  }

  function upsertConversation(conversationId: string, title: string) {
    setConversationList((current) => {
      const existing = current.find((conversation) => conversation.id === conversationId);

      if (existing) {
        return current.map((conversation) =>
          conversation.id === conversationId ? { ...conversation, title } : conversation,
        );
      }

      return [getDraftConversation(conversationId, title), ...current];
    });
    setSelectedConversationId(conversationId);
  }

  async function readAssistantStream(
    response: Response,
    conversationId: string,
    assistantId: string,
  ) {
    const reader = response.body?.getReader();

    if (!reader) {
      return;
    }

    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        return;
      }

      const chunk = decoder.decode(value, { stream: true });
      setMessageGroups((current) => ({
        ...current,
        [conversationId]: (current[conversationId] ?? []).map((message) =>
          message.id === assistantId
            ? { ...message, content: `${message.content}${chunk}` }
            : message,
        ),
      }));
    }
  }

  function appendMessages(
    conversationId: string,
    userMessage: DisplayMessage,
    assistantMessage: DisplayMessage,
  ) {
    setMessageGroups((current) => ({
      ...current,
      [conversationId]: [...(current[conversationId] ?? []), userMessage, assistantMessage],
    }));
  }

  async function submitMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = input.trim();

    if (!message || isSending) {
      return;
    }

    setInput("");
    setError("");
    setIsSending(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          conversationId: selectedConversationId,
          message,
        }),
      });

      if (response.status === 429) {
        setError(content.rateLimited);
        return;
      }

      if (!response.ok) {
        setError("Could not send this message.");
        return;
      }

      const conversationId = response.headers.get("x-conversation-id") ?? activeConversationId;
      const conversationTitle = response.headers.get("x-conversation-title") ?? message;
      const userMessage = createDraftMessage({ conversationId, role: "user", content: message });
      const assistantMessage = createDraftMessage({
        conversationId,
        role: "assistant",
        content: "",
      });
      upsertConversation(conversationId, conversationTitle);
      appendMessages(conversationId, userMessage, assistantMessage);
      await readAssistantStream(response, conversationId, assistantMessage.id);
    } finally {
      setIsSending(false);
    }
  }

  const sidebar = (
    <aside className="flex h-full min-h-0 w-full flex-col border-slate-200 bg-white md:border-r dark:border-slate-800 dark:bg-slate-950">
      <div className="flex h-14 items-center justify-between gap-3 border-b border-slate-200 px-3 dark:border-slate-800">
        <div>
          <p className="text-sm font-medium text-slate-950 dark:text-slate-100">
            {content.conversations}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-500">
            {conversationList.length} saved
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={startNewConversation}>
          <MessageSquarePlus className="size-4" />
          <span className="hidden sm:inline">{content.newConversation}</span>
        </Button>
      </div>
      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3">
        {conversationList.map((conversation) => (
          <button
            type="button"
            key={conversation.id}
            onClick={() => selectConversation(conversation.id)}
            className={cn(
              "w-full rounded-lg px-3 py-2 text-left text-sm transition",
              conversation.id === selectedConversationId
                ? "bg-emerald-50 text-emerald-950 dark:bg-emerald-400/10 dark:text-emerald-100"
                : "text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100",
            )}
          >
            <span className="line-clamp-2">{conversation.title}</span>
          </button>
        ))}
      </nav>
    </aside>
  );

  return (
    <main className="flex h-dvh overflow-hidden bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <div className="hidden w-72 shrink-0 md:block">{sidebar}</div>

      {sidebarOpen ? (
        <div className="fixed inset-0 z-40 bg-slate-950/45 md:hidden">
          <div className="h-full w-[min(84vw,21rem)] bg-white shadow-xl dark:bg-slate-950">
            <div className="flex justify-end border-b border-slate-200 p-2 dark:border-slate-800">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="size-5" />
              </Button>
            </div>
            {sidebar}
          </div>
        </div>
      ) : null}

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-3 sm:px-4 dark:border-slate-800 dark:bg-slate-950">
          <div className="flex min-w-0 items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="size-5" />
            </Button>
            <h1 className="truncate text-base font-semibold">{content.title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <LocaleToggle locale={locale} persist />
            <form action={signOut}>
              <Button type="submit" variant="ghost" size="icon" aria-label={content.signOut}>
                <LogOut className="size-5" />
              </Button>
            </form>
          </div>
        </header>

        <Conversation className="px-3 py-4 sm:px-5">
          <ConversationContent className="mx-auto w-full max-w-3xl">
            {activeMessages.length === 0 ? (
              <ConversationEmptyState title={content.emptyTitle} description={content.emptyBody} />
            ) : null}

            {activeMessages.map((message) => (
              <Message key={message.id} from={message.role}>
                {message.role === "assistant" ? (
                  <MessageResponse>{message.content || content.thinking}</MessageResponse>
                ) : (
                  <MessageContent>{message.content}</MessageContent>
                )}
              </Message>
            ))}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <div className="shrink-0 border-t border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950 sm:p-4">
          <PromptInput
            onSubmit={submitMessage}
            className="mx-auto flex w-full max-w-3xl items-end gap-2"
          >
            <PromptInputTextarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={content.inputPlaceholder}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
            />
            <PromptInputSubmit
              status={isSending ? "streaming" : "ready"}
              disabled={!input.trim()}
              aria-label={content.send}
            />
          </PromptInput>
          {error ? (
            <p className="mx-auto mt-2 max-w-3xl text-sm text-rose-700 dark:text-rose-300">
              {error}
            </p>
          ) : null}
        </div>
      </section>
    </main>
  );
}
