import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { ChatRole, ParsedConversation, ParsedMessage } from "./types";

interface ClaudeConversation {
  uuid?: string;
  id?: string;
  name?: string;
  title?: string;
  summary?: string;
  created_at?: string;
  updated_at?: string;
  chat_messages?: ClaudeMessage[];
  messages?: ClaudeMessage[];
}

interface ClaudeProject {
  uuid?: string;
  id?: string;
  name?: string;
  title?: string;
  conversations?: ClaudeConversation[];
  chats?: ClaudeConversation[];
  chat_conversations?: ClaudeConversation[];
}

interface ClaudeMessage {
  uuid?: string;
  id?: string;
  sender?: string;
  role?: string;
  text?: string;
  content?: unknown;
  created_at?: string;
  updated_at?: string;
}

export interface ClaudeLoadResult {
  conversations: ParsedConversation[];
  totalFiles: number;
  failedFiles: string[];
  failedConversations: string[];
}

export async function loadClaudeConversations(inputDir: string): Promise<ClaudeLoadResult> {
  const files = await findClaudeFiles(inputDir);
  const conversations: ParsedConversation[] = [];
  const failedFiles: string[] = [];
  const failedConversations: string[] = [];
  const seenIds = new Set<string>();

  for (const file of files) {
    try {
      const raw = await readFile(file.absolutePath, "utf8");
      const parsed = JSON.parse(raw) as unknown;
      const extracted = extractClaudeConversations(parsed, file.projectName);

      if (extracted.length === 0) {
        failedFiles.push(file.relativePath);
        continue;
      }

      for (const item of extracted) {
        const conversation = parseClaudeConversation(item.conversation, item.projectName);
        if (conversation.messages.length === 0) {
          failedConversations.push(conversation.id);
          continue;
        }

        if (seenIds.has(conversation.id)) {
          continue;
        }

        seenIds.add(conversation.id);
        conversations.push(conversation);
      }
    } catch {
      failedFiles.push(file.relativePath);
    }
  }

  return {
    conversations,
    totalFiles: files.length,
    failedFiles,
    failedConversations
  };
}

function parseClaudeConversation(conversation: ClaudeConversation, projectName?: string): ParsedConversation {
  const messages = (conversation.chat_messages ?? conversation.messages ?? [])
    .map(toParsedMessage)
    .filter((message): message is ParsedMessage => message !== undefined);
  const createdAt = parseDate(conversation.created_at) ?? messages.find((message) => message.createdAt)?.createdAt ?? new Date(0);
  const updatedAt = parseDate(conversation.updated_at) ?? createdAt;
  const rawTitle =
    cleanTitle(conversation.name ?? conversation.title ?? conversation.summary) ??
    `Untitled Claude Conversation - ${createdAt.toISOString().slice(0, 10)}`;
  const title = projectName ? `${rawTitle} (${projectName})` : rawTitle;

  return {
    id: conversation.uuid ?? conversation.id ?? crypto.randomUUID(),
    source: "claude",
    title,
    createdAt,
    updatedAt,
    messages
  };
}

interface ClaudeFile {
  absolutePath: string;
  relativePath: string;
  projectName?: string;
}

interface ExtractedClaudeConversation {
  conversation: ClaudeConversation;
  projectName?: string;
}

async function findClaudeFiles(inputDir: string): Promise<ClaudeFile[]> {
  const files: ClaudeFile[] = [];
  const conversationsPath = path.join(inputDir, "conversations.json");

  if (await exists(conversationsPath)) {
    files.push({
      absolutePath: conversationsPath,
      relativePath: "conversations.json"
    });
  }

  const projectsDir = path.join(inputDir, "projects");
  if (!(await exists(projectsDir))) {
    return files;
  }

  const projectFiles = await readdir(projectsDir, { withFileTypes: true });
  for (const file of projectFiles) {
    if (!file.isFile() || !file.name.toLowerCase().endsWith(".json")) {
      continue;
    }

    files.push({
      absolutePath: path.join(projectsDir, file.name),
      relativePath: path.join("projects", file.name)
    });
  }

  return files;
}

function extractClaudeConversations(value: unknown, fallbackProjectName?: string): ExtractedClaudeConversation[] {
  if (Array.isArray(value)) {
    return value
      .filter(isClaudeConversation)
      .map((conversation) => ({ conversation, projectName: fallbackProjectName }));
  }

  if (!isObject(value)) {
    return [];
  }

  const project = value as ClaudeProject;
  const projectName = cleanTitle(project.name ?? project.title) ?? fallbackProjectName;

  if (isClaudeConversation(project) && hasClaudeMessages(project)) {
    return [{ conversation: project, projectName }];
  }

  const nested = [
    project.conversations,
    project.chats,
    project.chat_conversations
  ].find((items): items is ClaudeConversation[] => Array.isArray(items));

  if (nested) {
    return nested
      .filter(isClaudeConversation)
      .map((conversation) => ({ conversation, projectName }));
  }

  return [];
}

function toParsedMessage(message: ClaudeMessage): ParsedMessage | undefined {
  const text = messageToText(message);
  if (!text.trim()) {
    return undefined;
  }

  const parsed: ParsedMessage = {
    role: normalizeRole(message.sender ?? message.role),
    text
  };

  const createdAt = parseDate(message.created_at);
  if (createdAt) {
    parsed.createdAt = createdAt;
  }

  return parsed;
}

function messageToText(message: ClaudeMessage): string {
  if (typeof message.text === "string") {
    return message.text;
  }

  return contentToText(message.content);
}

function contentToText(content: unknown): string {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content.map(contentToText).filter(Boolean).join("\n\n");
  }

  if (typeof content === "object" && content !== null) {
    const record = content as Record<string, unknown>;
    return contentToText(record.text ?? record.content ?? record.name ?? "");
  }

  return "";
}

function normalizeRole(role: string | undefined): ChatRole {
  if (role === "human" || role === "user") {
    return "user";
  }

  if (role === "assistant") {
    return "assistant";
  }

  if (role === "system") {
    return "system";
  }

  return "unknown";
}

function parseDate(value: string | undefined): Date | undefined {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function cleanTitle(title: string | undefined): string | undefined {
  const cleaned = title?.trim();
  return cleaned ? cleaned : undefined;
}

function isClaudeConversation(value: unknown): value is ClaudeConversation {
  return isObject(value);
}

function hasClaudeMessages(value: ClaudeConversation): boolean {
  return Array.isArray(value.chat_messages) || Array.isArray(value.messages);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}
