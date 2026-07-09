import { join } from "path";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";

// TODO switch to use teleproto

let filename = "session.txt";

export function getSessionText(options: { session_dir: string }) {
  let dir = options.session_dir;
  let file = join(dir, filename);
  if (existsSync(file)) {
    return readFileSync(file, "utf-8").trim() || null;
  }
  return null;
}

export function saveSessionText(options: {
  session_dir: string;
  session_text: string;
}) {
  let dir = options.session_dir;
  mkdirSync(dir, { recursive: true });
  let file = join(dir, filename);
  writeFileSync(file, options.session_text.trim() + "\n");
}
