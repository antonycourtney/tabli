import * as log from 'loglevel';
import * as React from 'react';
import * as styles from './cssStyles';
import { cx, css } from 'emotion';
import * as Constants from './constants';

import * as actions from '../actions';
import SearchBar from './SearchBar';
import TabWindowList from './TabWindowList';
import { ThemeContext, Theme } from './themeContext';
import { FilteredTabWindow } from '../searchOps';
import TabManagerState from '../tabManagerState';
import { StateRef } from 'oneref';
import { useRef, useContext, useState, Ref, MutableRefObject } from 'react';
import { TabItem } from '../tabWindow';
import ModalActions from './modalActions';

function matchingTabs(
    searchStr: string | null,
    filteredTabWindow: FilteredTabWindow
) {
    var ret =
        searchStr && searchStr.length > 0
            ? filteredTabWindow.itemMatches.map(fti => fti.tabItem)
            : filteredTabWindow.tabWindow.tabItems;
    return ret;
}

function matchingTabsCount(
    searchStr: string | null,
    filteredTabWindow: FilteredTabWindow
) {
    return matchingTabs(searchStr, filteredTabWindow).count();
}

function selectedTab(
    filteredTabWindow: FilteredTabWindow,
    searchStr: string | null,
    tabIndex: number
): TabItem {
    if (!searchStr || searchStr.length === 0) {
        const tabWindow = filteredTabWindow.tabWindow;
        const tabItem = tabWindow.tabItems.get(tabIndex);
        return tabItem!;
    }
    const filteredItem = filteredTabWindow.itemMatches.get(tabIndex);
    return filteredItem!.tabItem;
}

// inner popup container, consisting of just header,body and footer:
const popupInnerStyle = css({
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    flexWrap: 'nowrap'
});

const popupHeaderBaseStyle = css({
    minWidth: 350,
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    height: Constants.POPUP_HEADER_HEIGHT,
    borderBottom: '1px solid #bababa',
    padding: 0,
    flex: '0 0 auto'
});
const devModeStyle = css`
    background-color: #e8ad2e;
`;
const nodeEnv = process.env.NODE_ENV;
const nodeEnvStyle = nodeEnv === 'development' ? devModeStyle : null;

const popupHeaderStyle = cx(popupHeaderBaseStyle, nodeEnvStyle);

const popupBodyStyle = css({
    minHeight: Constants.POPUP_BODY_HEIGHT,
    position: 'relative',
    overflow: 'auto',
    flex: '1 1 auto'
});
const popupFooterStyle = (theme: Theme) =>
    css({
        minWidth: 350,
        height: Constants.POPUP_FOOTER_HEIGHT,
        background: theme.background,
        borderTop: '1px solid ' + theme.lightBorder,
        paddingLeft: 10,
        paddingRight: 16,
        paddingTop: 4,
        paddingBottom: 4,
        fontSize: 11,
        flex: '0 0 auto',
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        margin: 0
    });
const summarySpanBaseStyle = css({
    marginRight: 5
});

interface SelectablePopupProps {
    appState: TabManagerState;
    stateRef: StateRef<TabManagerState>;
    onSearchInput: (searchStr: string) => void;
    filteredWindows: FilteredTabWindow[];
    searchStr: string | null;
    searchRE: RegExp | null;
    isPopout: boolean;
    modalActions: ModalActions;
}

/**
 * An element that manages the selection.
 *
 * We want this as a distinct element from its parent, because it does local state management
 * and validation that should happen with respect to the (already calculated) props containing
 * filtered windows that we receive from above
 */
