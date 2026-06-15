/**
 * Normalises LaTeX-style math delimiters to the dollar form that remark-math
 * understands. LLMs frequently emit inline math as `\( … \)` and display math
 * as `\[ … \]`, neither of which remark-math parses (and Markdown turns `\(`
 * into a literal `(` during escaping, so this must run on the raw string before
 * parsing). Fenced code blocks and inline code spans are protected so their
 * contents are never rewritten.
 */
export function normalizeMathDelimiters(src: string): string {
  const protectedBlocks: string[] = [];
  // Unique alphanumeric token: untouched by Markdown and by the math delimiter
  // regexes below, carries no spaces (so neighbouring text stays adjacent), and
  // is unlikely enough to never collide with real content.
  const token = (i: number) => `xMATHGUARDx${i}x`;

  // Stash fenced code blocks and inline code so we never rewrite math-like text
  // that lives inside actual code.
  const protectedSrc = src.replace(
    /```[\s\S]*?```|``[^`]*``|`[^`\n]*`/g,
    (match) => {
      protectedBlocks.push(match);
      return token(protectedBlocks.length - 1);
    },
  );

  const converted = protectedSrc
    // Display math: \[ … \]  ->  $$ … $$
    .replace(/\\\[([\s\S]+?)\\\]/g, (_, body) => `$$${body}$$`)
    // Inline math:  \( … \)  ->  $ … $
    .replace(/\\\(([\s\S]+?)\\\)/g, (_, body) => `$${body}$`);

  return converted.replace(
    /xMATHGUARDx(\d+)x/g,
    (_, i) => protectedBlocks[Number(i)],
  );
}
