import { writeFile } from "node:fs/promises";
import path from "node:path";
import { copyAttachments } from "./attachments/copyAttachments";
import { readConfig } from "./config";
import { createMarkdown } from "./markdown/createMarkdown";
import { sanitizeFileName } from "./markdown/sanitizeFileName";
import { loadClaudeConversations } from "./parser/loadClaudeConversations";
import { loadConversations } from "./parser/loadConversations";
import { parseConversations } from "./parser/parseConversation";
import { detectTopic } from "./topics/detectTopic";
import { ensureDir } from "./utils/ensureDir";
import { logger } from "./utils/logger";

async function main(): Promise<void> {
  const config = readConfig(process.argv);
  const loadResult = await loadConversations(config.inputDir);
  const parseResult = parseConversations(loadResult.conversations);
  const claudeResult = await loadClaudeConversations(config.inputDir);
  const conversations = [...parseResult.conversations, ...claudeResult.conversations];
  const chatsRoot = path.join(config.outputDir, "AI Chats");
  const usedPaths = new Set<string>();
  let markdownFiles = 0;

  for (const conversation of conversations) {
    const topic = detectTopic(
      conversation.title,
      conversation.messages.map((message) => message.text)
    );
    const topicDir = path.join(chatsRoot, topic);
    await ensureDir(topicDir);

    const fileName = uniqueMarkdownName(sanitizeFileName(conversation.title), topicDir, usedPaths);
    const markdown = createMarkdown(conversation, topic);
    await writeFile(path.join(topicDir, fileName), markdown, "utf8");
    markdownFiles += 1;
  }

  const attachmentsCopied = await copyAttachments(config.inputDir, config.outputDir);
  const failedFiles =
    loadResult.failedFiles.length +
    parseResult.failedConversations.length +
    claudeResult.failedFiles.length +
    claudeResult.failedConversations.length;

  logger.info("");
  logger.info("Summary");
  logger.info(`- Total JSON files: ${loadResult.totalFiles + claudeResult.totalFiles}`);
  logger.info(`- Total conversations: ${conversations.length}`);
  logger.info(`- Total markdown files: ${markdownFiles}`);
  logger.info(`- Total attachments copied: ${attachmentsCopied}`);
  logger.info(`- Failed files/conversations: ${failedFiles}`);

  for (const file of loadResult.failedFiles) {
    logger.warn(`Corrupted or unsupported JSON file skipped: ${file}`);
  }

  for (const file of claudeResult.failedFiles) {
    logger.warn(`Corrupted or unsupported Claude JSON file skipped: ${file}`);
  }

  for (const conversation of parseResult.failedConversations) {
    logger.warn(`Conversation skipped: ${conversation}`);
  }

  for (const conversation of claudeResult.failedConversations) {
    logger.warn(`Claude conversation skipped: ${conversation}`);
  }
}

function uniqueMarkdownName(baseName: string, directory: string, usedPaths: Set<string>): string {
  let counter = 1;
  let candidate = `${baseName}.md`;

  while (usedPaths.has(path.join(directory, candidate))) {
    counter += 1;
    candidate = `${baseName}-${counter}.md`;
  }

  usedPaths.add(path.join(directory, candidate));
  return candidate;
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  logger.error(message);
  process.exitCode = 1;
});
