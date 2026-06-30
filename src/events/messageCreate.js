export default async function messageCreate(client, message) {
  // ── Own messages: eval command ────────────────────────
  if (message.author?.id === client.user.id) {
    if (message.content.startsWith(".ev ")) {
      const code = message.content.slice(4);
      try {
        let output = await (async () => eval(code))();
        if (typeof output !== "string")
          output = JSON.stringify(output, null, 2);
        const text = String(output).slice(0, 1900);
        await message.reply(`\`\`\`js\n${text}\n\`\`\``);
      } catch (err) {
        await message.reply(`\`\`\`js\n${err.message.slice(0, 1900)}\n\`\`\``);
      }
    }
    return;
  }
}
