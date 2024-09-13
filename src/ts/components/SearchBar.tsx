import { log } from '../globals'; // eslint-disable-line no-unused-vars
import * as React from 'react';
import * as Constants from './constants';
import * as actions from '../actions';
import * as styles from './cssStyles';
import { ThemeContext } from './themeContext';
import { css, cx } from '@emotion/css';
import MenuButton from './MenuButton';
import * as svg from './svg';
import { StateRef } from 'oneref';
import TabManagerState from '../tabManagerState';
import { useRef, useContext, Ref, MutableRefObject, ReactNode } from 'react';
import { mkUrl } from '../utils';

const toolbarOuterContainerStyle = css`
    display: flex;
    align-items: center;
    margin-top: 16px;
    margin-bottom: 16px;
    margin-left: 12px;
    min-width: 400px;
    width: 100%;
`;

const toolbarInnerContainerStyle = css`
    display: flex;
    justify-content: flex-start;
    min-width: 400px;
    width: 100%;
`;

const growRightStyle = css`
    display: flex;
    justify-content: flex-start;
    align-items: center;
    margin-left: 0px;
    margin-top: 0px;
    margin-bottom: 0px;
    margin-right: auto;
    flex-grow: 1;
`;

interface GrowRightProps {
    children: ReactNode;
}

// A container that will grow to the right:
const GrowRight: React.FunctionComponent<GrowRightProps> = ({ children }) => (
    <div className={growRightStyle}>{children}</div>
);

const centeredStyle = css`
    display: flex;
    justify-content: center;
    align-items: center;
    margin-left: auto;
    margin-top: 0px;
    margin-bottom: 0px;
    margin-right: auto;
    flex-basis: auto;
    flex-grow: 1;
`;

interface CenteredProps {
    children: ReactNode;
}

// A flex container with 'justify-content: center':
const Centered: React.FunctionComponent<CenteredProps> = ({ children }) => (
    <div className={centeredStyle}>{children}</div>
);

const searchInputStyle = css`
    border: 1px solid #ccc;
    border-radius: 4px;
    width: 200px;
    max-width: 200px;
    margin-left: 8px;
    margin-right: 12px;
    flex: 0 0 auto;
    height: 24px;
    line-height: 1.5;
    padding-top: 1px;
    padding-bottom: 1px;
    padding-left: 4px;
    padding-right: 4px;
    height: 26px;
`;

const searchInputClass = cx('search-input', searchInputStyle);

interface SearchBarProps {
    onSearchInput: (s: string) => void;
    onSearchUp: (byPage: boolean) => void;
    onSearchDown: (byPage: boolean) => void;
    onSearchEnter: (ref: MutableRefObject<HTMLInputElement | null>) => void;
    onSearchExit: () => void;
    onSearchExpandToggle: () => void;
    isPopout: boolean;
    searchInputRef: MutableRefObject<HTMLInputElement | null>;
    stateRef: StateRef<TabManagerState>;
}

