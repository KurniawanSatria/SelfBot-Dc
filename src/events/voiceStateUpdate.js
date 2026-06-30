import { AUTO_JOIN_GUILD_ID, AUTO_JOIN_CHANNEL_ID } from "../config.js";
import { scheduleRejoin } from "../utils/voice.js";
import chalk from "chalk";
import moment from "moment-timezone";

moment.tz.setDefault("Asia/Jakarta");

export default async function voiceStateUpdate(client, oldState, newState) {
  if (!newState.guild && !oldState.guild) return;

  const guild = newState.guild || oldState.guild;
  if (guild.id !== AUTO_JOIN_GUILD_ID) return;

  const userId = newState.user?.id || oldState.user?.id;
  const targetId = AUTO_JOIN_CHANNEL_ID;

  // ── OTHER user ── detect real device join/leave ──────
  if (userId !== client.user.id) {
    const joinedTarget =
      newState.channelId === targetId && oldState.channelId !== targetId;
    const leftTarget =
      oldState.channelId === targetId && newState.channelId !== targetId;

    // Real device (selfDeaf === false) joined target channel
    if (joinedTarget && newState.selfDeaf === false) {
      // Already tracked — skip stale initial-sync event
      if (client.realDeviceInVC) return;

      console.log(
        chalk.hex('#71717A')(`[${moment().format("HH:mm")}]`),
        chalk.hex('#60A5FA').underline(client.user.username),
        chalk.hex('#F59E0B')("Real device joined — standing by"),
      );

      client.realDeviceInVC = true;

      // Disconnect bot if it's in the target channel
      if (client.InVC) {
        const botState = guild.voiceStates.cache.get(client.user.id);
        if (botState?.channelId === targetId) {
          botState.disconnect();
          client.InVC = false;
        }
      }

      // Cancel pending rejoin
      if (client.rejoinTimeout) {
        clearTimeout(client.rejoinTimeout);
        client.rejoinTimeout = null;
      }
      return;
    }

    // Real device left target channel
    if (leftTarget && oldState.selfDeaf === false) {
      // Double-check no other real device still present
      const stillPresent = guild.voiceStates.cache.some(
        (vs) =>
          vs.channelId === targetId &&
          vs.member?.id !== client.user.id &&
          vs.selfDeaf === false,
      );

      if (!stillPresent) {
        console.log(
          chalk.hex('#71717A')(`[${moment().format("HH:mm")}]`),
          chalk.hex('#60A5FA').underline(client.user.username),
          chalk.hex('#F59E0B')("Real device left — rejoining in 3s.."),
        );

        client.realDeviceInVC = false;
        scheduleRejoin(client);
      }
      return;
    }

    return;
  }

  // ── BOT's own voice state ─────────────────────────────
  const left = oldState.channelId && !newState.channelId;
  const joined = !oldState.channelId && newState.channelId;

  if (left) {
    client.InVC = false;

    if (!client.realDeviceInVC) {
      console.log(
        chalk.hex('#71717A')(`[${moment().format("HH:mm")}]`),
        chalk.hex('#60A5FA').underline(client.user.username),
        chalk.hex('#F59E0B')("Disconnected — rejoining in 3s..."),
      );
      scheduleRejoin(client);
    }
  }

  if (joined) {
    client.InVC = true;
  }
}
