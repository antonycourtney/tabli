import * as React from 'react'
import * as styles from './cssStyles'
import { cx, css } from 'emotion'
import * as Constants from './constants'

import * as actions from '../actions'
import SearchBar from './SearchBar'
import TabWindowList from './TabWindowList'

function matchingTabs (searchStr, filteredTabWindow) {
  var ret = (searchStr.length > 0) ? filteredTabWindow.itemMatches : filteredTabWindow.tabWindow.tabItems
  return ret
}

function matchingTabsCount (searchStr, filteredTabWindow) {
  return matchingTabs(searchStr, filteredTabWindow).count()
}

function selectedTab (filteredTabWindow, searchStr, tabIndex) {
  if (searchStr.length === 0) {
    var tabWindow = filteredTabWindow.tabWindow
    var tabItem = tabWindow.tabItems.get(tabIndex)
    return tabItem
  }
  var filteredItem = filteredTabWindow.itemMatches.get(tabIndex)
  return filteredItem.tabItem
}

// inner popup container, consisting of just header,body and footer:
const popupInnerStyle = css({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  flexWrap: 'nowrap'
})
const popupHeaderStyle = css({
  minWidth: 350,
  width: '100%',
  display: 'flex',
  justifyContent: 'center',
  height: Constants.POPUP_HEADER_HEIGHT,
  background: '#ffffff',
  borderBottom: '1px solid #bababa',
  padding: 0,
  flex: '0 0 auto'
})
const popupBodyStyle = css({
  minHeight: Constants.POPUP_BODY_HEIGHT,
  position: 'relative',
  overflow: 'auto',
  flex: '1 1 auto'
})
const popupFooterStyle = css({
  minWidth: 350,
  height: Constants.POPUP_FOOTER_HEIGHT,
  background: '#ffffff',
  borderTop: '1px solid #bababa',
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
})
const summarySpanBaseStyle = css({
  marginRight: 5
})
const summarySpanStyle = cx(styles.closed, summarySpanBaseStyle)

/**
 * An element that manages the selection.
 *
 * We want this as a distinct element from its parent, because it does local state management
 * and validation that should happen with respect to the (already calculated) props containing
 * filtered windows that we receive from above
 */
class SelectablePopup extends React.Component {
  state = {
    selectedWindowIndex: 0,
    selectedTabIndex: 0,
    scrolledToWindowId: -1,
    scrolledToTabId: -1
  };

  handlePrevSelection = (byPage) => {
    if (this.props.filteredWindows.length === 0) {
      return
    }
    const selectedWindow = this.props.filteredWindows[this.state.selectedWindowIndex]

    // const tabCount = (this.props.searchStr.length > 0) ? selectedWindow.itemMatches.count() : selectedWindow.tabWindow.tabItems.count()

    const isExpanded = selectedWindow.tabWindow.isExpanded(this.props.winStore)

    if (isExpanded && this.state.selectedTabIndex > 0 && !byPage) {
      this.setState({ selectedTabIndex: this.state.selectedTabIndex - 1 })
    } else {
      // Already on first tab, try to back up to previous window:
      let prevWindowIndex
      if (this.state.selectedWindowIndex > 0) {
        prevWindowIndex = this.state.selectedWindowIndex - 1
      } else {
        // ring style, move to last window:
        prevWindowIndex = this.props.filteredWindows.length - 1
      }
      const prevWindow = this.props.filteredWindows[prevWindowIndex]
      const prevTabCount = (this.props.searchStr.length > 0) ? prevWindow.itemMatches.count() : prevWindow.tabWindow.tabItems.count()

      this.setState({ selectedWindowIndex: prevWindowIndex, selectedTabIndex: prevTabCount - 1 })
    }
  };

  handleNextSelection = (byPage) => {
    if (this.props.filteredWindows.length === 0) {
      return
    }
    const selectedWindow = this.props.filteredWindows[this.state.selectedWindowIndex]
    const tabCount = (this.props.searchStr.length > 0) ? selectedWindow.itemMatches.count() : selectedWindow.tabWindow.tabItems.count()

    const isExpanded = selectedWindow.tabWindow.isExpanded(this.props.winStore)

    if (isExpanded && (this.state.selectedTabIndex + 1) < tabCount && !byPage) {
      this.setState({ selectedTabIndex: this.state.selectedTabIndex + 1 })
    } else {
      // Already on last tab, try to advance to next window:
      if ((this.state.selectedWindowIndex + 1) < this.props.filteredWindows.length) {
        this.setState({ selectedWindowIndex: this.state.selectedWindowIndex + 1, selectedTabIndex: 0 })
      } else {
        // wrap the search:
        this.setState({ selectedWindowIndex: 0, selectedTabIndex: 0 })
      }
    }
  };

