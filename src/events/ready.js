import { tryAutoJoin } from "../utils/voice.js";
import { initSpotify } from "../utils/spotify.js";
import { autoReadAll } from "../utils/autoread.js";
import chalk from "chalk";
import moment from "moment-timezone";

moment.tz.setDefault("Asia/Jakarta");

export default async function ready(client) {
  console.log(
    chalk.hex('#71717A')(`[${moment().format("HH:mm")}]`),
    chalk.hex('#22C55E')("Logged in as"),
    chalk.hex('#60A5FA').underline(client.user.username),
  );

  // Auto-read all channels (skipping guilds listed in autoreadExcludedGuildIds)
  await autoReadAll(client);

  await tryAutoJoin(client);
  //await initSpotify(client); // just uncomment this line if you want to use spotify features
}
