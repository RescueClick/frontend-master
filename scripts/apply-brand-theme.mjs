/**
 * One-off: map legacy #12B99C / #0ea688 to logo-aligned theme tokens.
 * Run: node scripts/apply-brand-theme.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.join(__dirname, "..", "src");

const replacements = [
  // Longer class patterns first
  ["hover:shadow-[#12B99C]/30", "hover:shadow-brand-primary/30"],
  ["hover:shadow-[#12B99C]/25", "hover:shadow-brand-primary/25"],
  ["shadow-[#12B99C]/35", "shadow-brand-primary/35"],
  ["shadow-[#12B99C]/30", "shadow-brand-primary/30"],
  ["shadow-[#12B99C]/25", "shadow-brand-primary/25"],
  ["shadow-[#12B99C]/20", "shadow-brand-primary/20"],
  ["via-[#12B99C]/35", "via-brand-primary/35"],
  ["via-[#12B99C]/30", "via-brand-primary/30"],
  ["from-[#12B99C]/30", "from-brand-primary/30"],
  ["from-[#12B99C]/25", "from-brand-primary/25"],
  ["from-[#12B99C]/10", "from-brand-primary/10"],
  ["bg-[#12B99C]/10", "bg-brand-primary/10"],
  ["bg-[#12B99C]/5", "bg-brand-primary/5"],
  ["hover:bg-[#12B99C]/10", "hover:bg-brand-primary/10"],
  ["hover:bg-[#12B99C]/5", "hover:bg-brand-primary/5"],
  ["from-[#12B99C] to-[#0ea688]", "from-brand-primary to-brand-primary-hover"],
  ["from-[#12B99C] to-[#0EA688]", "from-brand-primary to-brand-primary-hover"],
  ["text-[#7dd3c0]", "text-brand-primary-light"],
  ["text-[#12B99C]", "text-brand-primary"],
  ["bg-[#12B99C]", "bg-brand-primary"],
  ["border-[#12B99C]", "border-brand-primary"],
  ["hover:border-[#12B99C]", "hover:border-brand-primary"],
  ["from-[#12B99C]", "from-brand-primary"],
  ["to-[#12B99C]", "to-brand-primary"],
  ["via-[#12B99C]", "via-brand-primary"],
  ["ring-[#12B99C]", "ring-brand-primary"],
  ["hover:text-[#12B99C]", "hover:text-brand-primary"],
  ["hover:bg-[#12B99C]", "hover:bg-brand-primary"],
  ["hover:bg-[#0ea688]", "hover:bg-brand-primary-hover"],
  ["hover:bg-[#0EA688]", "hover:bg-brand-primary-hover"],
  ["hover:bg-[#0f4f28]", "hover:bg-brand-primary-hover"],
  ["bg-[#0ea688]", "bg-brand-primary-hover"],
  ["bg-[#0EA688]", "bg-brand-primary-hover"],
  ["to-[#0ea688]", "to-brand-primary-hover"],
  ["to-[#0EA688]", "to-brand-primary-hover"],
  ["from-[#0ea688]", "from-brand-primary-hover"],
  // Inline / style objects — CSS variables (match index.css :root)
  ['"#12B99C20"', '"color-mix(in srgb, var(--color-brand-primary) 12.5%, transparent)"'],
  ["'#12B99C20'", "'color-mix(in srgb, var(--color-brand-primary) 12.5%, transparent)'"],
  ['"#12B99C"', '"var(--color-brand-primary)"'],
  ["'#12B99C'", "'var(--color-brand-primary)'"],
  ['"#0ea688"', '"var(--color-brand-primary-hover)"'],
  ["'#0ea688'", "'var(--color-brand-primary-hover)'"],
  ['"#0EA688"', '"var(--color-brand-primary-hover)"'],
  ["'#0EA688'", "'var(--color-brand-primary-hover)'"],
];

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) {
      if (name === "node_modules" || name === "dist") continue;
      walk(full, files);
    } else if (/\.(jsx|js|tsx|ts|css)$/.test(name)) {
      files.push(full);
    }
  }
  return files;
}

let total = 0;
for (const file of walk(srcDir)) {
  let content = fs.readFileSync(file, "utf8");
  const orig = content;
  for (const [from, to] of replacements) {
    if (content.includes(from)) {
      content = content.split(from).join(to);
    }
  }
  if (content !== orig) {
    fs.writeFileSync(file, content, "utf8");
    total++;
  }
}
console.log(`Updated ${total} files.`);
