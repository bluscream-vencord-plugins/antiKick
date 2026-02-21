import definePlugin from "@utils/types";
import { pluginInfo } from "./info";
import { settings } from "./settings";
import { isChannelJoinable } from "./utils";
import { findByPropsLazy } from "@webpack";
import { ChannelStore, UserStore, Menu, React } from "@webpack/common";
import { Logger } from "@utils/Logger";

const logger = new Logger(pluginInfo.id, pluginInfo.color);
const { selectVoiceChannel } = findByPropsLazy("selectVoiceChannel", "selectChannel");

let rejoinTimeout: any = null;

export default definePlugin({
    ...pluginInfo,
    settings,

    toolboxActions() {
        const s = settings.use(["antiVoiceChannelDisconnect"]);

        return [
            <Menu.MenuCheckboxItem
                id="anti-kick-voice"
                label="Voice Channel"
                checked={s.antiVoiceChannelDisconnect}
                action={() => s.antiVoiceChannelDisconnect = !s.antiVoiceChannelDisconnect}
            />
        ];
    },

    start() {
        logger.info("AntiKick started");
    },

    stop() {
        if (rejoinTimeout) clearTimeout(rejoinTimeout);
    },

    flux: {
        VOICE_STATE_UPDATES({ voiceStates }: { voiceStates: any[] }) {
            if (!settings.store.antiVoiceChannelDisconnect) return;

            const me = UserStore.getCurrentUser();
            for (const state of voiceStates) {
                if (state.userId !== me.id) continue;

                // state.channelId is the NEW channel. If it's null, we disconnected.
                // state.oldChannelId is the OLD channel.
                if (!state.channelId && state.oldChannelId) {
                    const channelId = state.oldChannelId;
                    const channel = ChannelStore.getChannel(channelId);

                    if (!channel) continue;

                    logger.info(`Detected disconnect from ${channel.name} (${channelId}). Rejoining in ${settings.store.rejoinDelay}s...`);

                    if (rejoinTimeout) clearTimeout(rejoinTimeout);

                    rejoinTimeout = setTimeout(() => {
                        rejoinTimeout = null;

                         // Re-fetch channel to be sure
                         const currentChannel = ChannelStore.getChannel(channelId);
                         if (currentChannel && isChannelJoinable(currentChannel)) {
                             logger.info(`Rejoining ${currentChannel.name}...`);
                             selectVoiceChannel(currentChannel.id);
                         } else {
                             logger.warn(`Could not rejoin ${channelId}: Channel not found or not joinable.`);
                         }
                     }, settings.store.rejoinDelay * 1000);
                } else if (state.channelId && rejoinTimeout) {
                    // We joined somewhere else (or back), cancel planned rejoin
                    logger.info("Joined a channel, cancelling auto-rejoin.");
                    clearTimeout(rejoinTimeout);
                    rejoinTimeout = null;
                }
            }
        }
    }
});
