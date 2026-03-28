import hljs from "highlight.js";

export interface LangInfo {
  id: string;
  name: string;
  icon: string;
  extension: string;
}

const FALLBACK: LangInfo = { id: "txt", name: "Text", icon: "📄", extension: "txt" };

const MAP: Record<string, LangInfo> = {
  javascript: { id: "javascript", icon: "🟨", extension: "js",   name: "JavaScript" },
  typescript: { id: "typescript", icon: "🟦", extension: "ts",   name: "TypeScript" },
  html:       { id: "html",       icon: "🟧", extension: "html", name: "HTML" },
  css:        { id: "css",        icon: "🎨", extension: "css",  name: "CSS" },
  scss:       { id: "scss",       icon: "🎨", extension: "scss", name: "SCSS" },
  python:     { id: "python",     icon: "🐍", extension: "py",   name: "Python" },
  java:       { id: "java",       icon: "☕", extension: "java", name: "Java" },
  c:          { id: "c",          icon: "🔵", extension: "c",    name: "C" },
  cpp:        { id: "cpp",        icon: "🔵", extension: "cpp",  name: "C++" },
  csharp:     { id: "csharp",     icon: "🟣", extension: "cs",   name: "C#" },
  ruby:       { id: "ruby",       icon: "💎", extension: "rb",   name: "Ruby" },
  go:         { id: "go",         icon: "🐹", extension: "go",   name: "Go" },
  rust:       { id: "rust",       icon: "🦀", extension: "rs",   name: "Rust" },
  json:       { id: "json",       icon: "📋", extension: "json", name: "JSON" },
  markdown:   { id: "markdown",   icon: "📝", extension: "md",   name: "Markdown" },
  bash:       { id: "bash",       icon: "🐚", extension: "sh",   name: "Bash" },
  shell:      { id: "bash",       icon: "🐚", extension: "sh",   name: "Bash" },
  php:        { id: "php",        icon: "🐘", extension: "php",  name: "PHP" },
  sql:        { id: "sql",        icon: "🐬", extension: "sql",  name: "SQL" },
  xml:        { id: "xml",        icon: "📝", extension: "xml",  name: "XML" },
  yaml:       { id: "yaml",       icon: "⚙️", extension: "yaml", name: "YAML" },
  swift:      { id: "swift",      icon: "🍊", extension: "swift",name: "Swift" },
  kotlin:     { id: "kotlin",     icon: "🟣", extension: "kt",   name: "Kotlin" },
};

function get(id: string): LangInfo {
  return MAP[id] ?? FALLBACK;
}

/**
 * Heuristics-first detection before falling back to hljs.highlightAuto.
 * Returns null to signal "let hljs decide".
 */
function detectByHeuristics(code: string): LangInfo | null {
  const trimmed = code.trim();

  // JSON — try parsing directly
  if (/^[\[{"]/.test(trimmed)) {
    try {
      JSON.parse(trimmed);
      return get("json");
    } catch {
      // not JSON
    }
  }

  // HTML
  if (/^\s*<!DOCTYPE\s+html/i.test(trimmed) || /^\s*<html/i.test(trimmed)) return get("html");
  if (/<\/?(div|span|p|a|img|h[1-6]|ul|ol|li|table|form|input|body|head)\b/i.test(trimmed)) return get("html");

  // XML
  if (/^<\?xml/.test(trimmed)) return get("xml");

  // SCSS variable
  if (/^\s*\$[\w-]+\s*:/.test(trimmed)) return get("scss");

  // CSS — selector + rule block
  if (/[.#]?[\w-]+\s*\{[\s\S]*:[\s\S]*;\s*\}/.test(trimmed)) return get("css");

  // YAML — key: value pattern without = or ;
  if (/^[\w-]+:\s+\S/.test(trimmed) && !trimmed.includes(";") && !trimmed.includes("=")) {
    const lines = trimmed.split("\n");
    const yamlLines = lines.filter((l) => /^[\s\-]*[\w-]+:\s/.test(l)).length;
    if (yamlLines >= Math.min(lines.length, 2)) return get("yaml");
  }

  // Markdown
  const mdScore =
    (/^#{1,6}\s+/m.test(trimmed) ? 2 : 0) +
    (/^[-*]\s+/m.test(trimmed) ? 1 : 0) +
    (/\*\*.+\*\*/m.test(trimmed) ? 1 : 0) +
    (/^```/m.test(trimmed) ? 2 : 0) +
    (/\[.+\]\(.+\)/m.test(trimmed) ? 2 : 0);
  if (mdScore >= 2) return get("markdown");

  // SQL
  if (/\b(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|FROM|WHERE|JOIN)\b/i.test(trimmed)) return get("sql");

  // Bash / Shell
  if (/^#!\/.*sh/.test(trimmed) || /^\s*(echo|export|cd|ls|grep|awk|sed|chmod)\s/m.test(trimmed)) return get("bash");

  // Python
  if (
    /^\s*def\s+\w+\s*\(/m.test(trimmed) ||
    /^\s*import\s+\w/m.test(trimmed) ||
    /^\s*class\s+\w+[:(]/m.test(trimmed)
  ) return get("python");

  // TypeScript-specific
  if (
    /:\s*(string|number|boolean|void|any|never|unknown)\b/.test(trimmed) ||
    /\binterface\s+\w+/.test(trimmed) ||
    /\btype\s+\w+\s*=/.test(trimmed)
  ) return get("typescript");

  // JavaScript
  if (
    /\b(const|let|var)\s+\w+\s*=/.test(trimmed) ||
    /\bfunction\s+\w+\s*\(/.test(trimmed) ||
    /=>\s*[{(]/.test(trimmed) ||
    /console\.(log|error|warn)/.test(trimmed)
  ) return get("javascript");

  // C# vs Java
  if (/\bpublic\s+(static\s+)?(void|class|int|String|bool)\b/.test(trimmed)) {
    return /\busing\s+System/.test(trimmed) ? get("csharp") : get("java");
  }

  // PHP
  if (/^<\?php/i.test(trimmed) || /\$\w+\s*=/.test(trimmed)) return get("php");

  // Plain-text heuristic: low ratio of code-like characters
  const lines = trimmed.split("\n");
  const codeLikeLines = lines.filter((l) => /[{}()\[\];=<>]/.test(l)).length;
  if (codeLikeLines / lines.length < 0.15 && trimmed.length > 20) return FALLBACK;

  return null;
}

/** Languages that hljs.highlightAuto frequently misidentifies */
const HLJS_BLOCKLIST = new Set([
  "ebnf", "abnf", "bnf", "1c", "axapta", "routeros",
  "taggerscript", "tcl", "gams", "accesslog", "capnproto",
  "dos", "livescript", "livecodeserver", "clean", "mercury",
  "isbl", "inform7", "lasso", "mel", "processing",
  "thrift", "reasonml", "pony", "angelscript",
]);

export function detectLanguage(code: string): LangInfo {
  if (!code.trim()) return FALLBACK;

  const heuristic = detectByHeuristics(code);
  if (heuristic) return heuristic;

  const result = hljs.highlightAuto(code);
  const lang = result.language ?? "";
  const relevance = result.relevance ?? 0;

  if (!lang || HLJS_BLOCKLIST.has(lang) || relevance < 5) {
    return FALLBACK;
  }

  return MAP[lang] ?? FALLBACK;
}

export function highlightCode(code: string): string {
  if (!code.trim()) return "";
  return hljs.highlightAuto(code).value;
}