  handleSelectionEnter = (inputRef) => {
    if (this.props.filteredWindows.length === 0) {
      return
    }

    const currentWindow = this.props.winStore.getCurrentWindow()
    const selectedWindow = this.props.filteredWindows[this.state.selectedWindowIndex]
    if (this.state.selectedTabIndex === -1) {
      // no specific tab, but still active / open window
      actions.openWindow(currentWindow, selectedWindow.tabWindow, this.props.storeRef)
    } else {
      const selectedTabItem = selectedTab(selectedWindow, this.props.searchStr, this.state.selectedTabIndex)
      actions.activateTab(currentWindow, selectedWindow.tabWindow, selectedTabItem, this.state.selectedTabIndex, this.props.storeRef)
    }
    // And reset the search field:
    inputRef.value = ''
    this.props.onSearchInput('')
  };

  handleSelectionExpandToggle = () => {
    if (this.props.filteredWindows.length === 0) {
      return
    }
    const selectedWindow = this.props.filteredWindows[this.state.selectedWindowIndex]
    const tabWindow = selectedWindow.tabWindow
    // technically the logical negation here isn't right, but it'll do.
    const expanded = tabWindow.isExpanded(this.props.winStore)

    actions.expandWindow(tabWindow, !expanded, this.props.storeRef)
  };

  handleSearchExit = () => {
    // transfer focus back to current window (if there is one)
    const curWindow = this.props.winStore.getCurrentWindow()
    if (!curWindow) {
      return
    }
    actions.openWindow(curWindow, curWindow, this.props.storeRef)
  };

  componentWillReceiveProps (nextProps) {
    var selectedWindowIndex = this.state.selectedWindowIndex
    var nextFilteredWindows = nextProps.filteredWindows

    if (selectedWindowIndex >= nextFilteredWindows.length) {
      if (nextFilteredWindows.length === 0) {
        this.setState({ selectedWindowIndex: 0, selectedTabIndex: -1 })
      } else {
        var lastWindow = nextFilteredWindows[nextFilteredWindows.length - 1]
        this.setState({ selectedWindowIndex: nextFilteredWindows.length - 1, selectedTabIndex: matchingTabsCount(this.props.searchStr, lastWindow) - 1 })
      }
    } else {
      const nextSearchStr = nextProps.searchStr
      var nextSelectedWindow = nextFilteredWindows[selectedWindowIndex]
      const matchCount = matchingTabsCount(nextSearchStr, nextSelectedWindow)
      var nextTabIndex = Math.min(this.state.selectedTabIndex, matchCount - 1)
      this.setState({ selectedTabIndex: nextTabIndex })
    }
  }

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
  updateScrollPos = (bodyRef, windowRef) => {
    const needScrollUpdate = (this.state.scrolledToWindowId !== this.props.winStore.currentWindowId) ||
      (this.state.scrolledToTabId !== this.props.winStore.getActiveTabId())

    /*
      console.log("updateScrollPos: scrolledToWindowId: ", this.state.scrolledToWindowId,
                  ", currentWindowId: ", this.props.winStore.currentWindowId );
      console.log("updateScrollPos: scrolledToTabId: ", this.state.scrolledToTabId,
                  ", activeTabId: ", this.props.winStore.getActiveTabId(),
                  ", needScroll: ", needScrollUpdate)
    */
    const isPopup = !(this.props.isPopout)
    if ((windowRef != null) && (bodyRef != null) &&
      needScrollUpdate &&
      this.props.filteredWindows.length > 0 &&
      !this.props.winStore.showRelNotes) {
      const viewportTop = bodyRef.scrollTop
      const viewportHeight = bodyRef.clientHeight

      const windowTop = windowRef.offsetTop
      const windowHeight = windowRef.scrollHeight

      // console.log("updateScrollPos: ", { offsetTop, viewportTop, viewportHeight, windowTop, windowHeight } )
      if ((windowTop < viewportTop) ||
        ((windowTop + windowHeight) > (viewportTop + viewportHeight)) ||
        isPopup) {
        // console.log("updateScrollPos: setting scroll position")

        if ((windowHeight > viewportHeight) || isPopup) {
          bodyRef.scrollTop = windowRef.offsetTop - bodyRef.offsetTop - Constants.FOCUS_SCROLL_BASE
        } else {
          // since we know only scroll if
          // set padding to center taget window in viewport:
          const viewportPad = (viewportHeight - windowHeight) / 2
          bodyRef.scrollTop = windowRef.offsetTop - bodyRef.offsetTop - viewportPad - Constants.FOCUS_SCROLL_BASE
        }
      }
      // Set the selected window and tab to the focused window and its currently active tab:

      const selectedWindow = this.props.filteredWindows[0]

      const selectedTabs = matchingTabs(this.props.searchStr, selectedWindow)

      const activeEntry = selectedTabs.findEntry((t) => t.open && t.openState.active)
      const activeTabIndex = activeEntry ? activeEntry[0] : 0
      const activeTabId = this.props.winStore.getActiveTabId()

      const updState = {
        scrolledToWindowId: this.props.winStore.currentWindowId,
        scrolledToTabId: activeTabId,
        selectedWindowIndex: 0,
        selectedTabIndex: activeTabIndex
      }

      // console.log("updateScrollPos: udpating State: ", updState)
      this.setState(updState)
    }
  };

