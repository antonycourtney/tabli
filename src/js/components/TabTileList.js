import * as React from 'react';
import Styles from './styles';
import FilteredTabTile from './FilteredTabTile';
import WindowListSection from './WindowListSection';

const TabTileList = React.createClass({
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
      var isFocused = tabWindow.focused;
      var isSelected = (i === this.props.selectedWindowIndex);
      const selectedTabIndex = isSelected ? this.props.selectedTabIndex : -1;

      const initialExpandedState = isOpen ? null : true;
      var windowElem = (
        <FilteredTabTile winStore={this.props.winStore}
          storeUpdateHandler={this.props.storeUpdateHandler}
          filteredTabWindow={filteredTabWindow} key={id}
          searchStr={this.props.searchStr}
          searchRE={this.props.searchRE}
          isSelected={isSelected}
          selectedTabIndex={selectedTabIndex}
          appComponent={this.props.appComponent}
          initialExpandedState 
        />);
      if (isFocused) {
        focusedWindowElem = windowElem;
      } else if (isOpen) {
        openWindows.push(windowElem);
      } else {
        savedWindows.push(windowElem);
      }
    }
    return (
      <div>
        <WindowListSection title="Open Windows">
          <div style={Styles.tabTileContainer} >
              {focusedWindowElem}
              {openWindows}
          </div>
        </WindowListSection>
        <WindowListSection title="Closed, Saved Windows">
          <div style={Styles.tabTileContainer} >
              {savedWindows}
          </div>
        </WindowListSection>
      </div>
    );
  },
});

export default TabTileList;
