import * as React from 'react';

import FilteredTabWindow from './FilteredTabWindow';
import WindowListSection from './WindowListSection';
import MessageCard from './MessageCard';

import * as actions from '../actions';

import * as util from './util';

var relNotesStr = '';

if (!util.isNode) {
  // in browser
  relNotesStr = require('../../html/relnotes.html');
}

const TabWindowList = React.createClass({

  /* acknowledge release notes (and hide them) */
  ackRelNotes() {
    actions.hideRelNotes(this.props.winStore,this.props.storeUpdateHandler);
  },

  render() {
    const showRelNotes = this.props.winStore.showRelNotes;

    var relNotesSection = null;
    if (showRelNotes) {
      relNotesSection = (
        <WindowListSection>
          <MessageCard
            winStore={this.props.winStore}
            storeUpdateHandler={this.props.storeUpdateHandler}
            content={relNotesStr}
            onClick={this.ackRelNotes} />
        </WindowListSection>
      );
    }


    var focusedWindowElem = [];
    var openWindows = [];
    var savedWindows = [];

    var filteredWindows = this.props.filteredWindows;
    for (var i = 0; i < filteredWindows.length; i++) {
      var filteredTabWindow = filteredWindows[i];
      var tabWindow = filteredTabWindow.tabWindow;
      var id = 'tabWindow' + i;
      var isOpen = tabWindow.open;
      const isFocused = isOpen && this.props.winStore.currentWindowId === tabWindow.openWindowId;

      // focused property will only be true if isFocused and no rel notes to display:
      const focusedProp = !showRelNotes && isFocused;

      var isSelected = (i === this.props.selectedWindowIndex);
      const selectedTabIndex = isSelected ? this.props.selectedTabIndex : -1;
      var windowElem = (
        <FilteredTabWindow winStore={this.props.winStore}
          storeUpdateHandler={this.props.storeUpdateHandler}
          filteredTabWindow={filteredTabWindow} key={id}
          index={i}
          searchStr={this.props.searchStr}
          searchRE={this.props.searchRE}
          isSelected={isSelected}
          isFocused={focusedProp}
          selectedTabIndex={selectedTabIndex}
          appComponent={this.props.appComponent}
          onItemSelected={this.props.onItemSelected}
          expandAll={this.props.winStore.expandAll}
        />);
      if (isFocused) {
        focusedWindowElem = windowElem;
      } else if (isOpen) {
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
        {relNotesSection}
        <WindowListSection focusedRef={this.props.setFocusedTabWindowRef} title="Current Window">
          {focusedWindowElem}
        </WindowListSection>
        <WindowListSection title="Other Open Windows">
          {openWindows}
        </WindowListSection>
        {savedSection}
      </div>
    );
  },
});

export default TabWindowList;
