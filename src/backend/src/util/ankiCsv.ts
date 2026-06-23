// Converts an AnkiLM "anki" markdown export into one or more Anki-importable CSV files.
//
// The markdown groups cards under "## <NoteType>" section headers; each section's rows
// are already semicolon-separated fields ending in a tags column. Different note types
// have different field counts (e.g. Basic = Front;Back;Tags, "Antwort eintippen" =
// Front;Back;Extra;Tags), and Anki cannot mix note types in a single import file — so
// every section becomes its own CSV with its own `#tags column` directive.

export interface AnkiCsvFile {
  /** The section header text, e.g. "Einfach" or "Lückentext". */
  section: string;
  /** Full CSV text including the Anki import header directives. */
  content: string;
}

interface Section {
  name: string;
  rows: string[];
}

export function ankiMarkdownToCsv(markdown: string): AnkiCsvFile[] {
  const sections: Section[] = [];
  let current: Section | null = null;

  for (const rawLine of markdown.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const header = line.match(/^#{1,6}\s+(.*)$/);
    if (header) {
      current = { name: header[1].trim(), rows: [] };
      sections.push(current);
      continue;
    }

    // A row before any header (no "## ..." seen yet) lands in a default section.
    if (!current) {
      current = { name: "Karten", rows: [] };
      sections.push(current);
    }
    current.rows.push(line);
  }

  return sections
    .filter((s) => s.rows.length > 0)
    .map((s) => {
      // Within a section all rows share the same field count; the tags column is last.
      const cols = Math.max(...s.rows.map((r) => r.split(";").length));
      const directives = [
        "#separator:Semicolon",
        "#html:true",
        `#tags column:${cols}`,
      ].join("\n");
      return { section: s.name, content: `${directives}\n${s.rows.join("\n")}\n` };
    });
}
