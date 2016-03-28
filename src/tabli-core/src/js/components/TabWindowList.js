import * as React from 'react';

import FilteredTabWindow from './FilteredTabWindow';
import WindowListSection from './WindowListSection';

const TabWindowList = React.createClass({




  render() {
    var focusedWindowElem = [];
    var openWindows = [];
    var savedWindows = [];

    var filteredWindows = this.props.filteredWindows;
    for (var i = 0; i < filteredWindows.length; i++) {
      var filteredTabWindow = filteredWindows[i];
      var tabWindow = filteredTabWindow.tabWindow;
      var id = 'tabWindow' + i;
      var isOpen = tabWindow.open;
      var isFocused = isOpen && this.props.winStore.currentWindowId === tabWindow.openWindowId;
      var isSelected = (i === this.props.selectedWindowIndex);
      var focusedRefCb = isFocused ? this.props.setFocusedTabWindowRef : null;
      const selectedTabIndex = isSelected ? this.props.selectedTabIndex : -1;
      var windowElem = (
        <FilteredTabWindow winStore={this.props.winStore}
          storeUpdateHandler={this.props.storeUpdateHandler}
          filteredTabWindow={filteredTabWindow} key={id}
          searchStr={this.props.searchStr}
          searchRE={this.props.searchRE}
          isSelected={isSelected}
          isFocused={isFocused}
          focusedRef={focusedRefCb}
          selectedTabIndex={selectedTabIndex}
          appComponent={this.props.appComponent}
        />);
      if (isFocused) {
        focusedWindowElem = windowElem;
      }
      if (isOpen) {
        openWindows.push(windowElem);
      } else {
        savedWindows.push(windowElem);
      }
    }

    var savedSection = null;
    if (savedWindows.length > 0) {
      savedSection = (
        <WindowListSection title="Saved Closed Windows">
          {savedWindows}
        </WindowListSection>
      );
    }

    return (
      <div>
        <WindowListSection title="Open Windows">
          {openWindows}
        </WindowListSection>
        {savedSection}
      </div>
    );
  },
});

export default TabWindowList;
