import * as React from 'react';
import * as styles from './cssStyles';
import { cx } from 'emotion';
import { TabItem } from '../tabWindow';

const emptyFavIconStyle = cx(styles.headerButton, styles.emptyFavIcon);
const favIconOpenStyle = styles.favIcon;
const favIconClosedStyle = cx(styles.favIcon, styles.favIconClosed);

let cachedIsExtension: boolean | undefined = undefined;

const inExtension = (): boolean => {
    if (cachedIsExtension === undefined) {
        const details = (chrome as any).app.getDetails();
        cachedIsExtension = details !== null;
    }
    return cachedIsExtension;
};

export const mkFavIcon = (tab: TabItem) => {
    const favIconStyle = tab.open ? favIconOpenStyle : favIconClosedStyle;
    let fiSrc: string = '';

    // Can only use 'chrome://favicon' from inside an extension apparently
    // But we still want to render FavIcons in non-extension rendering test
    if (!inExtension()) {
        const favIconUrl = tab.open ? tab.openState!.favIconUrl : null;
        fiSrc = favIconUrl ? favIconUrl : '';
    } else {
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
