import * as React from 'react';
import * as styles from './cssStyles';
import { cx } from 'emotion';
import { TabItem } from '../tabWindow';
import * as utils from '../utils';

const emptyFavIconStyle = cx(styles.headerButton, styles.emptyFavIcon);
const favIconOpenStyle = styles.favIcon;
const favIconClosedStyle = cx(styles.favIcon, styles.favIconClosed);

let cachedIsExtension: boolean | undefined = undefined;

const inExtension = (): boolean => {
    if (cachedIsExtension === undefined) {
        const app = (chrome as any).app;
        if (app === undefined) {
            return false; // should only happen when testing under jest
        }
        const details = app.getDetails();
        cachedIsExtension = details !== null;
    }
    return cachedIsExtension;
};

const httpFavIconUrl = (url: string | null): string => {
    let fiSrc = '';
    if (url) {
        const urlinfo = utils.parseURL(url);
        if (urlinfo.host) {
            fiSrc = 'https://www.google.com/s2/favicons?domain=' + urlinfo.host;
        }
    }
    return fiSrc;
};

export const mkFavIcon = (tab: TabItem) => {
    const favIconStyle = tab.open ? favIconOpenStyle : favIconClosedStyle;
    let fiSrc: string = '';

    // Can only use 'chrome://favicon' from inside an extension apparently
    // But we still want to render FavIcons in non-extension rendering test
    if (!inExtension()) {
        // Let's always use the external source for consistency and to avoid
        // CORS issues:
        /*
        const favIconUrl = tab.open ? tab.openState!.favIconUrl : null;
        if (favIconUrl) {
            fiSrc = favIconUrl;
        } else {
            fiSrc = httpFavIconUrl(tab.url);
        }
        */
        fiSrc = httpFavIconUrl(tab.url);
    } else {
        // 26Nov19: We seem to be getting weird hangs on reload,
        // along with Errors about XSS issues and cookies.
        // I suspected it might be due to chrome://favicon, so
        // tried using the the explicit google.com location, but
        // that didn't help, so back to chrome://favicon it is...
        // Also noticing that for certain domains, the google lookup
        // just yields a placeholder FavIcon, while chrome://favicon
        // seems to be more reliable...
        // fiSrc = httpFavIconUrl(tab.url);
        fiSrc = 'chrome://favicon/size/16/' + tab.url;
    }

    // Skip the chrome FAVICONs; they just throw when accessed.
    if (fiSrc.indexOf('chrome://theme/') === 0) {
        fiSrc = '';
    }

    const emptyFavIcon = <div className={emptyFavIconStyle} />;
    const tabFavIcon =
        fiSrc.length > 0 ? (
            <img className={favIconStyle} src={fiSrc} />
        ) : (
            emptyFavIcon
        );
    return tabFavIcon;
};
