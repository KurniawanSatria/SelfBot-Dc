import { fork } from "child_process";
import "dotenv/config";
import figlet from "figlet";
import chalk from "chalk";

const tokens = process.env.TOKEN?.split(",").map((t) => t.trim()) ?? [];
const spotifyConnectionIds = process.env.SPOTIFY_CONNECTION_IDS
  ? process.env.SPOTIFY_CONNECTION_IDS.split(",").map((id) => id.trim())
  : [];

console.clear();

const banner = await new Promise((resolve, reject) => {
  figlet.text(
    "SelfBot DC",
    {
      font: "Small",
      horizontalLayout: "fitted",
      verticalLayout: "default",
      width: process.stdout.columns || 200,
      whitespaceBreak: false,
    },
    (err, data) => {
      if (err) return reject(err);
      resolve(data);
    }
  );
});
const line = "═".repeat(47);

console.log(chalk.hex("#6C8CFF")(banner));
console.log(chalk.hex("#4B5563")(line));
console.log(chalk.hex("#A1A1AA")("Author: Saturiaaa."));
console.log(chalk.hex("#22C55E")("Version: 1.0.0"));
console.log(chalk.hex("#FACC15")(`Tokens: ${tokens.length}`));
console.log(chalk.hex("#4B5563")(line));

tokens.forEach((token, i) => {
  fork("./bot.js", [], {
    env: {
      ...process.env,
      TOKEN: token,
      SPOTIFY_CONNECTION_ID:
        spotifyConnectionIds[i] || spotifyConnectionIds[0] || "",
    },
  });
});