import type { Locale } from "@/features/i18n/types";

export const copy = {
  "pt-BR": {
    login: {
      eyebrow: "Friday English",
      title: "Pratique inglês como engenheiro de software.",
      subtitle:
        "Converse com uma IA treinada para simular discussões técnicas, entrevistas e conversas do dia a dia em times globais.",
      emailLabel: "Email",
      emailPlaceholder: "voce@empresa.com",
      magicLink: "Entrar com magic link",
      google: "Entrar com Google",
      checkEmail: "Confira seu email para continuar.",
      terms: "Sem senha. Sua sessão é gerenciada pelo Supabase Auth.",
    },
    chat: {
      title: "Friday",
      newConversation: "Nova conversa",
      conversations: "Conversas",
      emptyTitle: "Comece uma prática em inglês",
      emptyBody: "Peça para simular uma daily, code review, incident review ou entrevista.",
      inputPlaceholder: "Digite em inglês ou peça ajuda para reformular...",
      send: "Enviar",
      signOut: "Sair",
      menu: "Conversas",
      thinking: "Respondendo...",
      rateLimited: "Muitas mensagens em pouco tempo. Aguarde um minuto e tente novamente.",
    },
  },
  en: {
    login: {
      eyebrow: "Friday English",
      title: "Practice English like a software engineer.",
      subtitle:
        "Chat with an AI coach trained for technical discussions, interviews, and everyday global team conversations.",
      emailLabel: "Email",
      emailPlaceholder: "you@company.com",
      magicLink: "Sign in with magic link",
      google: "Sign in with Google",
      checkEmail: "Check your email to continue.",
      terms: "No password. Your session is managed by Supabase Auth.",
    },
    chat: {
      title: "Friday",
      newConversation: "New conversation",
      conversations: "Conversations",
      emptyTitle: "Start an English practice session",
      emptyBody: "Ask for a daily, code review, incident review, or interview simulation.",
      inputPlaceholder: "Write in English or ask for help rephrasing...",
      send: "Send",
      signOut: "Sign out",
      menu: "Conversations",
      thinking: "Thinking...",
      rateLimited: "Too many messages in a short time. Wait one minute and try again.",
    },
  },
} satisfies Record<Locale, Record<string, Record<string, string>>>;
