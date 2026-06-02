import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { ChatGptConversation, LoadResult } from "./types";

export async function loadConversations(inputDir: string): Promise<LoadResult> {
  const entries = await readdir(inputDir, { withFileTypes: true });
  const jsonFiles = entries
    .filter((entry) => entry.isFile() && /^conversations-\d+\.json$/i.test(entry.name))
    .map((entry) => entry.name)
    .sort();

  const conversations: ChatGptConversation[] = [];
  const failedFiles: string[] = [];

  for (const file of jsonFiles) {
    const filePath = path.join(inputDir, file);

    try {
      const raw = await readFile(filePath, "utf8");
      const parsed = JSON.parse(raw) as unknown;

      if (!Array.isArray(parsed)) {
        failedFiles.push(file);
        continue;
      }

      conversations.push(...parsed.filter(isConversation));
    } catch {
      failedFiles.push(file);
    }
  }

  return {
    conversations,
    totalFiles: jsonFiles.length,
    failedFiles
  };
}

function isConversation(value: unknown): value is ChatGptConversation {
  return typeof value === "object" && value !== null;
}
