import { log } from './globals';
import { produce, immerable } from 'immer';
import defaultsDeep from 'lodash/defaultsDeep';

const _ = {
    defaultsDeep,
};

type VersionedObject = {
    version: number;
    contents: any;
};

export const PREFS_VERSION = 7;
export const USER_PREFS_KEY = 'UserPreferences';

interface PreferencesProps {
    popoutOnStart: boolean;
    dedupeTabs: boolean;
    revertOnOpen: boolean;
    theme: string;
    layout: string;
    fontScaleFactor: number;
    sortOrder: 'alpha' | 'recent';
}

const defaultPreferencesProps: PreferencesProps = {
    popoutOnStart: false,
    dedupeTabs: false,
    revertOnOpen: true,
    theme: 'light',
    layout: 'normal',
    fontScaleFactor: 0.75,
    sortOrder: 'recent',
};

export class Preferences {
    [immerable] = true;

    popoutOnStart: boolean;
    dedupeTabs: boolean;
    revertOnOpen: boolean;
    theme: string;
    layout: string;
    fontScaleFactor: number;
    sortOrder: 'alpha' | 'recent';

    private constructor() {
        this.popoutOnStart = defaultPreferencesProps.popoutOnStart;
        this.dedupeTabs = defaultPreferencesProps.dedupeTabs;
        this.revertOnOpen = defaultPreferencesProps.revertOnOpen;
        this.theme = defaultPreferencesProps.theme;
        this.layout = defaultPreferencesProps.layout;
        this.fontScaleFactor = defaultPreferencesProps.fontScaleFactor;
        this.sortOrder = defaultPreferencesProps.sortOrder;
    }

    static create(props: Partial<PreferencesProps> = {}): Preferences {
        return produce(new Preferences(), (draft) => {
            Object.assign(draft, defaultPreferencesProps, props);
        });
    }

    static update(
        preferences: Preferences,
        updates: Partial<PreferencesProps>,
    ): Preferences {
        return produce(preferences, (draft) => {
            Object.assign(draft, updates);
        });
    }

    static deserialize(blob: string | undefined | null): Preferences {
        let jsPrefs: any = defaultPrefsJS;

        if (blob != null) {
            const storedPrefsObj = JSON.parse(blob);
            jsPrefs = migrate(storedPrefsObj);
        }

        return Preferences.create(jsPrefs);
    }

    serialize(): string {
        const jsPrefs = this;
        const serPrefs: VersionedObject = {
            version: PREFS_VERSION,
            contents: jsPrefs,
        };
        return JSON.stringify(serPrefs);
    }

    static deserializeJS(jsPrefs: any): Preferences {
        return Preferences.create(jsPrefs);
    }
}

export const defaultPrefsJS = Preferences.create();

export const migrate = (storedPrefs: VersionedObject): PreferencesProps => {
    if (storedPrefs.version < 2) {
        log.warn('prefs.migrate: reverting v1 preferences');
        return defaultPreferencesProps;
    }

    const jsPrefs = storedPrefs.contents;
    const userJSPrefs = _.defaultsDeep(jsPrefs, defaultPreferencesProps);

    return userJSPrefs;
};