const SelectablePopup: React.FunctionComponent<SelectablePopupProps> = ({
    appState,
    stateRef,
    onSearchInput,
    filteredWindows,
    searchStr,
    searchRE,
    isPopout,
    modalActions
}: SelectablePopupProps) => {
    const bodyRef = useRef<HTMLDivElement | null>(null);
    const searchInputRef = useRef<HTMLInputElement | null>(null);
    const theme = useContext(ThemeContext);
    const focusedTabWindowRef = useRef<HTMLDivElement | null>(null);

    const [selectedWindowIndex, setSelectedWindowIndex] = useState(0);
    const [selectedTabIndex, setSelectedTabIndex] = useState(0);
    /* Through some disgusting accident of history, the current window id has type number,
     * with -1 as sentinel, but active tab id is type number | null. *sigh*
     */
    const [scrolledToWindowId, setScrolledToWindowId] = useState(-1);
    const [scrolledToTabId, setScrolledToTabId] = useState<number | null>(null);
    const expandAll = appState.expandAll;

    const filteredWindowsLength = filteredWindows.length;
    log.debug('SelectablePopup: ', {
        selectedWindowIndex,
        selectedTabIndex,
        searchStr,
        filteredWindowsLength
    });

    // This was ported from an old componentWillReceivProps handler;
    // seems a little kludgey and likely to result in some extra
    // rendering, but we'll leave it:
    React.useEffect(() => {
        if (selectedWindowIndex >= filteredWindows.length) {
            if (filteredWindows.length === 0) {
                log.debug('No filtered windows -- resetting selected indices');
                setSelectedWindowIndex(0);
                setSelectedTabIndex(-1);
            } else {
                var lastWindow = filteredWindows[filteredWindows.length - 1];
                setSelectedWindowIndex(filteredWindows.length - 1);
                setSelectedTabIndex(
                    matchingTabsCount(searchStr, lastWindow) - 1
                );
            }
        } else {
            const nextSearchStr = searchStr;
            var nextSelectedWindow = filteredWindows[selectedWindowIndex];
            const matchCount = matchingTabsCount(
                nextSearchStr,
                nextSelectedWindow
            );
            var nextTabIndex = Math.min(selectedTabIndex, matchCount - 1);
            setSelectedTabIndex(nextTabIndex);
        }
    });

    // Ported from updateScrollPos:
    /* Code here is also much more involved than it needs to be because we briefly tried
     * to reduce flash / jitter by keeping all open windows in alphabetical order by title
     * and just scrolling to bring the target window into the viewport.
     * This turned out not to really reduce jitter because Chrome window titles are determined
     * by tab title, so simply switching tabs resulted in abrupt changes in window sort order.
     * Could probably simplified quite a bit.
     */
    React.useEffect(() => {
        const needScrollUpdate =
            scrolledToWindowId !== appState.currentWindowId ||
            scrolledToTabId !== appState.getActiveTabId();

        /*         log.debug(
            'updateScrollPos: scrolledToWindowId: ',
            scrolledToWindowId,
            ', currentWindowId: ',
            appState.currentWindowId
        );
        log.debug(
            'updateScrollPos: scrolledToTabId: ',
            scrolledToTabId,
            ', activeTabId: ',
            appState.getActiveTabId(),
            ', needScroll: ',
            needScrollUpdate
        ); */

        const isPopup = !isPopout;
        if (
            focusedTabWindowRef.current != null &&
            bodyRef.current != null &&
            needScrollUpdate &&
            filteredWindows.length > 0 &&
            !appState.showRelNotes
        ) {
            const viewportTop = bodyRef.current.scrollTop;
            const viewportHeight = bodyRef.current.clientHeight;

            const windowTop = focusedTabWindowRef.current.offsetTop;
            const windowHeight = focusedTabWindowRef.current.scrollHeight;

            // log.debug('past needScrollUpdate gate');
            /*             log.debug('updateScrollPos: ', {
                viewportTop,
                viewportHeight,
                windowTop,
                windowHeight
            }); */
            if (
                windowTop < viewportTop ||
                windowTop + windowHeight > viewportTop + viewportHeight ||
                isPopup
            ) {
                log.debug('updateScrollPos: setting scroll position');

                if (windowHeight > viewportHeight || isPopup) {
                    bodyRef.current.scrollTop =
                        focusedTabWindowRef.current.offsetTop -
                        bodyRef.current.offsetTop -
                        Constants.FOCUS_SCROLL_BASE;
                } else {
                    // set padding to center taget window in viewport:
                    const viewportPad = (viewportHeight - windowHeight) / 2;
                    bodyRef.current.scrollTop =
                        focusedTabWindowRef.current.offsetTop -
                        bodyRef.current.offsetTop -
                        viewportPad -
                        Constants.FOCUS_SCROLL_BASE;
                }
            }
            // Set the selected window and tab to the focused window and its currently active tab:

            const selectedWindow = filteredWindows[0];

            const selectedTabs = matchingTabs(searchStr, selectedWindow);

            const activeEntry = selectedTabs.findEntry(
                t => t.open && t.openState!.active
            );
            const activeTabIndex = activeEntry ? activeEntry[0] : 0;
            const activeTabId = appState.getActiveTabId();

            /*             log.debug('updateScrollPos: updating state: ', {
                scrolledToWindowId: appState.currentWindowId,
                scrolledToTabId: activeTabId ? activeTabId : -1,
                selectedWindowIndex: 0,
                selectedTabIndex: activeTabIndex
            }); */
            if (scrolledToWindowId !== appState.currentWindowId)
                setScrolledToWindowId(appState.currentWindowId);
            if (scrolledToTabId !== activeTabId)
                setScrolledToTabId(activeTabId);
            if (selectedWindowIndex !== 0) setSelectedWindowIndex(0);
            if (selectedTabIndex !== activeTabIndex)
                setSelectedTabIndex(activeTabIndex);
        }
    });

    const handlePrevSelection = (byPage: boolean) => {
        if (filteredWindows.length === 0) {
            return;
        }
        const selectedWindow = filteredWindows[selectedWindowIndex];

        // const tabCount = (this.props.searchStr.length > 0) ? selectedWindow.itemMatches.count() : selectedWindow.tabWindow.tabItems.count()

        const isExpanded = selectedWindow.tabWindow.isExpanded(expandAll);

        if (isExpanded && selectedTabIndex > 0 && !byPage) {
            setSelectedTabIndex(selectedTabIndex - 1);
        } else {
            // Already on first tab, try to back up to previous window:
            let prevWindowIndex;
            if (selectedWindowIndex > 0) {
                prevWindowIndex = selectedWindowIndex - 1;
            } else {
                // ring style, move to last window:
                prevWindowIndex = filteredWindows.length - 1;
            }
            const prevWindow = filteredWindows[prevWindowIndex];
            const prevTabCount =
                searchStr && searchStr.length > 0
                    ? prevWindow.itemMatches.count()
                    : prevWindow.tabWindow.tabItems.count();

            setSelectedWindowIndex(prevWindowIndex);
            setSelectedTabIndex(prevTabCount - 1);
        }
    };

    const handleNextSelection = (byPage: boolean) => {
        if (filteredWindows.length === 0) {
            return;
        }
        const selectedWindow = filteredWindows[selectedWindowIndex];
        const tabCount =
            searchStr && searchStr.length > 0
                ? selectedWindow.itemMatches.count()
                : selectedWindow.tabWindow.tabItems.count();

        const isExpanded = selectedWindow.tabWindow.isExpanded(expandAll);

        if (isExpanded && selectedTabIndex + 1 < tabCount && !byPage) {
            setSelectedTabIndex(selectedTabIndex + 1);
        } else {
            // Already on last tab, try to advance to next window:
            if (selectedWindowIndex + 1 < filteredWindows.length) {
                setSelectedWindowIndex(selectedWindowIndex + 1);
                setSelectedTabIndex(0);
            } else {
                // wrap the search:
                setSelectedWindowIndex(0);
                setSelectedTabIndex(0);
            }
        }
    };

    const handleSelectionEnter = (
        inputRef: MutableRefObject<HTMLInputElement | null>
    ) => {
        if (filteredWindows.length === 0) {
            return;
        }

        const currentWindow = appState.getCurrentWindow();
        const selectedWindow = filteredWindows[selectedWindowIndex];
        if (selectedTabIndex === -1) {
            if (currentWindow) {
                // no specific tab, but still active / open window
                actions.openWindow(selectedWindow.tabWindow, stateRef);
            }
        } else {
            const selectedTabItem = selectedTab(
                selectedWindow,
                searchStr,
                selectedTabIndex
            );
            actions.activateTab(
                selectedWindow.tabWindow,
                selectedTabItem,
                selectedTabIndex,
                stateRef
            );
        }
        // And reset the search field:
        inputRef!.current!.value = '';
        onSearchInput('');
    };

    const handleSelectionExpandToggle = () => {
        if (filteredWindows.length === 0) {
            return;
        }
        const selectedWindow = filteredWindows[selectedWindowIndex];
        const tabWindow = selectedWindow.tabWindow;
        // technically the logical negation here isn't right, but it'll do.
        const expanded = tabWindow.isExpanded(expandAll);

        actions.expandWindow(tabWindow, !expanded, stateRef);
    };

    const handleSearchExit = () => {
        // transfer focus back to current window (if there is one)
        const curWindow = appState.getCurrentWindow();
        if (!curWindow) {
            return;
        }
        actions.openWindow(curWindow, stateRef);
    };

    const handleItemSelected = () => {
        if (searchInputRef.current) {
            // And reset the search field:
            searchInputRef.current.value = '';
            onSearchInput('');
        }
    };

    const openTabCount = appState.countOpenTabs();
    const openWinCount = appState.countOpenWindows();
    const savedCount = appState.countSavedWindows();

    // const summarySentence=openTabCount + " Open Tabs, " + openWinCount + " Open Windows, " + savedCount + " Saved Windows"
    const summarySentence =
        'Tabs: ' +
        openTabCount +
        ' Open. Windows: ' +
        openWinCount +
        ' Open, ' +
        savedCount +
        ' Saved.';

    const summarySpanStyle = cx(styles.closed(theme), summarySpanBaseStyle);

    return (
        <div className={popupInnerStyle}>
            <div className={popupHeaderStyle}>
                <SearchBar
                    stateRef={stateRef}
                    onSearchInput={onSearchInput}
                    onSearchUp={handlePrevSelection}
                    onSearchDown={handleNextSelection}
                    onSearchEnter={handleSelectionEnter}
                    onSearchExit={handleSearchExit}
                    onSearchExpandToggle={handleSelectionExpandToggle}
                    searchInputRef={searchInputRef}
                    isPopout={isPopout}
                />
            </div>
            <div className={popupBodyStyle} ref={bodyRef}>
                <TabWindowList
                    stateRef={stateRef}
                    filteredWindows={filteredWindows}
                    modalActions={modalActions}
                    searchStr={searchStr}
                    searchRE={searchRE}
                    selectedWindowIndex={selectedWindowIndex}
                    selectedTabIndex={selectedTabIndex}
                    focusedTabWindowRef={focusedTabWindowRef}
                    onItemSelected={handleItemSelected}
                    expandAll={expandAll}
                    showRelNotes={appState.showRelNotes}
                    currentWindowId={appState.currentWindowId}
                />
            </div>
            <div className={popupFooterStyle(theme)}>
                <span className={summarySpanStyle}>{summarySentence}</span>
            </div>
        </div>
    );
};

export default SelectablePopup;
