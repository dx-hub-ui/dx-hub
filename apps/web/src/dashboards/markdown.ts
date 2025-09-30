function normaliseMarkdownLine(input: string) {
  return input.replace(/\r?\n/g, " ").trim();
}

function renderInlineHtml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/_(.+?)_/g, "<em>$1</em>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}

function renderInlinePlain(input: string) {
  return input.replace(/\*\*|__|\*|_/g, "");
}

export function markdownToHtml(markdown: string) {
  const lines = markdown.split(/\r?\n/);
  const htmlParts: string[] = [];
  let listOpen = false;

  lines.forEach((line) => {
    const trimmed = normaliseMarkdownLine(line);
    if (trimmed.startsWith("- ")) {
      if (!listOpen) {
        htmlParts.push("<ul>");
        listOpen = true;
      }
      htmlParts.push(`<li>${renderInlineHtml(trimmed.slice(2))}</li>`);
      return;
    }

    if (listOpen) {
      htmlParts.push("</ul>");
      listOpen = false;
    }

    if (trimmed.length > 0) {
      htmlParts.push(`<p>${renderInlineHtml(trimmed)}</p>`);
    }
  });

  if (listOpen) {
    htmlParts.push("</ul>");
  }

  return htmlParts.join("");
}

export function markdownToPlainText(markdown: string) {
  const lines = markdown.split(/\r?\n/);
  const plainParts: string[] = [];

  lines.forEach((line) => {
    const trimmed = normaliseMarkdownLine(line);
    if (!trimmed) {
      return;
    }
    if (trimmed.startsWith("- ")) {
      plainParts.push(renderInlinePlain(trimmed.slice(2)));
      return;
    }
    plainParts.push(renderInlinePlain(trimmed));
  });

  return plainParts.join(" ").replace(/\s+/g, " ").trim();
}
