import { definePluginSettings } from "@api/Settings";
import { OptionType } from "@utils/types";

export const settings = definePluginSettings({
    antiVoiceChannelDisconnect: {
        type: OptionType.BOOLEAN,
        default: false,
        description: "Automatically rejoin voice channels when disconnected"
    },
    rejoinDelay: {
        type: OptionType.SLIDER,
        default: 0,
        description: "Delay in seconds before rejoining",
        markers: [0, 1, 2, 3, 4, 5, 10],
        stickToMarkers: true,
        int: true,
    }
});
