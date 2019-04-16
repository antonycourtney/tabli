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

function matchingTabs(searchStr: string, filteredTabWindow: FilteredTabWindow) {
    var ret =
        searchStr.length > 0
            ? filteredTabWindow.itemMatches
            : filteredTabWindow.tabWindow.tabItems;
    return ret;
}

function matchingTabsCount(
    searchStr: string,
    filteredTabWindow: FilteredTabWindow
) {
    return matchingTabs(searchStr, filteredTabWindow).count();
}

function selectedTab(
    filteredTabWindow: FilteredTabWindow,
    searchStr: string | null,
    tabIndex: number
): TabItem {
    if (searchStr && searchStr.length === 0) {
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
const popupHeaderStyle = css({
    minWidth: 350,
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    height: Constants.POPUP_HEADER_HEIGHT,
    borderBottom: '1px solid #bababa',
    padding: 0,
    flex: '0 0 auto'
});
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

/**
 * An element that manages the selection.
 *
 * We want this as a distinct element from its parent, because it does local state management
 * and validation that should happen with respect to the (already calculated) props containing
 * filtered windows that we receive from above
 */
/*
class SelectablePopup extends React.Component {
    static contextType = ThemeContext;
    state = {
        selectedWindowIndex: 0,
        selectedTabIndex: 0,
        scrolledToWindowId: -1,
        scrolledToTabId: -1
    };

    handlePrevSelection = byPage => {
        if (this.props.filteredWindows.length === 0) {
            return;
        }
        const selectedWindow = this.props.filteredWindows[
            this.state.selectedWindowIndex
        ];

        // const tabCount = (this.props.searchStr.length > 0) ? selectedWindow.itemMatches.count() : selectedWindow.tabWindow.tabItems.count()

        const isExpanded = selectedWindow.tabWindow.isExpanded(
            this.props.appState
        );

        if (isExpanded && this.state.selectedTabIndex > 0 && !byPage) {
            this.setState({
                selectedTabIndex: this.state.selectedTabIndex - 1
            });
        } else {
            // Already on first tab, try to back up to previous window:
            let prevWindowIndex;
            if (this.state.selectedWindowIndex > 0) {
                prevWindowIndex = this.state.selectedWindowIndex - 1;
            } else {
                // ring style, move to last window:
                prevWindowIndex = this.props.filteredWindows.length - 1;
            }
            const prevWindow = this.props.filteredWindows[prevWindowIndex];
            const prevTabCount =
                this.props.searchStr.length > 0
                    ? prevWindow.itemMatches.count()
                    : prevWindow.tabWindow.tabItems.count();

            this.setState({
                selectedWindowIndex: prevWindowIndex,
                selectedTabIndex: prevTabCount - 1
            });
        }
    };

    handleNextSelection = byPage => {
        if (this.props.filteredWindows.length === 0) {
            return;
        }
        const selectedWindow = this.props.filteredWindows[
            this.state.selectedWindowIndex
        ];
        const tabCount =
            this.props.searchStr.length > 0
                ? selectedWindow.itemMatches.count()
                : selectedWindow.tabWindow.tabItems.count();

        const isExpanded = selectedWindow.tabWindow.isExpanded(
            this.props.appState
        );

        if (
            isExpanded &&
            this.state.selectedTabIndex + 1 < tabCount &&
            !byPage
        ) {
            this.setState({
                selectedTabIndex: this.state.selectedTabIndex + 1
            });
        } else {
            // Already on last tab, try to advance to next window:
            if (
                this.state.selectedWindowIndex + 1 <
                this.props.filteredWindows.length
            ) {
                this.setState({
                    selectedWindowIndex: this.state.selectedWindowIndex + 1,
                    selectedTabIndex: 0
                });
            } else {
                // wrap the search:
                this.setState({ selectedWindowIndex: 0, selectedTabIndex: 0 });
            }
        }
    };

    handleSelectionEnter = inputRef => {
        if (this.props.filteredWindows.length === 0) {
            return;
        }

        const currentWindow = this.props.appState.getCurrentWindow();
        const selectedWindow = this.props.filteredWindows[
            this.state.selectedWindowIndex
        ];
        if (this.state.selectedTabIndex === -1) {
            // no specific tab, but still active / open window
            actions.openWindow(
                currentWindow,
                selectedWindow.tabWindow,
                this.props.stateRef
            );
        } else {
            const selectedTabItem = selectedTab(
                selectedWindow,
                this.props.searchStr,
                this.state.selectedTabIndex
            );
            actions.activateTab(
                currentWindow,
                selectedWindow.tabWindow,
                selectedTabItem,
                this.state.selectedTabIndex,
                this.props.stateRef
            );
        }
        // And reset the search field:
        inputRef.value = '';
        this.props.onSearchInput('');
    };

    handleSelectionExpandToggle = () => {
        if (this.props.filteredWindows.length === 0) {
            return;
        }
        const selectedWindow = this.props.filteredWindows[
            this.state.selectedWindowIndex
        ];
        const tabWindow = selectedWindow.tabWindow;
        // technically the logical negation here isn't right, but it'll do.
        const expanded = tabWindow.isExpanded(this.props.appState);

        actions.expandWindow(tabWindow, !expanded, this.props.stateRef);
    };

    handleSearchExit = () => {
        // transfer focus back to current window (if there is one)
        const curWindow = this.props.appState.getCurrentWindow();
        if (!curWindow) {
            return;
        }
        actions.openWindow(curWindow, curWindow, this.props.stateRef);
    };

    UNSAFE_componentWillReceiveProps(nextProps) {
        var selectedWindowIndex = this.state.selectedWindowIndex;
        var nextFilteredWindows = nextProps.filteredWindows;

        if (selectedWindowIndex >= nextFilteredWindows.length) {
            if (nextFilteredWindows.length === 0) {
                this.setState({ selectedWindowIndex: 0, selectedTabIndex: -1 });
            } else {
                var lastWindow =
                    nextFilteredWindows[nextFilteredWindows.length - 1];
                this.setState({
                    selectedWindowIndex: nextFilteredWindows.length - 1,
                    selectedTabIndex:
                        matchingTabsCount(this.props.searchStr, lastWindow) - 1
                });
            }
        } else {
            const nextSearchStr = nextProps.searchStr;
            var nextSelectedWindow = nextFilteredWindows[selectedWindowIndex];
            const matchCount = matchingTabsCount(
                nextSearchStr,
                nextSelectedWindow
            );
            var nextTabIndex = Math.min(
                this.state.selectedTabIndex,
                matchCount - 1
            );
            this.setState({ selectedTabIndex: nextTabIndex });
        }
    }
    */
/*
 * We have to do some fairly horrible change detection here because
 * React only seems to support imperative handling of scroll position and
 * kbd focus.
 *
 * Code here is also much more involved than it needs to be because we briefly tried
 * to reduce flash / jitter by keeping all open windows in alphabetical order by title
 * and just scrolling to bring the target window into the viewport.
 * This turned out not to really reduce jitter because Chrome window titles are determined
 * by tab title, so simply switching tabs resulted in abrupt changes in window sort order.
 */
/*
    updateScrollPos = (bodyRef, windowRef) => {
        const needScrollUpdate =
            this.state.scrolledToWindowId !==
                this.props.appState.currentWindowId ||
            this.state.scrolledToTabId !== this.props.appState.getActiveTabId();


      // log.log("updateScrollPos: scrolledToWindowId: ", this.state.scrolledToWindowId,
      //             ", currentWindowId: ", this.props.appState.currentWindowId );
      // log.log("updateScrollPos: scrolledToTabId: ", this.state.scrolledToTabId,
      //             ", activeTabId: ", this.props.appState.getActiveTabId(),
      //             ", needScroll: ", needScrollUpdate)
        const isPopup = !this.props.isPopout;
        if (
            windowRef != null &&
            bodyRef != null &&
            needScrollUpdate &&
            this.props.filteredWindows.length > 0 &&
            !this.props.appState.showRelNotes
        ) {
            const viewportTop = bodyRef.scrollTop;
            const viewportHeight = bodyRef.clientHeight;

            const windowTop = windowRef.offsetTop;
            const windowHeight = windowRef.scrollHeight;

            // log.log("updateScrollPos: ", { offsetTop, viewportTop, viewportHeight, windowTop, windowHeight } )
            if (
                windowTop < viewportTop ||
                windowTop + windowHeight > viewportTop + viewportHeight ||
                isPopup
            ) {
                // log.log("updateScrollPos: setting scroll position")

                if (windowHeight > viewportHeight || isPopup) {
                    bodyRef.scrollTop =
                        windowRef.offsetTop -
                        bodyRef.offsetTop -
                        Constants.FOCUS_SCROLL_BASE;
                } else {
                    // since we know only scroll if
                    // set padding to center taget window in viewport:
                    const viewportPad = (viewportHeight - windowHeight) / 2;
                    bodyRef.scrollTop =
                        windowRef.offsetTop -
                        bodyRef.offsetTop -
                        viewportPad -
                        Constants.FOCUS_SCROLL_BASE;
                }
            }
            // Set the selected window and tab to the focused window and its currently active tab:

            const selectedWindow = this.props.filteredWindows[0];

            const selectedTabs = matchingTabs(
                this.props.searchStr,
                selectedWindow
            );

            const activeEntry = selectedTabs.findEntry(
                t => t.open && t.openState.active
            );
            const activeTabIndex = activeEntry ? activeEntry[0] : 0;
            const activeTabId = this.props.appState.getActiveTabId();

            const updState = {
                scrolledToWindowId: this.props.appState.currentWindowId,
                scrolledToTabId: activeTabId,
                selectedWindowIndex: 0,
                selectedTabIndex: activeTabIndex
            };

            // log.log("updateScrollPos: udpating State: ", updState)
            this.setState(updState);
        }
    };

    // Search input ref:
    setSearchInputRef = ref => {
        this.searchInputRef = ref;
    };

    handleItemSelected = item => {
        if (this.searchInputRef) {
            // And reset the search field:
            this.searchInputRef.value = '';
            this.props.onSearchInput('');
        }
    };

    // Scrollable body (container) DOM ref
    setBodyRef = ref => {
        this.bodyRef = ref;
        this.updateScrollPos(this.bodyRef, this.focusedWindowRef);
    };

    // DOM ref for currently focused tab window:
    setFocusedTabWindowRef = ref => {
        this.focusedWindowRef = ref;
        this.updateScrollPos(this.bodyRef, this.focusedWindowRef);
    };

    componentDidUpdate() {
        this.updateScrollPos(this.bodyRef, this.focusedWindowRef);
    }

    render() {
        let theme = this.context;
        const appState = this.props.appState;
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
                        appState={this.props.appState}
                        stateRef={this.props.stateRef}
                        onSearchInput={this.props.onSearchInput}
                        onSearchUp={this.handlePrevSelection}
                        onSearchDown={this.handleNextSelection}
                        onSearchEnter={this.handleSelectionEnter}
                        onSearchExit={this.handleSearchExit}
                        onSearchExpandToggle={this.handleSelectionExpandToggle}
                        onShowPreferences={
                            this.props.appComponent.openPreferencesModal
                        }
                        setInputRef={this.setSearchInputRef}
                        isPopout={this.props.isPopout}
                    />
                </div>
                <div className={popupBodyStyle} ref={this.setBodyRef}>
                    <TabWindowList
                        appState={this.props.appState}
                        stateRef={this.props.stateRef}
                        filteredWindows={this.props.filteredWindows}
                        appComponent={this.props.appComponent}
                        searchStr={this.props.searchStr}
                        searchRE={this.props.searchRE}
                        selectedWindowIndex={this.state.selectedWindowIndex}
                        selectedTabIndex={this.state.selectedTabIndex}
                        setFocusedTabWindowRef={this.setFocusedTabWindowRef}
                        onItemSelected={this.handleItemSelected}
                    />
                </div>
                <div className={popupFooterStyle(theme)}>
                    <span className={summarySpanStyle}>{summarySentence}</span>
                </div>
            </div>
        );
    }
}
*/

interface SelectablePopupProps {
    appState: TabManagerState;
    stateRef: StateRef<TabManagerState>;
    onSearchInput: (searchStr: string) => void;
    onShowPreferences: () => void;
    filteredWindows: FilteredTabWindow[];
    searchStr: string | null;
    searchRE: RegExp | null;
    isPopout: boolean;
    modalActions: ModalActions;
}

const SelectablePopup: React.FunctionComponent<SelectablePopupProps> = ({
    appState,
    stateRef,
    onSearchInput,
    onShowPreferences,
    filteredWindows,
    searchStr,
    searchRE,
    isPopout,
    modalActions
}: SelectablePopupProps) => {
    const bodyRef = useRef(null);
    const searchInputRef = useRef<HTMLInputElement | null>(null);
    const theme = useContext(ThemeContext);
    const focusedTabWindowRef = useRef<HTMLDivElement | null>(null);

    const [selectedWindowIndex, setSelectedWindowIndex] = useState(0);
    const [selectedTabIndex, setSelectedTabIndex] = useState(0);
    const [scrolledToWindowId, setScrolledToWindowId] = useState(-1);
    const [scrolledToTabId, setScrolledToTabId] = useState(-1);
    const expandAll = appState.expandAll;

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
                    onShowPreferences={onShowPreferences}
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