  // Search input ref:
  setSearchInputRef = (ref) => {
    this.searchInputRef = ref
  };

  handleItemSelected = (item) => {
    if (this.searchInputRef) {
      // And reset the search field:
      this.searchInputRef.value = ''
      this.props.onSearchInput('')
    }
  };

  // Scrollable body (container) DOM ref
  setBodyRef = (ref) => {
    this.bodyRef = ref
    this.updateScrollPos(this.bodyRef, this.focusedWindowRef)
  };

  // DOM ref for currently focused tab window:
  setFocusedTabWindowRef = (ref) => {
    this.focusedWindowRef = ref
    this.updateScrollPos(this.bodyRef, this.focusedWindowRef)
  };

  componentDidUpdate () {
    this.updateScrollPos(this.bodyRef, this.focusedWindowRef)
  }

  render () {
    const winStore = this.props.winStore
    const openTabCount = winStore.countOpenTabs()
    const openWinCount = winStore.countOpenWindows()
    const savedCount = winStore.countSavedWindows()

    // const summarySentence=openTabCount + " Open Tabs, " + openWinCount + " Open Windows, " + savedCount + " Saved Windows"
    const summarySentence = 'Tabs: ' + openTabCount + ' Open. Windows: ' + openWinCount + ' Open, ' + savedCount + ' Saved.'

    return (
      <div className={popupInnerStyle}>
        <div className={popupHeaderStyle}>
          <SearchBar
            winStore={this.props.winStore}
            storeRef={this.props.storeRef}
            onSearchInput={this.props.onSearchInput}
            onSearchUp={this.handlePrevSelection}
            onSearchDown={this.handleNextSelection}
            onSearchEnter={this.handleSelectionEnter}
            onSearchExit={this.handleSearchExit}
            onSearchExpandToggle={this.handleSelectionExpandToggle}
            onShowPreferences={this.props.appComponent.openPreferencesModal}
            setInputRef={this.setSearchInputRef}
            isPopout={this.props.isPopout} />
        </div>
        <div className={popupBodyStyle} ref={this.setBodyRef}>
          <TabWindowList
            winStore={this.props.winStore}
            storeRef={this.props.storeRef}
            filteredWindows={this.props.filteredWindows}
            appComponent={this.props.appComponent}
            searchStr={this.props.searchStr}
            searchRE={this.props.searchRE}
            selectedWindowIndex={this.state.selectedWindowIndex}
            selectedTabIndex={this.state.selectedTabIndex}
            setFocusedTabWindowRef={this.setFocusedTabWindowRef}
            onItemSelected={this.handleItemSelected} />
        </div>
        <div className={popupFooterStyle}>
          <span className={summarySpanStyle}>{summarySentence}</span>
        </div>
      </div>
    )
  }
}

export default SelectablePopup
