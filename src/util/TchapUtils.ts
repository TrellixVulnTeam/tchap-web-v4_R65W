import { MatrixClientPeg } from "matrix-react-sdk/src/MatrixClientPeg";
import SdkConfig from "matrix-react-sdk/src/SdkConfig";
import AutoDiscoveryUtils from "matrix-react-sdk/src/utils/AutoDiscoveryUtils";
import { ValidatedServerConfig } from "matrix-react-sdk/src/utils/ValidatedServerConfig";
import { findMapStyleUrl } from 'matrix-react-sdk/src/utils/location';

/**
 * Tchap utils.
 */

export default class TchapUtils {
    /**
         * Return a short value for getDomain().
         * @returns {string} The shortened value of getDomain().
         */
    static getShortDomain(): string {
        const cli = MatrixClientPeg.get();
        const baseDomain = cli.getDomain();
        const domain = baseDomain.split('.tchap.gouv.fr')[0].split('.').reverse().filter(Boolean)[0];

        return this.capitalize(domain) || 'Tchap';
    }

    /**
     * For the current user, get the room federation options.
     *
     * @returns { showRoomFederationOption: boolean, roomFederationDefault: boolean } options
     */
    static getRoomFederationOptions(): { showRoomFederationOption: boolean, roomFederationDefault: boolean } {
        const cli = MatrixClientPeg.get();
        const baseDomain = cli.getDomain();

        // Only show the federate switch to defense users : it's difficult to understand, so we avoid
        // displaying it unless it's really necessary.
        if (baseDomain === 'agent.intradef.tchap.gouv.fr') {
            return { showRoomFederationOption: true, roomFederationDefault: false };
        }

        return { showRoomFederationOption: false, roomFederationDefault: true };
    }

    /**
     * Capitalize a string.
     * @param {string} s The sting to capitalize.
     * @returns {string} The capitalized string.
     * @private
     */
    static capitalize(s: string): string {
        return s.charAt(0).toUpperCase() + s.slice(1);
    }

    static findHomeServerNameFromUrl = (url: string): string => {
        const homeServerList = SdkConfig.get()['homeserver_list'];
        const homeserver = homeServerList.find(homeServer => homeServer.base_url === url);
        return homeserver.server_name;
    };

    static randomHomeServer = () => {
        const homeServerList = SdkConfig.get()['homeserver_list'];
        return homeServerList[Math.floor(Math.random() * homeServerList.length)];
    };

    static fetchHomeserverForEmail = async (email: string): Promise<void | {base_url: string, server_name: string}> => {
        const randomHomeServer = this.randomHomeServer();
        const infoUrl = "/_matrix/identity/api/v1/info?medium=email&address=";
        return fetch(randomHomeServer.base_url + infoUrl + email)
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Could not find homeserver for this email');
                }
                return response.json();
            })
            .then(response => {
                // Never returns error : anything that doesn't match a homeserver (even invalid email) returns "externe".
                const serverUrl = "https://matrix." + response.hs;
                return {
                    base_url: serverUrl,
                    server_name: this.findHomeServerNameFromUrl(serverUrl),
                };
            })
            .catch((error) => {
                console.error('Could not find homeserver for this email', error);
                return;
            });
    };

    static makeValidatedServerConfig = (serverConfig): ValidatedServerConfig => {
        const discoveryResult = {
            "m.homeserver": {
                state: "SUCCESS",
                error: null,
                base_url: serverConfig.base_url,
                server_name: serverConfig.server_name,
            },
            "m.identity_server": {
                state: "SUCCESS",
                error: null,
                base_url: serverConfig.base_url, // On Tchap our Identity server urls and home server urls are the same
                server_name: serverConfig.server_name,
            },
        };
        const validatedServerConf = AutoDiscoveryUtils.buildValidatedConfigFromDiscovery(
            discoveryResult['m.homeserver'].server_name, discoveryResult);
        return validatedServerConf;
    };

    /**
     * Extract the name of the server from a home server address
     * @param serverName from "agent.dinum.beta.gouv.fr"
     * @returns to "Dinum"
     */
    static toFriendlyServerName = (serverName: string): string => {
        const serverUrl = "https://matrix." + serverName;
        const friendlyServerName = this.findHomeServerNameFromUrl(serverUrl);
        return this.capitalize(friendlyServerName);
    };

    /**
     * Ask the homeserver is cross signing is supported (async)
     * @returns Promise<true> is cross signing is supported by home server or false
     */
    static async isCrossSigningSupportedByServer(): Promise<boolean> {
        const cli = MatrixClientPeg.get();
        return cli.doesServerSupportUnstableFeature("org.matrix.e2e_cross_signing");
    }

    /**
     *
     * @returns true is a map tile server is present in config or wellknown.
     */
    static isMapConfigured(): boolean {
        try {
            findMapStyleUrl();
            return true;
        } catch (e) {
            return false;
        }
    }
}
