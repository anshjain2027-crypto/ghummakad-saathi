import { describe, expect, test } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Markdown } from "@/components/markdown";

const render = (source: string) => renderToStaticMarkup(createElement(Markdown, { source }));

describe("blog markdown", () => {
  test("renders an image with its italic caption line", () => {
    const html = render("![Amber Fort courtyard](/blog/a/amber.jpg)\n*Photo: Someone, CC BY-SA 4.0*");
    expect(html).toContain('<img src="/blog/a/amber.jpg" alt="Amber Fort courtyard"');
    expect(html).toContain("<figcaption");
    expect(html).toContain("Photo: Someone, CC BY-SA 4.0");
  });

  test("renders mp4 links as a video player", () => {
    const html = render("![Our 30-second intro](/blog/a/intro.mp4)");
    expect(html).toContain('<video src="/blog/a/intro.mp4"');
    expect(html).not.toContain("<img");
  });

  test("never renders media from unsafe sources", () => {
    for (const src of ["javascript:alert(1)", "data:image/png;base64,AAAA", "//evil.example/x.jpg", "http://plain.example/x.jpg"]) {
      const html = render(`![x](${src})`);
      expect(html).not.toContain("<img");
      expect(html).not.toContain("<video");
    }
  });

  test("renders pipe tables with a header row", () => {
    const html = render("| Days | Base |\n| --- | --- |\n| 1–3 | Delhi |\n| 4–5 | **Agra** |");
    expect(html).toContain("<table");
    expect(html).toContain("<th");
    expect(html).toContain("Delhi");
    expect(html).toContain("<strong>Agra</strong>");
  });

  test("a lone pipe line without a separator stays a paragraph", () => {
    expect(render("| not a table |")).toContain("<p");
  });
});
