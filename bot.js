import { startClient } from "./src/index.js";
import chalk from "chalk";
import moment from "moment-timezone";

moment.tz.setDefault("Asia/Jakarta");

startClient().catch((err) => {
  if (err?.code === "TOKEN_INVALID") {
    console.error(
      chalk.hex('#71717A')(`[${moment.tz("Asia/Jakarta").format("HH:mm")}]`),
      chalk.hex('#EF4444')("[TOKEN_INVALID] Invalid token provided."),
    );
    process.exit(1);
  }
  console.error(
    chalk.hex('#71717A')(`[${moment.tz("Asia/Jakarta").format("HH:mm")}]`),
    chalk.hex('#EF4444')("Failed to start bot:", err),
  );
  process.exit(1);
});
