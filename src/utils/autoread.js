import chalk from "chalk";
import moment from "moment-timezone";

moment.tz.setDefault("Asia/Jakarta");

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Mark every text channel in every guild as read,
 * skipping guilds listed in `autoreadExcludedGuildIds`.
 * Adds a small delay between acks to avoid rate-limits.
 */
export async function autoReadAll(client) {
  const { autoreadEnabled, autoreadExcludedGuildIds } = client.config;
  if (!autoreadEnabled) return;

  const excluded = new Set(autoreadExcludedGuildIds);
  const guilds = client.guilds.cache.filter((g) => !excluded.has(g.id));

  let total = 0;

  for (const guild of guilds.values()) {
    const textChannels = guild.channels.cache.filter(
      (ch) => ch.isText() && ch.lastMessageId && ch.viewable,
    );

    for (const channel of textChannels.values()) {
      try {
        await client.rest.post(
          `/channels/${channel.id}/messages/${channel.lastMessageId}/ack`,
          { body: { token: null } },
        );
        total++;
        await delay(350); // be gentle to API
      } catch {
        // skip channels we can't ack
      }
    }
  }

  if (total > 0) {
    console.log(
      chalk.hex("#71717A")(`[${moment().format("HH:mm")}]`),
      chalk.hex("#60A5FA").underline(client.user.username),
      chalk.hex("#22C55E")(`Auto-read ${total} channels`),
    );
  }
}
