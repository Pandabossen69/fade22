const TAGS = /<\/?[^>]+>/g;
const CONTROLS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export function sanitizeText(input: unknown, max = 500): string {
  if (typeof input !== "string") return "";
  return input.replace(TAGS, "").replace(CONTROLS, "").trim().slice(0, max);
}

export function sanitizeMultiline(input: unknown, max = 400): string {
  if (typeof input !== "string") return "";
  return input
    .replace(TAGS, "")
    .replace(CONTROLS, "")
    .replace(/\r\n/g, "\n")
    .trim()
    .slice(0, max);
}
