"use client";

import { LogOut, Menu, MessageSquarePlus, Send, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { LocaleToggle } from "@/components/locale-toggle";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { signOut } from "@/features/auth/actions";
import type { ChatMessage, Conversation, MessageGroup } from "@/features/chat/types";
import { copy } from "@/features/i18n/copy";
import type { Locale } from "@/features/i18n/types";
import { cn } from "@/lib/utils";

type ChatShellProps = {
  locale: Locale;
  conversations: Conversation[];
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

function getDraftConversation(conversationId: string): Conversation {
  const now = new Date().toISOString();

  return {
    id: conversationId,
    user_id: "local",
    title: "New conversation",
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

  function upsertConversation(conversationId: string) {
    setConversationList((current) => {
      if (current.some((conversation) => conversation.id === conversationId)) {
        return current;
      }

      return [getDraftConversation(conversationId), ...current];
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
      const userMessage = createDraftMessage({ conversationId, role: "user", content: message });
      const assistantMessage = createDraftMessage({
        conversationId,
        role: "assistant",
        content: "",
      });
      upsertConversation(conversationId);
      appendMessages(conversationId, userMessage, assistantMessage);
      await readAssistantStream(response, conversationId, assistantMessage.id);
    } finally {
      setIsSending(false);
    }
  }

  const sidebar = (
    <aside className="flex h-full min-h-0 w-full flex-col border-slate-200 bg-white md:border-r">
      <div className="flex h-16 items-center justify-between gap-3 border-b border-slate-200 px-4">
        <div>
          <p className="text-sm font-semibold text-slate-950">{content.conversations}</p>
          <p className="text-xs text-slate-500">{conversationList.length} saved</p>
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
              "w-full rounded-md px-3 py-2 text-left text-sm transition",
              conversation.id === selectedConversationId
                ? "bg-emerald-50 text-emerald-950"
                : "text-slate-700 hover:bg-slate-100",
            )}
          >
            <span className="line-clamp-2">{conversation.title}</span>
          </button>
        ))}
      </nav>
    </aside>
  );

  return (
    <main className="flex h-dvh overflow-hidden bg-slate-50 text-slate-950">
      <div className="hidden w-80 shrink-0 md:block">{sidebar}</div>

      {sidebarOpen ? (
        <div className="fixed inset-0 z-40 bg-slate-950/45 md:hidden">
          <div className="h-full w-[min(84vw,22rem)] bg-white shadow-xl">
            <div className="flex justify-end border-b border-slate-200 p-2">
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
        <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-3 sm:px-5">
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
            <h1 className="truncate text-lg font-semibold">{content.title}</h1>
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

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-5 sm:px-6">
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
            {activeMessages.length === 0 ? (
              <div className="mt-16 rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center">
                <h2 className="text-lg font-semibold">{content.emptyTitle}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{content.emptyBody}</p>
              </div>
            ) : null}

            {activeMessages.map((message) => (
              <div
                key={message.id}
                className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[88%] rounded-lg px-4 py-3 text-sm leading-6 shadow-sm sm:max-w-[74%]",
                    message.role === "user"
                      ? "bg-emerald-700 text-white"
                      : "border border-slate-200 bg-white text-slate-800",
                  )}
                >
                  {message.content || content.thinking}
                </div>
              </div>
            ))}
          </div>
        </div>

        <form
          onSubmit={submitMessage}
          className="shrink-0 border-t border-slate-200 bg-white p-3 sm:p-5"
        >
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 sm:flex-row">
            <Textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={content.inputPlaceholder}
              className="min-h-20 flex-1"
            />
            <Button type="submit" className="h-11 sm:h-20 sm:w-24" disabled={isSending}>
              <Send className="size-4" />
              <span className="sm:hidden">{content.send}</span>
            </Button>
          </div>
          {error ? <p className="mx-auto mt-2 max-w-3xl text-sm text-rose-700">{error}</p> : null}
        </form>
      </section>
    </main>
  );
}
