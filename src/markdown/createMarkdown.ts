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
      "- Source: ChatGPT Export",
      `- Created: ${formatDate(conversation.createdAt)}`,
      `- Updated: ${formatDate(conversation.updatedAt)}`,
      `- Topic: [[${topic}]]`
    ].join("\n"),
    "---"
  ];

  return [...header, ...sections].join("\n\n");
}
