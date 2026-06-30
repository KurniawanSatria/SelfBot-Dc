import { fork } from "child_process";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import figlet from "figlet";
import chalk from "chalk";

const accountsPath = join(process.cwd(), "accounts.config.json");
const accounts = existsSync(accountsPath)
  ? JSON.parse(readFileSync(accountsPath, "utf-8"))
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
console.log(chalk.hex("#FACC15")(`Accounts: ${accounts.length}`));
console.log(chalk.hex("#4B5563")(line));

accounts.forEach((account, i) => {
  fork("./bot.js", [], {
    env: {
      ...process.env,
      ACCOUNT_INDEX: String(i),
    },
  });
});