const SearchBar: React.FunctionComponent<SearchBarProps> = ({
    stateRef,
    onSearchInput,
    onSearchUp,
    onSearchDown,
    onSearchEnter,
    onSearchExit,
    onSearchExpandToggle,
    isPopout,
    searchInputRef,
}: SearchBarProps) => {
    const theme = useContext(ThemeContext);

    const handleChange = () => {
        if (searchInputRef.current) {
            const searchStr = searchInputRef.current.value;
            onSearchInput(searchStr);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (
            e.keyCode === Constants.KEY_F1 ||
            (e.keyCode === Constants.KEY_QUESTION && e.ctrlKey && e.shiftKey)
        ) {
            e.preventDefault();
            actions.showHelp();
        }

        const searchUp = (byPage: boolean) => {
            if (onSearchUp) {
                e.preventDefault();
                onSearchUp(byPage);
            }
        };

        const searchDown = (byPage: boolean) => {
            if (onSearchDown) {
                e.preventDefault();
                onSearchDown(byPage);
            }
        };

        if (
            (!e.ctrlKey && e.keyCode === Constants.KEY_UP) ||
            (e.ctrlKey && !e.shiftKey && e.keyCode === Constants.KEY_P)
        ) {
            searchUp(false);
        }
        if (
            (e.ctrlKey && e.keyCode === Constants.KEY_UP) ||
            (e.ctrlKey && e.shiftKey && e.keyCode === Constants.KEY_P)
        ) {
            searchUp(true);
        }

        if (
            (!e.ctrlKey && e.keyCode === Constants.KEY_DOWN) ||
            (e.ctrlKey && !e.shiftKey && e.keyCode === Constants.KEY_N)
        ) {
            searchDown(false);
        }

        if (
            (e.ctrlKey && e.keyCode === Constants.KEY_DOWN) ||
            (e.ctrlKey && e.shiftKey && e.keyCode === Constants.KEY_N)
        ) {
            searchDown(true);
        }

        if (e.keyCode === Constants.KEY_TAB) {
            // We need to determine if it was forward or backwards tab:
            // N.B. we still try and use e.ctrlKey to determine paged
            // nav, but that key combo consumed by Chrome before we see it...
            if (onSearchUp && onSearchDown) {
                e.preventDefault();
                if (e.shiftKey) {
                    onSearchUp(e.ctrlKey);
                } else {
                    onSearchDown(e.ctrlKey);
                }
            }
        }

        if (e.keyCode === Constants.KEY_ENTER) {
            if (onSearchEnter) {
                e.preventDefault();
                onSearchEnter(searchInputRef);
            }
        }

        // For some odd reason, semicolon gives a keyCode of 186 (?)
        // but key seems to work so use it
        if (e.key === ';') {
            if (onSearchExpandToggle) {
                e.preventDefault();
                onSearchExpandToggle();
            }
        }

        if (e.keyCode === Constants.KEY_ESC) {
            if (onSearchExit && searchInputRef.current) {
                const searchStr = searchInputRef.current.value;
                if (!searchStr || searchStr.length === 0) {
                    e.preventDefault();
                    onSearchExit();
                }
            }
        }
    };

    const handlePopoutClick = (
        e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    ) => {
        // We'll now send a message to the background script to
        // hide or show the popout, so that the state gets updated
        // appropriately:
        const action = isPopout ? 'hidePopout' : 'showPopout';
        chrome.runtime.sendMessage({ action });
        if (!isPopout) {
            window.close();
        }
    };

    const handleExpandToggleClick = () => {
        actions.toggleExpandAll(stateRef);
    };

    const popSVG = isPopout ? svg.popin : svg.popout;

    const popVerb = isPopout ? 'Hide' : 'Show';
    const popDesc = popVerb + ' Tabli Popout Window';

    const popoutButton = (
        <button
            className={styles.toolbarButton(theme)}
            title={popDesc}
            onClick={handlePopoutClick}
        >
            <div className={cx(styles.toolbarButtonSVGIconContainer(theme))}>
                {popSVG}
            </div>
        </button>
    );

    const expandAllButton = (
        <button
            className={styles.toolbarButton(theme)}
            title="Expand/Collapse All Window Summaries"
            onClick={handleExpandToggleClick}
        >
            <div className={styles.expandAllIconStyle(theme)} />
        </button>
    );

    const devLabelStyle = css({
        fontSize: 10,
        marginRight: 25,
    });
    const nodeEnv = process.env.NODE_ENV;
    const devLabel =
        nodeEnv === 'development' ? (
            <span className={devLabelStyle}>DEV</span>
        ) : null;
    return (
        <div className={toolbarOuterContainerStyle}>
            <div className={toolbarInnerContainerStyle}>
                <GrowRight>{popoutButton}</GrowRight>
                <Centered>
                    <GrowRight>
                        <MenuButton stateRef={stateRef} />
                        <input
                            className={searchInputClass}
                            type="search"
                            tabIndex={1}
                            ref={searchInputRef}
                            id="searchBox"
                            data-testid="searchBox"
                            placeholder="Search..."
                            onChange={handleChange}
                            onKeyDown={handleKeyDown}
                            title="Search Page Titles and URLs"
                        />
                    </GrowRight>
                </Centered>
                {devLabel}
            </div>
        </div>
    );
};

export default SearchBar;
