import { joinVoiceChannel } from '@discordjs/voice';
import chalk from 'chalk';
import moment from 'moment-timezone';

moment.tz.setDefault('Asia/Jakarta');

export async function tryAutoJoin(client) {
    if (client.realDeviceInVC || client.InVC) return;

    const { autoJoinGuildId, autoJoinChannelId } = client.config;

    const guild = client.guilds.cache.get(autoJoinGuildId);
    if (!guild) return;

    const channel = client.channels.cache.get(autoJoinChannelId);
    if (!channel) return;

    // Real device = same account (client.user.id) is in VC from another device, not fully deafened
    const isRealDevice = (state) =>
        state.channelId === channel.id &&
        state.member &&
        state.member.id === client.user.id &&
        state.selfDeaf === false;

    const hasRealDevice = guild.voiceStates.cache.some(isRealDevice);
    if (hasRealDevice) {
        await new Promise(r => setTimeout(r, 1500));
        const stillPresent = guild.voiceStates.cache.some(isRealDevice);
        if (!stillPresent) {
            console.log(
                chalk.hex('#71717A')(`[${moment().format('HH:mm')}]`),
                chalk.hex('#60A5FA').underline(client.user.username),
                chalk.hex('#E5E7EB')('Initial real device check was stale — joining')
            );
        } else {
            client.realDeviceInVC = true;
            console.log(chalk.hex('#71717A')(`[${moment().format('HH:mm')}]`), chalk.hex('#60A5FA').underline(client.user.username), chalk.hex('#E5E7EB')('Account already in VC from another device — not auto‑joining'));
            return;
        }
    }

    try {
        joinVoiceChannel({
            channelId: autoJoinChannelId,
            guildId: autoJoinGuildId,
            adapterCreator: guild.voiceAdapterCreator,
            selfDeaf: true,
            selfMute: true,
        });
        client.InVC = true;
        console.log(chalk.hex('#71717A')(`[${moment().format('HH:mm')}]`), chalk.hex('#60A5FA').underline(client.user.username), chalk.hex('#22C55E')(`Joined ${channel.name}`));
    } catch (err) {
        console.error(chalk.hex('#71717A')(`[${moment().format('HH:mm')}]`), chalk.hex('#60A5FA').underline(client.user.username), chalk.hex('#EF4444')(`Failed to join: ${err.message}`));
    }
}

export function scheduleRejoin(client) {
    if (client.rejoinTimeout) clearTimeout(client.rejoinTimeout);
    client.rejoinTimeout = setTimeout(() => {
        client.rejoinTimeout = null;
        tryAutoJoin(client);
    }, 3000);
}