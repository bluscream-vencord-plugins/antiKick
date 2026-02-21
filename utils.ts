import { Channel } from "@vencord/discord-types";
import { PermissionsBits, PermissionStore, VoiceStateStore } from "@webpack/common";

export function isChannelJoinable(channel: Channel): boolean {
    if (!channel) return false;

    // Check CONNECT permission
    if (!PermissionStore.can(PermissionsBits.CONNECT, channel)) return false;

    // Check if full
    if (channel.userLimit > 0) {
        const voiceStates = VoiceStateStore.getVoiceStatesForChannel(channel.id);
        const memberCount = voiceStates ? Object.keys(voiceStates).length : 0;
        if (memberCount >= channel.userLimit && !PermissionStore.can(PermissionsBits.MOVE_MEMBERS, channel)) {
            return false;
        }
    }

    return true;
}
