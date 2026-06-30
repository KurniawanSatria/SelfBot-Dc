import { initSpotify } from "../utils/spotify.js";
import { autoReadAll } from "../utils/autoread.js";
import { registerSelfbotId } from "../utils/selfbotTracker.js";
import chalk from "chalk";
import moment from "moment-timezone";

moment.tz.setDefault("Asia/Jakarta");

export default async function ready(client) {
  // Register this account's user ID so other accounts
  // can recognise it as a selfbot (not a real device).
  registerSelfbotId(client.user.id);

  console.log(
    chalk.hex('#71717A')(`[${moment().format("HH:mm")}]`),
    chalk.hex('#22C55E')("Logged in as"),
    chalk.hex('#60A5FA').underline(client.user.username),
  );

  // Auto-read all channels
  await autoReadAll(client);

  // Spotify: uncomment to enable
  //await initSpotify(client);
}
