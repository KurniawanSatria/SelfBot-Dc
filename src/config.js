import { readFileSync, existsSync } from "fs";
import { join } from "path";

const accountsPath = join(process.cwd(), "accounts.config.json");

export function loadAccounts() {
  if (!existsSync(accountsPath)) return [];
  try {
    return JSON.parse(readFileSync(accountsPath, "utf-8"));
  } catch {
    return [];
  }
}
