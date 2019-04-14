import * as React from 'react';
import * as styles from './cssStyles';
import { cx } from 'emotion';
import { TabItem } from '../tabWindow';

const emptyFavIconStyle = cx(styles.headerButton, styles.emptyFavIcon);
const favIconOpenStyle = styles.favIcon;
const favIconClosedStyle = cx(styles.favIcon, styles.favIconClosed);

export const mkFavIcon = (tab: TabItem) => {
    const favIconStyle = tab.open ? favIconOpenStyle : favIconClosedStyle;
    // const favIconUrl = tab.open ? tab.openState.favIconUrl : null
    // var fiSrc = favIconUrl ? favIconUrl : ''
    var fiSrc = 'chrome://favicon/size/16/' + tab.url;

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
