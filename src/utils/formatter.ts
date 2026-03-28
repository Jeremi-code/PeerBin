import * as prettier from "prettier/standalone";
import parserBabel from "prettier/plugins/babel";
import parserEstree from "prettier/plugins/estree";
import parserTypescript from "prettier/plugins/typescript";
import parserHtml from "prettier/plugins/html";
import parserPostcss from "prettier/plugins/postcss";
import parserMarkdown from "prettier/plugins/markdown";

/** Maps detected language name → prettier parser name */
const langToParser: Record<string, string> = {
  JavaScript: "babel",
  TypeScript: "typescript",
  HTML: "html",
  CSS: "css",
  SCSS: "scss",
  JSON: "json",
  Markdown: "markdown",
};

const plugins = [
  parserBabel,
  parserEstree,
  parserTypescript,
  parserHtml,
  parserPostcss,
  parserMarkdown,
];

export async function formatCode(
  code: string,
  langName: string,
): Promise<{ result: string; error: string | null }> {
  const parser = langToParser[langName];
  if (!parser) {
    return { result: code, error: `No formatter for ${langName}` };
  }

  try {
    const result = await prettier.format(code, {
      parser,
      plugins,
      printWidth: 80,
      tabWidth: 2,
      useTabs: false,
      semi: true,
      singleQuote: false,
      trailingComma: "es5",
    });
    return { result, error: null };
  } catch (err: any) {
    return { result: code, error: err.message ?? "Format failed" };
  }
}
