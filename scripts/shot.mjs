// Usage: node scripts/shot.mjs <path> <out.png> [width] [fullPage]
import { chromium } from "playwright-core";
const [, , path = "/", out = "shot.png", width = "1440", full = "1"] = process.argv;
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? "/tmp/chromium", args: ["--no-sandbox", "--single-process", "--no-zygote"] });
const p = await b.newPage({ viewport: { width: Number(width), height: Number(width) < 600 ? 800 : 900 } });
p.on("pageerror", (e) => console.log("PAGEERROR", e.message));
p.on("console", (m) => m.type() === "error" && console.log("CONSOLE", m.text().slice(0, 300)));
await p.goto(`http://localhost:3000${path}`, { waitUntil: "networkidle", timeout: 60000 }).catch((e) => console.log("nav", e.message));
await p.waitForTimeout(800);
await p.screenshot({ path: out, fullPage: full === "1" });
await b.close();
