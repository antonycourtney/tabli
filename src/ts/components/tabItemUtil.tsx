import * as React from 'react';
import * as styles from './cssStyles';
import { cx, css } from '@emotion/css';
import { TabItem } from '../tabWindow';
import * as utils from '../utils';
import { HEADER_BUTTON_SIZE } from './constants';
import { Theme } from './themeContext';
import * as svg from './svg';
import { inExtension } from '../utils';
import { initSimpleImg, SimpleImg } from 'react-simple-img';

const nodeEnv = process.env.NODE_ENV;

if (nodeEnv === 'development') {
    // only log errors in dev mode:
    initSimpleImg(undefined, undefined, true);
}

const emptyFavIconStyle = cx(styles.headerButton, styles.emptyFavIcon);
const favIconOpenStyle = styles.favIcon;
const favIconClosedStyle = cx(styles.favIcon, styles.favIconClosed);

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

const svgContainerStyle = css`
    width: 24px;
    height: 24px;
    overflow: hidden;
    fill: #888888;
`;
const emptyFavIcon = <div className={svgContainerStyle}>{svg.page}</div>;

export const mkFavIcon = (tab: TabItem): JSX.Element => {
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

        // 3Jul24: New URL format for Manifest V3:
        // fiSrc = 'chrome://favicon/size/16/' + utils.baseURL(tab.url);
        const extensionId = chrome.runtime.id;
        const tabUrl = utils.baseURL(tab.url);
        fiSrc = `chrome-extension://${extensionId}/_favicon/?pageUrl=${tabUrl}&size=16`;
    }

    // Skip the chrome FAVICONs; they just throw when accessed.
    if (fiSrc.indexOf('chrome://theme/') === 0) {
        fiSrc = '';
    }
    const tabFavIcon =
        fiSrc.length > 0 ? (
            <SimpleImg className={favIconStyle} importance="low" src={fiSrc} />
        ) : (
            emptyFavIcon
        );
    return tabFavIcon;
};
