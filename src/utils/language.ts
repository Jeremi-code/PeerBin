import hljs from "highlight.js";

export function detectLanguage(code: string) {
  if (!code.trim())
    return { id: "txt", name: "Text", icon: "📄", extension: "txt" };

  const result = hljs.highlightAuto(code);
  const lang = result.language || "txt";

  const map: Record<string, any> = {
    javascript: { icon: "🟨", extension: "js", name: "JavaScript" },
    typescript: { icon: "🟦", extension: "ts", name: "TypeScript" },
    html: { icon: "🟧", extension: "html", name: "HTML" },
    css: { icon: "🟦", extension: "css", name: "CSS" },
    python: { icon: "🐍", extension: "py", name: "Python" },
    java: { icon: "☕", extension: "java", name: "Java" },
    c: { icon: "🔵", extension: "c", name: "C" },
    cpp: { icon: "🔵", extension: "cpp", name: "C++" },
    csharp: { icon: "🟣", extension: "cs", name: "C#" },
    ruby: { icon: "💎", extension: "rb", name: "Ruby" },
    go: { icon: "🐹", extension: "go", name: "Go" },
    rust: { icon: "🦀", extension: "rs", name: "Rust" },
    json: { icon: "📋", extension: "json", name: "JSON" },
    markdown: { icon: "📝", extension: "md", name: "Markdown" },
    bash: { icon: "🐚", extension: "sh", name: "Bash" },
    php: { icon: "🐘", extension: "php", name: "PHP" },
    sql: { icon: "🐬", extension: "sql", name: "SQL" },
    xml: { icon: "📝", extension: "xml", name: "XML" },
    yaml: { icon: "⚙️", extension: "yaml", name: "YAML" },
  };

  return map[lang] || { icon: "📄", extension: lang, name: lang.toUpperCase() };
}

export function highlightCode(code: string) {
  if (!code.trim()) return "";
  return hljs.highlightAuto(code).value;
}
