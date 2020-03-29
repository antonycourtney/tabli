import * as log from 'loglevel'; // eslint-disable-line no-unused-vars
import * as React from 'react';
import * as styles from './cssStyles';
import { ThemeContext, Theme } from './themeContext';
import * as svg from './svg';
import { Manager, Reference, Popper } from 'react-popper';
import { css, cx } from 'emotion';
import { mkUrl } from '../utils';
import * as actions from '../actions';
import { StateRef } from 'oneref';
import TabManagerState from '../tabManagerState';
import { useState, useContext } from 'react';

const modalOverlayStyle = css({
    position: 'fixed',
    top: 0,
    left: 0,
    background: 'rgba(0,0,0,0.6)',
    zIndex: 5,
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'column',
});

const popperBaseStyle = (theme: Theme) =>
    css({
        backgroundColor: theme.background,
        zIndex: 1000,
        border: '1px solid ' + theme.lightBorder,
        borderRadius: '.25rem',
    });

const menuItemStyle = (theme: Theme) =>
    css({
        flex: 1,
        borderStyle: 'none',
        backgroundColor: theme.background,
        textAlign: 'left',
        fontSize: 14,
        padding: '4px 24px 4px 24px',
        '&:hover': {
            backgroundColor: theme.menuItemHover,
        },
    });

type ClickEvent = React.SyntheticEvent<HTMLElement, MouseEvent>;
type ClickHandler = (event: ClickEvent) => void;

const handleHelpClick: ClickHandler = (e) => {
    e.preventDefault();
    actions.showHelp();
};

const handleAboutClick: ClickHandler = (e) => {
    e.preventDefault();
    actions.showAbout();
};

const handlePreferencesClick: ClickHandler = (e) => {
    e.preventDefault();
    actions.showPreferences();
};

const handleReloadClick: ClickHandler = (e) => {
    e.preventDefault();
    log.debug('handleReloadClick');
    actions.reload();
};

const handleReviewClick: ClickHandler = (e) => {
    e.preventDefault();
    actions.showReview();
};

const handleFeedbackClick: ClickHandler = (e) => {
    e.preventDefault();
    actions.sendFeedback();
};

type MenuButtonProps = {
    stateRef: StateRef<TabManagerState>;
};

/*
const menuStyle = css({
    display: 'flex',
    flexDirection: 'column',
    width: 200,
    minWidth: '10rem',
    padding: '.5rem 0',
    margin: '.125rem 0 0',
});
*/
const menuStyle = css({
    width: 200,
});

const MenuButton: React.FunctionComponent<MenuButtonProps> = ({
    stateRef,
}: MenuButtonProps) => {
    const theme = useContext(ThemeContext);
    const [dropdownOpen, setDropDownOpen] = useState(false);

    const toggleDropDown = () => {
        setDropDownOpen((isOpen: boolean) => !isOpen);
    };
    const handleRelNotesClick: ClickHandler = (e) => {
        e.preventDefault();
        actions.showRelNotes(stateRef);
    };

    const renderMenuItem = (handler: ClickHandler, label: string) => {
        const wrapItemHandler = (handler: ClickHandler) => (e: ClickEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setDropDownOpen(false);
            return handler(e);
        };
        return (
            <a
                href="#"
                className="dropdown-item"
                onClick={wrapItemHandler(handler)}
            >
                {label}
            </a>
        );
    };

    const handleCopyClick: ClickHandler = (e) => {
        e.preventDefault();
        actions.copyWindowsToClipboard(stateRef);
    };

    const handleTidyClick: ClickHandler = (e) => {
        e.preventDefault();
        actions.tidyWindows(stateRef);
    };
    const handleUntidyClick: ClickHandler = (e) => {
        e.preventDefault();
        actions.untidyWindows(stateRef);
    };

    const menu = (
        /* <div className={cx('dropdown-menu', menuStyle)}> */
        <div className="dropdown-content">
            {renderMenuItem(handlePreferencesClick, 'Preferences...')}
            <hr className="dropdown-divider" />
            {renderMenuItem(handleCopyClick, 'Copy Window Summary')}
            <hr className="dropdown-divider" />
            {renderMenuItem(handleHelpClick, 'Help (Manual)')}
            {renderMenuItem(handleRelNotesClick, 'Release Notes')}
            <hr className="dropdown-divider" />
            {renderMenuItem(handleTidyClick, 'Tidy (Minimize All)')}
            {renderMenuItem(handleUntidyClick, 'Untidy (Restore All)')}
            <hr className="dropdown-divider" />
            {renderMenuItem(handleReloadClick, 'Reload Tabli')}
            <hr className="dropdown-divider" />
            {renderMenuItem(handleReviewClick, 'Review Tabli')}
            {renderMenuItem(handleFeedbackClick, 'Send Feedback')}
        </div>
        /* </div> */
    );

    const popperVisStyle = dropdownOpen ? styles.visible : styles.hidden;
    const popperStyle = cx(popperVisStyle, popperBaseStyle(theme));
    if ((window as any).isTesting) {
        return <div />;
    }
    const menuIconStyle = styles.toolbarButtonIconMaskImage(
        theme,
        'images/hamburger-menu.png'
    );
    return (
        <Manager>
            <Reference>
                {({ ref }) => (
                    <button
                        type="button"
                        className={styles.toolbarButton(theme)}
                        ref={ref}
                        title="Tabli Menu"
                        onClick={(e) => toggleDropDown()}
                    >
                        <div
                            className={cx(
                                styles.toolbarButtonSVGIconContainer(theme)
                            )}
                        >
                            {svg.menu}
                        </div>
                    </button>
                )}
            </Reference>
            <Popper placement="bottom-end">
                {({ ref, style, placement, arrowProps }) => {
                    const menuDiv = (
                        <div
                            className={popperStyle}
                            tabIndex={1}
                            ref={ref}
                            style={style}
                            data-placement={placement}
                            onKeyDown={(e) => toggleDropDown()}
                        >
                            {menu}
                        </div>
                    );
                    const wrappedMenuDiv = dropdownOpen ? (
                        <div
                            className={modalOverlayStyle}
                            onClick={(e) => toggleDropDown()}
                        >
                            {menuDiv}
                        </div>
                    ) : (
                        menuDiv
                    );
                    return wrappedMenuDiv;
                }}
            </Popper>
        </Manager>
    );
};

export default MenuButton;
