'use strict';

import * as React from 'react';
import {addons} from 'react/addons';
import Styles from './styles';
import * as Util from './util';
import * as actions from '../actions';
const {PureRenderMixin, Perf} = addons;
import * as searchOps from '../searchOps';
import {refUpdater} from 'oneref';
import * as TabWindow from '../tabWindow';

import * as Modal from './Modal';
import RevertModal from './RevertModal';
import SaveModal from './SaveModal';
import SelectablePopup from './SelectablePopup';

/*
 * sort criteria for window list:
 *   open windows first, then alpha by title
 */
function windowCmpFn(tabWindowA, tabWindowB) {
  // focused window very first:
  const fA = tabWindowA.focused;
  const fB = tabWindowB.focused;
  if (fA != fB) {
    if (fA)
      return -1;
    else
      return 1;
  }

  // open windows first:
  if (tabWindowA.open != tabWindowB.open) {
    if (tabWindowA.open)
      return -1;
    else
      return 1;
  }

  var tA = tabWindowA.title;
  var tB = tabWindowB.title;
  return tA.localeCompare(tB);
}

const TabliPopup = React.createClass({
  storeAsState: function(winStore) {
    var tabWindows = winStore.getAll();

    var sortedWindows = tabWindows.sort(windowCmpFn);

    return {
      winStore: winStore,
      sortedWindows,
    };
  },

  getInitialState: function() {
    var st = this.storeAsState(this.props.initialWinStore);

    const w0 = st.sortedWindows[0];

    st.saveModalIsOpen = false;
    st.revertModalIsOpen = false;
    st.revertTabWindow = null;
    st.searchStr = '';
    st.searchRE = null;
    return st;
  },

  handleSearchInput(searchStr) {
    searchStr = searchStr.trim();

    var searchRE = null;
    if (searchStr.length > 0) {
      searchRE = new RegExp(searchStr, 'i');
    }

    console.log("search input: '" + searchStr + "'");
    this.setState({ searchStr, searchRE });
  },

  openSaveModal(tabWindow) {
    const initialTitle = tabWindow.title;
    this.setState({saveModalIsOpen: true, saveInitialTitle: initialTitle, saveTabWindow: tabWindow});
  },

  closeSaveModal() {
    this.setState({saveModalIsOpen: false});
  },

  openRevertModal(filteredTabWindow) {
    this.setState({revertModalIsOpen: true, revertTabWindow: filteredTabWindow.tabWindow});
  },

  closeRevertModal() {
    this.setState({revertModalIsOpen: false, revertTabWindow: null});
  },

  /* handler for save modal */
  doSave(titleStr) {
    const storeRef = this.props.storeRef;
    const tabliFolderId = storeRef.getValue().folderId;
    actions.manageWindow(tabliFolderId, this.state.saveTabWindow, titleStr, refUpdater(storeRef));
    this.closeSaveModal();
  },

  doRevert(tabWindow) {
    const updateHandler = refUpdater(this.props.storeRef);
    actions.revertWindow(this.state.revertTabWindow, updateHandler);
    this.closeRevertModal();
  },

  /* render save modal (or not) based on this.state.saveModalIsOpen */
  renderSaveModal() {
    var modal = null;
    if (this.state.saveModalIsOpen) {
      modal = <SaveModal initialTitle={this.state.saveInitialTitle}
                tabWindow={this.state.saveTabWindow}
                onClose={this.closeSaveModal}
                onSubmit={this.doSave}
                appComponent={this}
                />;
    }

    return modal;
  },

  /* render revert modal (or not) based on this.state.revertModalIsOpen */
  renderRevertModal() {
    var modal = null;
    if (this.state.revertModalIsOpen) {
      modal = <RevertModal
                tabWindow={this.state.revertTabWindow}
                onClose={this.closeRevertModal}
                onSubmit={this.doRevert}
                appComponent={this}
                />;
    }

    return modal;
  },

  render: function() {
    try {
      const saveModal = this.renderSaveModal();
      const revertModal = this.renderRevertModal();
      const filteredWindows = searchOps.filterTabWindows(this.state.sortedWindows, this.state.searchRE);
      var ret = (
        <div>
          <SelectablePopup
            onSearchInput={this.handleSearchInput}
            winStore={this.state.winStore}
            storeUpdateHandler={refUpdater(this.props.storeRef)}
            filteredWindows={filteredWindows}
            appComponent={this}
            searchStr={this.state.searchStr}
            searchRE={this.state.searchRE}
          />
          {saveModal}
          {revertModal}
        </div>
      );
    } catch (e) {
      console.error('App Component: caught exception during render: ');
      console.error(e.stack);
      throw e;
    }

    return ret;
  },

  componentWillMount: function() {
    if (this.props.noListener)
      return;

    const storeRef = this.props.storeRef;
    /*
     * This listener is essential for triggering a (recursive) re-render
     * in response to a state change.
     */
    var listenerId = storeRef.addViewListener(() => {
      console.log('TabliPopup: viewListener: updating store from storeRef');
      this.setState(this.storeAsState(storeRef.getValue()));
    });

    // console.log("componentWillMount: added view listener: ", listenerId);
    sendHelperMessage({ listenerId });
  },
});

/**
 * send message to BGhelper
 */
function sendHelperMessage(msg) {
  var port = chrome.runtime.connect({name: 'popup'});
  port.postMessage(msg);
  port.onMessage.addListener(function(msg) {
    console.log('Got response message: ', msg);
  });
}

export default TabliPopup;
