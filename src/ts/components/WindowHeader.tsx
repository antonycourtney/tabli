import * as log from 'loglevel';
import * as React from 'react';
import * as oneref from 'oneref';
import { mkUrl } from '../utils';
import * as actions from '../actions';
import * as Constants from './constants';
import { ThemeContext, Theme } from './themeContext';

import { cx, css } from 'emotion';
import * as styles from './cssStyles';
import * as svg from './svg';

import { HeaderButton } from './HeaderButton';
import { HeaderButtonSVG } from './HeaderButtonSVG';
import ExpanderButton from './ExpanderButton';
import HeaderCheckbox from './HeaderCheckbox';
import TabManagerState from '../tabManagerState';
import { TabWindow } from '../tabWindow';
import ModalActions from './modalActions';
import { useContext, useState, useCallback } from 'react';
import { StateRef } from 'oneref';

const titleInputStyle = cx(styles.text, styles.noWrap, styles.windowTitleInput);

const revertButtonBaseStyle = css({
    marginRight: '20px'
});
const revertButtonStyle = cx(styles.headerHoverVisible, revertButtonBaseStyle);

const editButtonBaseStyle = (theme: Theme) => css`
    -webkit-mask-image: url('../images/Edition-30.png');
    background-color: ${theme.headerButtonColor};
    margin-left: 4px;
    margin-right: 12px;
    &:hover {
        background-color: ${theme.headerButtonHover};
    }
`;

interface WindowHeaderProps {
    tabWindow: TabWindow;
    modalActions: ModalActions;
    initialTitle?: string;
    expanded: boolean;
    onExpand: (expand: boolean) => void;
    onClose: () => void;
    onOpen: () => void;
    onRevert: () => void;
    onItemSelected: () => void;
    stateRef: StateRef<TabManagerState>;
}

const WindowHeader: React.FunctionComponent<WindowHeaderProps> = ({
    stateRef,
    tabWindow,
    modalActions,
    initialTitle,
    expanded,
    onExpand,
    onRevert,
    onOpen,
    onClose,
    onItemSelected
}: WindowHeaderProps) => {
    const theme = useContext(ThemeContext);
    const [editingTitle, setEditingTitle] = useState(false);
    const [titleInput, setTitleInput] = useState<HTMLInputElement | null>(null);
    const titleInputRef = useCallback((titleElem: HTMLInputElement) => {
        setTitleInput(titleElem);
        if (titleElem) {
            window.setTimeout(() => {
                titleElem.setSelectionRange(0, windowTitle.length);
            }, 0);
        }
    }, []);
    const handleUnmanageClick = (
        event: React.MouseEvent<HTMLElement, MouseEvent>
    ) => {
        log.debug('unamange: ', tabWindow);
        event.preventDefault();
        actions.unmanageWindow(tabWindow, stateRef);
        event.stopPropagation();
    };

    const handleManageClick = (
        event: React.MouseEvent<HTMLElement, MouseEvent>
    ) => {
        log.debug('manage: ', tabWindow);
        event.preventDefault();
        modalActions.openSaveModal(tabWindow);

        event.stopPropagation();
    };

    const handleTitleRename = (
        event: React.MouseEvent<HTMLElement, MouseEvent>
    ) => {
        event.preventDefault();
        setEditingTitle(true);
        event.stopPropagation();
    };

    const handleTitleSubmit = (event: React.FormEvent<HTMLElement>) => {
        event.preventDefault();
        setEditingTitle(false);
        const ic = titleInput;
        if (ic) {
            const titleStr = ic.value;
            if (titleStr !== tabWindow.title) {
                actions.setWindowTitle(titleStr, tabWindow, stateRef);
            }
        }
        event.stopPropagation();
    };

    const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.keyCode === Constants.KEY_ESC) {
            // ESC key
            e.preventDefault();
            setEditingTitle(false);
        }
    };

    const managed = tabWindow.saved;
    const windowTitle = tabWindow.title;

    const checkTitle = managed
        ? 'Stop managing this window'
        : 'Save all tabs in this window';
    const checkOnClick = managed ? handleUnmanageClick : handleManageClick;
    const checkItem = (
        <HeaderCheckbox
            title={checkTitle}
            onClick={checkOnClick}
            value={managed}
        />
    );
    /*
    const revertButton = (
        <HeaderButton
            className={revertButtonStyle}
            visible={managed && tabWindow.open}
            title="Revert to bookmarked tabs (Close other tabs)"
            onClick={onRevert}
        />
    );
*/
    const revertButton = (
        <HeaderButtonSVG
            className={revertButtonStyle}
            svgClassName={styles.checkStyle(theme)}
            svgElem={svg.chevron}
            visible={managed && tabWindow.open}
            title="Revert to bookmarked tabs (Close other tabs)"
            onClick={onRevert}
        />
    );

    const editButtonStyle = cx(
        styles.headerButton,
        styles.headerHoverVisible,
        editButtonBaseStyle(theme)
    );

    const editButton = (
        <HeaderButton
            className={editButtonStyle}
            visible={managed && !editingTitle}
            title="Edit saved window title"
            onClick={handleTitleRename}
        />
    );

    const closeButton = (
        <HeaderButtonSVG
            className={styles.headerHoverVisible}
            svgElem={svg.closeIcon}
            visible={tabWindow.open}
            title="Close Window"
            onClick={onClose}
        />
    );

    // log.log("WindowHeader: ", windowTitle, openStyle, managed, expanded)
    let titleComponent = null;
    if (editingTitle) {
        titleComponent = (
            <form onSubmit={handleTitleSubmit}>
                <input
                    className={titleInputStyle}
                    type="text"
                    name="window-title"
                    id="window-title"
                    ref={titleInputRef}
                    autoFocus
                    autoComplete="off"
                    defaultValue={windowTitle}
                    onKeyDown={handleTitleKeyDown}
                    onClick={e => {
                        e.stopPropagation();
                    }}
                />
            </form>
        );
    } else {
        titleComponent = <span>{windowTitle}</span>;
    }

    const titleStyle = tabWindow.open
        ? styles.titleOpen
        : styles.titleClosed(theme);
    const titleSpan = (
        <div className={titleStyle}>
            {titleComponent}
            {editButton}
        </div>
    );

    // Note explicit global css class name windowHeaderHoverContainer here
    // Due to limitation of nested class selectors with composition;
    // see https://emotion.sh/docs/nested for more info.
    return (
        <div
            className={
                cx(styles.windowHeader(theme), styles.noWrap) +
                ' windowHeaderHoverContainer'
            }
            onClick={onOpen}
        >
            <div className={styles.rowItemsFixedWidth}>
                {checkItem}
                <ExpanderButton expanded={expanded} onClick={onExpand} />
            </div>
            {titleSpan}
            <div className={styles.rowItemsFixedWidth}>
                {revertButton}
                {closeButton}
            </div>
        </div>
    );
};

export default WindowHeader;
