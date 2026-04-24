export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          preferred_locale: "pt-BR" | "en";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          preferred_locale?: "pt-BR" | "en";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          preferred_locale?: "pt-BR" | "en";
          updated_at?: string;
        };
        Relationships: [];
      };
      conversations: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          user_id: string;
          role: "user" | "assistant";
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          user_id: string;
          role: "user" | "assistant";
          content: string;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      chat_rate_limits: {
        Row: {
          id: string;
          user_id: string;
          ip_hash: string;
          window_start: string;
          request_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          ip_hash: string;
          window_start: string;
          request_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          request_count?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      consume_chat_rate_limit: {
        Args: {
          p_user_id: string;
          p_ip_hash: string;
          p_limit?: number;
        };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
