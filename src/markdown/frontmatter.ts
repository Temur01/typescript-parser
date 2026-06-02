import { formatDate } from "../utils/formatDate";
import type { ParsedConversation } from "../parser/types";

export function createFrontmatter(conversation: ParsedConversation, topic: string): string {
  const tags = [conversation.source, "auto-imported", slugTag(topic)];

  return [
    "---",
    `title: ${yamlString(conversation.title)}`,
    `created: ${yamlString(formatDate(conversation.createdAt))}`,
    `updated: ${yamlString(formatDate(conversation.updatedAt))}`,
    `source: ${yamlString(conversation.source)}`,
    "tags:",
    ...tags.map((tag) => `  - ${tag}`),
    "---"
  ].join("\n");
}

function yamlString(value: string): string {
  return JSON.stringify(value);
}

function slugTag(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "other";
}
