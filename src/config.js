import { readFileSync, existsSync } from "fs";
import { join } from "path";

// ── Load per-account config from JSON ────────────────────
const accountsPath = join(process.cwd(), "accounts.config.json");
let accountCfg = {};

if (existsSync(accountsPath)) {
  try {
    const accounts = JSON.parse(readFileSync(accountsPath, "utf-8"));
    const idx = parseInt(process.env.ACCOUNT_INDEX || "0", 10);
    accountCfg = accounts[idx] || {};
  } catch {
    // fall through — empty defaults
  }
}

export const TOKEN = accountCfg.token || "";

export const AUTO_JOIN_GUILD_ID = accountCfg.autoJoinGuildId || "";

export const AUTO_JOIN_CHANNEL_ID = accountCfg.autoJoinChannelId || "";

export const SPOTIFY_CONNECTION_ID = accountCfg.spotifyConnectionId || "";

export const AUTOREAD_ENABLED = accountCfg.autoread ?? true;

export const AUTOREAD_EXCLUDED_GUILD_IDS =
  accountCfg.autoreadExcludedGuildIds || [];

export const EXCLUDED_GUILD_IDS = accountCfg.excludedGuildIds || [];
