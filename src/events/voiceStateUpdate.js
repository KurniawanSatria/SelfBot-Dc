import { scheduleRejoin } from "../utils/voice.js";
import chalk from "chalk";
import moment from "moment-timezone";

moment.tz.setDefault("Asia/Jakarta");

export default async function voiceStateUpdate(client, oldState, newState) {
  if (!newState.guild && !oldState.guild) return;

  const { autoJoinGuildId } = client.config;

  const guild = newState.guild || oldState.guild;
  if (guild.id !== autoJoinGuildId) return;

  const userId = newState.user?.id || oldState.user?.id;

// ── OTHER user ── ignore, only care about same account ──
  if (userId !== client.user.id) {
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

  if (joined && client._voiceInitDone) {
    client.InVC = true;
  }
}
