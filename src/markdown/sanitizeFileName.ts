const RESERVED_WINDOWS_NAMES = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;

export function sanitizeFileName(input: string): string {
  const cleaned = input
    .replace(/[\/\\:*?"<>|]/g, "-")
    .replace(/[\u0000-\u001f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[. ]+$/g, "");

  const safe = cleaned.slice(0, 180) || "Untitled Conversation";
  return RESERVED_WINDOWS_NAMES.test(safe) ? `${safe}-conversation` : safe;
}
