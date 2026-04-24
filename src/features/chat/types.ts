import type { Database } from "@/types/database";

export type Conversation = Database["public"]["Tables"]["conversations"]["Row"];
export type ChatMessage = Database["public"]["Tables"]["messages"]["Row"];

export type MessageRole = ChatMessage["role"];

export type MessageGroup = Record<string, ChatMessage[]>;
