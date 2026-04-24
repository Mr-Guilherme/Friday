import { z } from "zod";

export const chatRequestSchema = z.object({
  conversationId: z.uuid().optional(),
  message: z.string().trim().min(1).max(2000),
});

export const conversationIdSchema = z.uuid();

export type ChatRequest = z.infer<typeof chatRequestSchema>;
