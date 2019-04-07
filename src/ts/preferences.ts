/*
 * Serializable, immutable user preferences
 */
import log from 'loglevel';
import defaultsDeep from 'lodash/defaultsDeep';
import * as Immutable from 'immutable';
const _ = {
    defaultsDeep
};
type VersionedObject = {
    version: number;
    contents: any;
};
export const PREFS_VERSION = 6;

interface PreferencesProps {
    popoutOnStart: boolean; // show popout on startup?
    dedupeTabs: boolean; // close tab if URL matches existing tab
    revertOnOpen: boolean; // revert to anchor tabs when opening saved window
    theme: string;
}

const defaultPreferencesProps: PreferencesProps = {
    popoutOnStart: false,
    dedupeTabs: false,
    revertOnOpen: true,
    theme: 'light'
};

export class Preferences extends Immutable.Record(defaultPreferencesProps) {
    static deserialize(blob: string | undefined | null): Preferences {
        let jsPrefs: any = defaultPrefsJS;

        if (blob != null) {
            const storedPrefsObj = JSON.parse(blob);
            jsPrefs = migrate(storedPrefsObj);
        }

        return new Preferences(jsPrefs);
    }

    serialize(): string {
        const jsPrefs = this.toJS();
        const serPrefs: VersionedObject = {
            version: PREFS_VERSION,
            contents: jsPrefs
        };
        return JSON.stringify(serPrefs);
    }
}
export const defaultPrefsJS = new Preferences().toJS();
/*
 * migrate a potentially older version of preferences
 * Takes a VersionedObject as input, returns a JS encoded version of
 * preferences
 */

export const migrate = (storedPrefs: VersionedObject): Object => {
    if (storedPrefs.version < 2) {
        log.warn('prefs.migrate: reverting v1 preferences');
        return defaultPrefsJS;
    } // otherwise, just grab contents, which should be a JS store of preferences:

    const jsPrefs = storedPrefs.contents; // should be an identity op, but just in case:

    const userJSPrefs = _.defaultsDeep(jsPrefs, defaultPrefsJS);

    return userJSPrefs;
};
