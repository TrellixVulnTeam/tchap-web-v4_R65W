import { IOpts } from "matrix-react-sdk/src/createRoom";
import { ICreateRoomOpts } from "matrix-js-sdk/src/@types/requests";
import { HistoryVisibility, JoinRule, Preset, Visibility } from "matrix-js-sdk/src/@types/partials";

import { TchapRoomAccessRule, TchapRoomAccessRulesEventId, TchapRoomType } from "../@types/tchap";

export const DEFAULT_FEDERATE_VALUE = true;

/**
 * Build the room creation options
 * @param name name of the room
 * @param tchapRoomType type of room
 * @param federate is the room federated
 * @returns rooms options
 */
export default class TchapCreateRoom {
    static roomCreateOptions(
        name: string,
        tchapRoomType: TchapRoomType,
        federate: boolean = DEFAULT_FEDERATE_VALUE): IOpts {
        const opts: IOpts = {};
        const createRoomOpts: ICreateRoomOpts = {};
        opts.createOpts = createRoomOpts;

        //tchap common options
        createRoomOpts.name = name;
        opts.guestAccess = false; //guest access are not authorized in tchap

        createRoomOpts.creation_content = { 'm.federate': federate };
        createRoomOpts.initial_state = createRoomOpts.initial_state || [];

        switch (tchapRoomType) {
            case TchapRoomType.Forum: {
            //"Forum" only for tchap members and not encrypted
                createRoomOpts.visibility = Visibility.Public;
                createRoomOpts.preset = Preset.PublicChat;
                // Here we could have used createRoomOpts.accessRule directly,
                // but since accessRules are a custom Tchap event, it is ignored by later code.
                // So we use createRoomOpts.initial_state, which works properly.
                createRoomOpts.initial_state.push({
                    content: {
                        rule: TchapRoomAccessRule.Restricted,
                    },
                    type: TchapRoomAccessRulesEventId,
                    state_key: '',
                });

                opts.joinRule = JoinRule.Public;
                opts.encryption = false;
                opts.historyVisibility = HistoryVisibility.Shared;
                break;
            }
            case TchapRoomType.Private: {
            //"Salon", only for tchap member and encrypted
                createRoomOpts.visibility = Visibility.Private;
                createRoomOpts.preset = Preset.PrivateChat;
                createRoomOpts.initial_state.push({
                    content: {
                        rule: TchapRoomAccessRule.Restricted,
                    },
                    type: TchapRoomAccessRulesEventId,
                    state_key: '',
                });
                opts.joinRule = JoinRule.Invite;
                opts.encryption = true;
                opts.historyVisibility = HistoryVisibility.Invited;
                break;
            }
            case TchapRoomType.External: {
            //open to external and encrypted,
                createRoomOpts.visibility = Visibility.Private;
                createRoomOpts.preset = Preset.PrivateChat;
                createRoomOpts.initial_state.push({
                    content: {
                        rule: TchapRoomAccessRule.Unrestricted,
                    },
                    type: TchapRoomAccessRulesEventId,
                    state_key: '',
                });
                opts.joinRule = JoinRule.Invite;
                opts.encryption = true;
                opts.historyVisibility = HistoryVisibility.Invited;
                break;
            }
        }
        return opts;
    }
}
