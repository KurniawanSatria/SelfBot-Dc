import { Client } from "discord.js-selfbot-v13";
import ready from "./events/ready.js";
import voiceStateUpdate from "./events/voiceStateUpdate.js";
import unhandledPacket from "./events/unhandledPacket.js";
import messageCreate from "./events/messageCreate.js";
import { tryAutoJoin } from "./utils/voice.js";

function createClient(accountConfig) {
  const client = new Client();

  // Attach per-account config so events/utilities don't need config.js imports
  client.config = {
    autoJoinGuildId: accountConfig.autoJoinGuildId || "",
    autoJoinChannelId: accountConfig.autoJoinChannelId || "",
    spotifyConnectionId: accountConfig.spotifyConnectionId || "",
    autoreadEnabled: accountConfig.autoread ?? true,
    autoreadExcludedGuildIds: accountConfig.autoreadExcludedGuildIds || [],
    excludedGuildIds: accountConfig.excludedGuildIds || [],
  };

  client.InVC = false;
  client.realDeviceInVC = false;
  client._voiceInitDone = false;
  client.rejoinTimeout = null;

  client.on("ready", (...args) => ready(client, ...args));
  client.on("voiceStateUpdate", (...args) => voiceStateUpdate(client, ...args));
  client.on("unhandledPacket", (...args) => unhandledPacket(client, ...args));
  client.on("messageCreate", (...args) => messageCreate(client, ...args));

  return client;
}

export async function startAllClients(accounts) {
  const clients = [];
  for (const accountConfig of accounts) {
    const client = createClient(accountConfig);
    try {
      await client.login(accountConfig.token);
      clients.push(client);
    } catch (err) {
      console.error(`Failed to login: ${err.message}`);
    }
  }

  // All accounts logged in — all selfbot IDs are now registered.
  // Reset stale flags and run tryAutoJoin for each client.
  for (const client of clients) {
    client.InVC = false;
    client.realDeviceInVC = false;
    try {
      await tryAutoJoin(client);
      client._voiceInitDone = true;
    } catch {}
  }

  return clients;
}
