import * as React from 'react';
import * as actions from '../actions';
import * as searchOps from '../searchOps';
import { refUpdater } from 'oneref';

import RevertModal from './RevertModal';
import SaveModal from './SaveModal';
import SelectableTabPage from './SelectableTabPage';
import * as Util from './util';

/**
 * send message to BGhelper
 */
function sendHelperMessage(msg) {
  var port = chrome.runtime.connect({ name: 'popup' });
  port.postMessage(msg);
  port.onMessage.addListener((response) => {
    console.log('Got response message: ', response);
  });
}

const NewTabPage = React.createClass({
  storeAsState(winStore) {
    var tabWindows = winStore.getAll();

    var sortedWindows = tabWindows.sort(Util.windowCmp);

    return {
      winStore,
      sortedWindows,
    };
  },

  getInitialState() {
    var st = this.storeAsState(this.props.initialWinStore);

    st.saveModalIsOpen = false;
    st.revertModalIsOpen = false;
    st.revertTabWindow = null;
    st.searchStr = '';
    st.searchRE = null;
    return st;
  },

  handleSearchInput(rawSearchStr) {
    const searchStr = rawSearchStr.trim();

    var searchRE = null;
    if (searchStr.length > 0) {
      searchRE = new RegExp(searchStr, 'i');
    }

    console.log("search input: '" + searchStr + "'");
    this.setState({ searchStr, searchRE });
  },

  openSaveModal(tabWindow) {
    const initialTitle = tabWindow.title;
    this.setState({ saveModalIsOpen: true, saveInitialTitle: initialTitle, saveTabWindow: tabWindow });
  },

  closeSaveModal() {
    this.setState({ saveModalIsOpen: false });
  },

  openRevertModal(filteredTabWindow) {
    this.setState({ revertModalIsOpen: true, revertTabWindow: filteredTabWindow.tabWindow });
  },

  closeRevertModal() {
    this.setState({ revertModalIsOpen: false, revertTabWindow: null });
  },

  /* handler for save modal */
  doSave(titleStr) {
    const storeRef = this.props.storeRef;
    const tabliFolderId = storeRef.getValue().folderId;
    actions.manageWindow(tabliFolderId, this.state.saveTabWindow, titleStr, refUpdater(storeRef));
    this.closeSaveModal();
  },

  doRevert(tabWindow) { // eslint-disable-line no-unused-vars
    const updateHandler = refUpdater(this.props.storeRef);
    actions.revertWindow(this.state.revertTabWindow, updateHandler);
    this.closeRevertModal();
  },

  /* render save modal (or not) based on this.state.saveModalIsOpen */
  renderSaveModal() {
    var modal = null;
    if (this.state.saveModalIsOpen) {
      modal = (
        <SaveModal initialTitle={this.state.saveInitialTitle}
          tabWindow={this.state.saveTabWindow}
          onClose={this.closeSaveModal}
          onSubmit={this.doSave}
          appComponent={this}
        />);
    }

    return modal;
  },

  /* render revert modal (or not) based on this.state.revertModalIsOpen */
  renderRevertModal() {
    var modal = null;
    if (this.state.revertModalIsOpen) {
      modal = (
        <RevertModal
          tabWindow={this.state.revertTabWindow}
          onClose={this.closeRevertModal}
          onSubmit={this.doRevert}
          appComponent={this}
        />);
    }

    return modal;
  },

  render() {
    var ret;
    try {
      const saveModal = this.renderSaveModal();
      const revertModal = this.renderRevertModal();
      const filteredWindows = searchOps.filterTabWindows(this.state.sortedWindows, this.state.searchRE);
      ret = (
        <div>
          <SelectableTabPage
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

  componentWillMount() {
    if (this.props.noListener) {
      return;
    }

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


export default NewTabPage;
