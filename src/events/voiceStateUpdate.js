import { AUTO_JOIN_GUILD_ID } from "../config.js";
import { isRealDevice, scheduleRejoin } from "../utils/voice.js";
import chalk from "chalk";
import moment from "moment-timezone";

moment.tz.setDefault("Asia/Jakarta");

export default async function voiceStateUpdate(client, oldState, newState) {
  if (!newState.guild && !oldState.guild) return;

  const guild = newState.guild || oldState.guild;
  if (guild.id !== AUTO_JOIN_GUILD_ID) return;

  const userId = newState.user?.id || oldState.user?.id;
  if (userId !== client.user.id) return;

  const left = oldState.channel && !newState.channel;
  const joined = !oldState.channel && newState.channel;
  const sameChannel =
    oldState.channel &&
    newState.channel &&
    oldState.channel.id === newState.channel.id;

  if (joined || sameChannel) {
    if (isRealDevice(client, newState)) {
      console.log(
        chalk.hex('#71717A')(`[${moment().format("HH:mm")}]`),
        chalk.hex('#60A5FA').underline(client.user.username),
        chalk.hex('#F59E0B')("Real device joined — standing by"),
      );

      client.realDeviceInVC = true;
      client.InVC = false;

      if (client.rejoinTimeout) {
        clearTimeout(client.rejoinTimeout);
        client.rejoinTimeout = null;

        console.log(
          chalk.hex('#71717A')(`[${moment().format("HH:mm")}]`),
          chalk.hex('#60A5FA').underline(client.user.username),
          chalk.hex('#F59E0B')("Rejoin cancelled — real device took over"),
        );
      }
    }
  }

  if (left) {
    if (oldState.selfDeaf === false) {
      console.log(
        chalk.hex('#71717A')(`[${moment().format("HH:mm")}]`),
        chalk.hex('#60A5FA').underline(client.user.username),
        chalk.hex('#F59E0B')("Real device left — rejoining in 3s.."),
      );

      client.realDeviceInVC = false;
      scheduleRejoin(client);
    } else if (oldState.selfDeaf === true && !client.realDeviceInVC) {
      console.log(
        chalk.hex('#71717A')(`[${moment().format("HH:mm")}]`),
        chalk.hex('#60A5FA').underline(client.user.username),
        chalk.hex('#F59E0B')("Selfbot disconnected — rejoining in 3s..."),
      );

      scheduleRejoin(client);
    }
  }
}
