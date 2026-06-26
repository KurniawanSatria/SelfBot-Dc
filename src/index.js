import { Client } from "discord.js-selfbot-v13";
import { TOKEN } from "./config.js";
import ready from "./events/ready.js";
import voiceStateUpdate from "./events/voiceStateUpdate.js";
import unhandledPacket from "./events/unhandledPacket.js";

export function createClient() {
  const client = new Client();

  client.InVC = false;
  client.realDeviceInVC = false;
  client.rejoinTimeout = null;

  client.on("ready", (...args) => ready(client, ...args));
  client.on("voiceStateUpdate", (...args) => voiceStateUpdate(client, ...args));
  client.on("unhandledPacket", (...args) => unhandledPacket(client, ...args));

  return client;
}

export async function startClient() {
  const client = createClient();
  await client.login(TOKEN);
  return client;
}
