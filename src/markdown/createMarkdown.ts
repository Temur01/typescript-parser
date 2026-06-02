import { createFrontmatter } from "./frontmatter";
import { formatDate } from "../utils/formatDate";
import type { ParsedConversation, ParsedMessage } from "../parser/types";

const ROLE_LABELS: Record<ParsedMessage["role"], string> = {
  user: "User",
  assistant: "Assistant",
  system: "System",
  tool: "Tool",
  unknown: "Message"
};

export function createMarkdown(conversation: ParsedConversation, topic: string): string {
  const sections = conversation.messages.map((message) => {
    return [`## ${ROLE_LABELS[message.role]}`, "", message.text.trim()].join("\n");
  });

  const header = [
    createFrontmatter(conversation, topic),
    `# ${conversation.title}`,
    [
      "## Metadata",
      "",
      `- Source: ${sourceLabel(conversation.source)}`,
      `- Created: ${formatDate(conversation.createdAt)}`,
      `- Updated: ${formatDate(conversation.updatedAt)}`,
      `- Topic: [[${topic}]]`
    ].join("\n"),
    "---"
  ];

  return [...header, ...sections].join("\n\n");
}

function sourceLabel(source: ParsedConversation["source"]): string {
  return source === "claude" ? "Claude Export" : "ChatGPT Export";
}
