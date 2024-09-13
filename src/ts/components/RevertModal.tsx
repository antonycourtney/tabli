import { log } from '../globals';
import * as React from 'react';
import * as Immutable from 'immutable';
import * as styles from './cssStyles';
import { cx } from '@emotion/css';

import * as Constants from './constants';

import * as Modal from './Modal';

import { TabWindow, TabItem } from '../tabWindow';
import { ThemeContext } from './themeContext';
import * as tabItemUtil from './tabItemUtil';
import TabManagerState from '../tabManagerState';
import { StateRef } from 'oneref';
import { useContext, useRef, useEffect } from 'react';
import * as tabWindowUtils from '../tabWindowUtils';
import { LayoutContext } from './LayoutContext';

/*
 * Modal dialog for reverting a bookmarked window
 */
interface RevertModalProps {
    tabWindow: TabWindow;
    onClose: () => void;
    onSubmit: (w: TabWindow) => void;
}

const RevertModal: React.FC<RevertModalProps> = ({
    tabWindow,
    onClose,
    onSubmit,
}: RevertModalProps) => {
    const theme = useContext(ThemeContext);
    const layout = useContext(LayoutContext);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
        if (e.keyCode === Constants.KEY_ESC) {
            // ESC key
            e.preventDefault();
            onClose();
        } else if (e.keyCode === Constants.KEY_ENTER) {
            handleSubmit(e);
        }
    };

    const handleSubmit = (e: React.BaseSyntheticEvent) => {
        e.preventDefault();
        onSubmit(tabWindow);
    };

    const renderItem = (tabItem: TabItem, idx: number) => {
        const tabFavIcon = tabItemUtil.mkFavIcon(tabItem);
        const tabOpenStyle = tabItem.open ? null : styles.closed(theme);
        var tabActiveStyle = tabItem.active ? styles.activeSpan : null;
        var tabTitleStyles = cx(
            styles.text,
            styles.simpleTabTitle,
            styles.noWrap,
            tabOpenStyle,
            tabActiveStyle,
        );
        const id = 'tabItem-' + idx;
        const tabItemStyle = styles.tabItem(theme, layout);
        return (
            <div key={id} className={cx(styles.noWrap, tabItemStyle)}>
                {tabFavIcon}
                <span className={tabTitleStyles}>{tabItem.title}</span>
                <div className={styles.spacer} />
            </div>
        );
    };

    const renderTabItems = (tabItems: Immutable.List<TabItem>) => {
        const itemElems = tabItems.map(renderItem);
        return <div className={styles.tabList}>{itemElems}</div>;
    };

    // Call removeOpenWindowState with snapshot=false to obtain tentative
    // reverted state
    const revertedTabWindow = tabWindowUtils.removeOpenWindowState(
        tabWindow,
        false,
    );
    const savedUrlsSet = Immutable.Set(
        revertedTabWindow.tabItems.map((ti) => ti.url),
    );

    const itemsToClose = tabWindow.tabItems.filter(
        (ti) => !savedUrlsSet.has(ti.url),
    );
    const closeItemsElem = renderTabItems(itemsToClose);

    const itemsToReload = tabWindow.tabItems.filter((ti) =>
        savedUrlsSet.has(ti.url),
    );
    const reloadItemsElem = renderTabItems(itemsToReload);

    var closeSection = null;
    if (itemsToClose.count() > 0) {
        closeSection = (
            <div>
                <p>The following tabs will be closed:</p>
                <div className={styles.simpleTabContainer}>
                    {closeItemsElem}
                </div>
                <br />
            </div>
        );
    }

    const defaultButtonRef = useRef<HTMLButtonElement | null>(null);

    useEffect(() => {
        log.debug('Revert modal effect handler: ', defaultButtonRef.current);
        if (defaultButtonRef.current) {
            defaultButtonRef.current.focus();
        }
    }, []);

    return (
        <Modal.Dialog title="Revert Saved Window?" onClose={onClose}>
            <Modal.Body>
                <div className={styles.dialogInfoContents}>
                    {closeSection}
                    <p>The following tabs will be reloaded:</p>
                    <div className={styles.simpleTabContainer}>
                        {reloadItemsElem}
                    </div>
                    <br />
                    <p>This action can not be undone.</p>
                </div>
                <div className={styles.dialogButtonRow}>
                    <button
                        type="button"
                        className="btn btn-primary tabli-dialog-button"
                        onClick={(e) => handleSubmit(e)}
                        ref={defaultButtonRef}
                        tabIndex={0}
                        onKeyDown={handleKeyDown}
                    >
                        OK
                    </button>
                    <button
                        type="button"
                        className="btn btn-default btn-light tabli-dialog-button"
                        onClick={onClose}
                        tabIndex={0}
                    >
                        Cancel
                    </button>
                </div>
            </Modal.Body>
        </Modal.Dialog>
    );
};

export default RevertModal;
