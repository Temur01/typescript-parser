import { fromUnixSeconds } from "../utils/formatDate";
import type {
  ChatGptConversation,
  ChatGptMessage,
  ChatGptNode,
  ChatRole,
  ParsedConversation,
  ParsedMessage,
  ParseResult
} from "./types";

export function parseConversations(conversations: ChatGptConversation[]): ParseResult {
  const parsed: ParsedConversation[] = [];
  const failedConversations: string[] = [];

  for (const conversation of conversations) {
    try {
      const normalized = parseConversation(conversation);
      if (normalized.messages.length > 0) {
        parsed.push(normalized);
      }
    } catch {
      failedConversations.push(conversation.id ?? conversation.conversation_id ?? "unknown");
    }
  }

  return { conversations: parsed, failedConversations };
}

export function parseConversation(conversation: ChatGptConversation): ParsedConversation {
  const id = conversation.id ?? conversation.conversation_id ?? crypto.randomUUID();
  const createdAt = fromUnixSeconds(conversation.create_time) ?? new Date(0);
  const updatedAt = fromUnixSeconds(conversation.update_time) ?? createdAt;
  const messages = extractMessages(conversation);
  const firstMessageDate = messages.find((message) => message.createdAt)?.createdAt;
  const title = cleanTitle(conversation.title) ?? fallbackTitle(firstMessageDate ?? createdAt);

  return {
    id,
    source: "chatgpt",
    title,
    createdAt: firstMessageDate ?? createdAt,
    updatedAt,
    messages
  };
}

function extractMessages(conversation: ChatGptConversation): ParsedMessage[] {
  if (!conversation.mapping) {
    return [];
  }

  const orderedNodes = orderNodes(conversation.mapping, conversation.current_node);

  return orderedNodes
    .map((node) => node.message)
    .filter((message): message is ChatGptMessage => message !== null && message !== undefined)
    .map(toParsedMessage)
    .filter((message): message is ParsedMessage => message !== undefined);
}

function orderNodes(mapping: Record<string, ChatGptNode>, currentNode?: string | null): ChatGptNode[] {
  const nodes = Object.values(mapping);
  const currentPath = currentNode ? walkParents(mapping, currentNode) : [];

  if (currentPath.length > 0) {
    return currentPath;
  }

  return nodes.sort((first, second) => {
    const firstTime = first.message?.create_time ?? 0;
    const secondTime = second.message?.create_time ?? 0;
    return firstTime - secondTime;
  });
}

function walkParents(mapping: Record<string, ChatGptNode>, currentNode: string): ChatGptNode[] {
  const path: ChatGptNode[] = [];
  const seen = new Set<string>();
  let cursor: string | null | undefined = currentNode;

  while (cursor && mapping[cursor] && !seen.has(cursor)) {
    seen.add(cursor);
    const node = mapping[cursor];
    if (!node) {
      break;
    }

    path.push(node);
    cursor = node.parent;
  }

  return path.reverse();
}

function toParsedMessage(message: ChatGptMessage): ParsedMessage | undefined {
  const text = messageToText(message);
  if (!text.trim()) {
    return undefined;
  }

  const parsed: ParsedMessage = {
    role: normalizeRole(message.author?.role),
    text
  };

  const createdAt = fromUnixSeconds(message.create_time);
  if (createdAt) {
    parsed.createdAt = createdAt;
  }

  return parsed;
}

function messageToText(message: ChatGptMessage): string {
  const content = message.content;
  if (!content) {
    return "";
  }

  if (typeof content.text === "string") {
    return content.text;
  }

  if (typeof content.result === "string") {
    return content.result;
  }

  if (Array.isArray(content.parts)) {
    return content.parts.map(partToText).filter(Boolean).join("\n\n");
  }

  return "";
}

function partToText(part: unknown): string {
  if (typeof part === "string") {
    return part;
  }

  if (typeof part === "object" && part !== null) {
    const record = part as Record<string, unknown>;
    const text = record.text ?? record.name ?? record.url;
    return typeof text === "string" ? text : "";
  }

  return "";
}

function normalizeRole(role: string | undefined): ChatRole {
  if (role === "user" || role === "assistant" || role === "system" || role === "tool") {
    return role;
  }

  return "unknown";
}

function cleanTitle(title: string | undefined): string | undefined {
  const cleaned = title?.trim();
  return cleaned ? cleaned : undefined;
}

function fallbackTitle(date: Date): string {
  return `Untitled Conversation - ${date.toISOString().slice(0, 10)}`;
}
