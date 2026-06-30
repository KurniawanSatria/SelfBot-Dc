import figlet from "figlet";
import chalk from "chalk";
import { loadAccounts } from "./src/config.js";
import { startAllClients } from "./src/index.js";

const accounts = loadAccounts();
const line = "═".repeat(47);

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

console.log(chalk.hex("#6C8CFF")(banner));
console.log(chalk.hex("#4B5563")(line));
console.log(chalk.hex("#A1A1AA")("Author: Saturiaaa."));
console.log(chalk.hex("#22C55E")("Version: 1.0.0"));
console.log(chalk.hex("#FACC15")(`Accounts: ${accounts.length}`));
console.log(chalk.hex("#4B5563")(line));

startAllClients(accounts).catch((err) => {
  console.error(chalk.hex("#EF4444")("Failed:", err));
  process.exit(1);
});