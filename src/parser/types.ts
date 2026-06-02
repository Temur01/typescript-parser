export type ChatGptRole = "user" | "assistant" | "system" | "tool" | "unknown";

export interface ChatGptConversation {
  id?: string;
  conversation_id?: string;
  title?: string;
  create_time?: number | null;
  update_time?: number | null;
  current_node?: string | null;
  mapping?: Record<string, ChatGptNode>;
}

export interface ChatGptNode {
  id?: string;
  message?: ChatGptMessage | null;
  parent?: string | null;
  children?: string[];
}

export interface ChatGptMessage {
  id?: string;
  author?: {
    role?: string;
    name?: string | null;
  };
  content?: {
    content_type?: string;
    parts?: unknown[];
    text?: string;
    result?: string;
  };
  create_time?: number | null;
  update_time?: number | null;
  metadata?: Record<string, unknown>;
}

export interface ParsedMessage {
  role: ChatGptRole;
  text: string;
  createdAt?: Date;
}

export interface ParsedConversation {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messages: ParsedMessage[];
}

export interface LoadResult {
  conversations: ChatGptConversation[];
  totalFiles: number;
  failedFiles: string[];
}

export interface ParseResult {
  conversations: ParsedConversation[];
  failedConversations: string[];
}
