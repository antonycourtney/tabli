'use strict';

import * as React from 'react';
import * as Immutable from 'immutable';
import {addons} from 'react/addons';
import Styles from './styles';
import * as Util from './util';
const {PureRenderMixin, Perf} = addons;

import * as actions from '../actions';
import SearchBar from './SearchBar';
import TabWindowList from './TabWindowList';

function tabCount(searchStr, filteredTabWindow) {
  var ret = (searchStr.length > 0) ? filteredTabWindow.itemMatches.count() : filteredTabWindow.tabWindow.tabItems.count();
  return ret;
}

function selectedTab(filteredTabWindow, searchStr, tabIndex) {
  if (searchStr.length == 0) {
    var tabWindow = filteredTabWindow.tabWindow;
    var tabItem = tabWindow.tabItems.get(tabIndex);
    return tabItem;
  } else {
    var filteredItem = filteredTabWindow.itemMatches.get(tabIndex);
    return filteredItem.tabItem;
  }
}

/**
 * An element that manages the selection.
 *
 * We want this as a distinct element from its parent TabMan, because it does local state management
 * and validation that should happen with respect to the (already calculated) props containing
 * filtered windows that we receive from above
 */
const SelectablePopup = React.createClass({
  getInitialState: function() {
    return {
      selectedWindowIndex: 0,
      selectedTabIndex: 0,
    };
  },

  handlePrevSelection: function(byPage) {
    if (this.props.filteredWindows.length === 0)
      return;
    const selectedWindow = this.props.filteredWindows[this.state.selectedWindowIndex];

    // const tabCount = (this.props.searchStr.length > 0) ? selectedWindow.itemMatches.count() : selectedWindow.tabWindow.tabItems.count();

    if (selectedWindow.tabWindow.open && this.state.selectedTabIndex > 0 && !byPage) {
      this.setState({ selectedTabIndex: this.state.selectedTabIndex - 1 });
    } else {
      // Already on first tab, try to back up to previous window:
      if (this.state.selectedWindowIndex > 0) {
        const prevWindowIndex = this.state.selectedWindowIndex - 1;
        const prevWindow = this.props.filteredWindows[prevWindowIndex];
        const prevTabCount = (this.props.searchStr.length > 0) ? prevWindow.itemMatches.count() : prevWindow.tabWindow.tabItems.count();

        this.setState({ selectedWindowIndex: prevWindowIndex, selectedTabIndex: prevTabCount - 1 });
      }
    }
  },

  handleNextSelection: function(byPage) {
    if (this.props.filteredWindows.length === 0)
      return;
    const selectedWindow = this.props.filteredWindows[this.state.selectedWindowIndex];
    const tabCount = (this.props.searchStr.length > 0) ? selectedWindow.itemMatches.count() : selectedWindow.tabWindow.tabItems.count();

    // We'd prefer to use expanded state of window rather then open/closed state,
    // but that's hidden in the component...
    if (selectedWindow.tabWindow.open && (this.state.selectedTabIndex + 1) < tabCount && !byPage) {
      this.setState({ selectedTabIndex: this.state.selectedTabIndex + 1 });
    } else {
      // Already on last tab, try to advance to next window:
      if ((this.state.selectedWindowIndex + 1) < this.props.filteredWindows.length) {
        this.setState({ selectedWindowIndex: this.state.selectedWindowIndex + 1, selectedTabIndex: 0 });
      }
    }
  },

  handleSelectionEnter: function() {
    if (this.props.filteredWindows.length == 0)
      return;

    // TODO: deal with this.state.selectedTabIndex==-1

    const selectedWindow = this.props.filteredWindows[this.state.selectedWindowIndex];
    const selectedTabItem = selectedTab(selectedWindow, this.props.searchStr, this.state.selectedTabIndex);
    console.log('opening: ', selectedTabItem.toJS());
    actions.activateTab(selectedWindow.tabWindow, selectedTabItem, this.state.selectedTabIndex, this.props.storeUpdateHandler);
  },

  componentWillReceiveProps: function(nextProps) {
    var selectedWindowIndex = this.state.selectedWindowIndex;
    var selectedTabIndex = this.state.selectedTabIndex;
    var nextFilteredWindows = nextProps.filteredWindows;

    if (selectedWindowIndex >= nextFilteredWindows.length) {
      if (nextFilteredWindows.length == 0) {
        this.setState({selectedWindowIndex: 0, selectedTabIndex: -1});
        console.log('resetting indices');
      } else {
        var lastWindow = nextFilteredWindows[nextFilteredWindows.length - 1];
        this.setState({selectedWindowIndex: nextFilteredWindows.length - 1, selectedTabIndex: tabCount(this.props.searchStr, lastWindow) - 1});
      }
    } else {
      var nextSelectedWindow = nextFilteredWindows[selectedWindowIndex];
      var nextTabIndex = Math.min(this.state.selectedTabIndex, tabCount(this.props.searchStr, nextSelectedWindow) - 1);
      this.setState({selectedTabIndex: nextTabIndex});
    }
  },

  render: function() {
    const winStore = this.props.winStore;
    const openTabCount = winStore.countOpenTabs();
    const openWinCount = winStore.countOpenWindows();
    const savedCount = winStore.countSavedWindows();

    // const summarySentence=openTabCount + " Open Tabs, " + openWinCount + " Open Windows, " + savedCount + " Saved Windows"
    const summarySentence = 'Tabs: ' + openTabCount + ' Open. Windows: ' + openWinCount + ' Open, ' + savedCount + ' Saved.';

    return (
      <div>
        <div style={Styles.popupHeader}>
          <SearchBar onSearchInput={this.props.onSearchInput}
                     onSearchUp={this.handlePrevSelection}
                     onSearchDown={this.handleNextSelection}
                     onSearchEnter={this.handleSelectionEnter}
                     />
        </div>
        <div style={Styles.popupBody}>
          <TabWindowList winStore={this.props.winStore}
                           storeUpdateHandler={this.props.storeUpdateHandler}
                           filteredWindows={this.props.filteredWindows}
                           appComponent={this.props.appComponent}
                           searchStr={this.props.searchStr}
                           searchRE={this.props.searchRE}
                           selectedWindowIndex={this.state.selectedWindowIndex}
                           selectedTabIndex={this.state.selectedTabIndex}
                           />
         </div>
         <div style={Styles.popupFooter}>
          <span style={Util.merge(Styles.closed, Styles.summarySpan)}>{summarySentence}</span>
         </div>
      </div>
    );
  },
});

export default SelectablePopup;
