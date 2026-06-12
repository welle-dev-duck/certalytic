import type { ImportCandidateRow } from "@/features/candidates/hooks/use-candidates";

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i]!;

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  result.push(current);
  return result;
}

export function parseImportCsv(text: string): ImportCandidateRow[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]!).map((h) => h.trim().toLowerCase());
  const nameIdx = headers.indexOf("name");
  const emailIdx = headers.indexOf("email");
  const transcriptIdx = headers.indexOf("transcript");

  if (nameIdx < 0 || transcriptIdx < 0) {
    throw new Error(
      "CSV must include name and transcript columns (email is optional).",
    );
  }

  const rows: ImportCandidateRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]!);
    const name = cols[nameIdx]?.trim();
    const transcript = cols[transcriptIdx]?.trim();

    if (!name || !transcript || transcript.length < 10) continue;

    const email =
      emailIdx >= 0 ? cols[emailIdx]?.trim() || undefined : undefined;

    rows.push({ name, email, transcript });
  }

  return rows;
}
