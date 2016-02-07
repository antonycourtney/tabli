'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _react = require('react');

var React = _interopRequireWildcard(_react);

var _actions = require('../actions');

var actions = _interopRequireWildcard(_actions);

var _searchOps = require('../searchOps');

var searchOps = _interopRequireWildcard(_searchOps);

var _oneref = require('oneref');

var _RevertModal = require('./RevertModal');

var _RevertModal2 = _interopRequireDefault(_RevertModal);

var _SaveModal = require('./SaveModal');

var _SaveModal2 = _interopRequireDefault(_SaveModal);

var _SelectableTabPage = require('./SelectableTabPage');

var _SelectableTabPage2 = _interopRequireDefault(_SelectableTabPage);

var _util = require('./util');

var Util = _interopRequireWildcard(_util);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

/**
 * send message to BGhelper
 */
function sendHelperMessage(msg) {
  var port = chrome.runtime.connect({ name: 'popup' });
  port.postMessage(msg);
  port.onMessage.addListener(function (response) {
    console.log('Got response message: ', response);
  });
}

var NewTabPage = React.createClass({
  displayName: 'NewTabPage',
  storeAsState: function storeAsState(winStore) {
    var tabWindows = winStore.getAll();

    var sortedWindows = tabWindows.sort(Util.windowCmp);

    return {
      winStore: winStore,
      sortedWindows: sortedWindows
    };
  },
  getInitialState: function getInitialState() {
    var st = this.storeAsState(this.props.initialWinStore);

    st.saveModalIsOpen = false;
    st.revertModalIsOpen = false;
    st.revertTabWindow = null;
    st.searchStr = '';
    st.searchRE = null;
    return st;
  },
  handleSearchInput: function handleSearchInput(rawSearchStr) {
    var searchStr = rawSearchStr.trim();

    var searchRE = null;
    if (searchStr.length > 0) {
      searchRE = new RegExp(searchStr, 'i');
    }

    console.log("search input: '" + searchStr + "'");
    this.setState({ searchStr: searchStr, searchRE: searchRE });
  },
  openSaveModal: function openSaveModal(tabWindow) {
    var initialTitle = tabWindow.title;
    this.setState({ saveModalIsOpen: true, saveInitialTitle: initialTitle, saveTabWindow: tabWindow });
  },
  closeSaveModal: function closeSaveModal() {
    this.setState({ saveModalIsOpen: false });
  },
  openRevertModal: function openRevertModal(filteredTabWindow) {
    this.setState({ revertModalIsOpen: true, revertTabWindow: filteredTabWindow.tabWindow });
  },
  closeRevertModal: function closeRevertModal() {
    this.setState({ revertModalIsOpen: false, revertTabWindow: null });
  },

  /* handler for save modal */
  doSave: function doSave(titleStr) {
    var storeRef = this.props.storeRef;
    var tabliFolderId = storeRef.getValue().folderId;
    actions.manageWindow(tabliFolderId, this.state.saveTabWindow, titleStr, (0, _oneref.refUpdater)(storeRef));
    this.closeSaveModal();
  },
  doRevert: function doRevert(tabWindow) {
    // eslint-disable-line no-unused-vars
    var updateHandler = (0, _oneref.refUpdater)(this.props.storeRef);
    actions.revertWindow(this.state.revertTabWindow, updateHandler);
    this.closeRevertModal();
  },

  /* render save modal (or not) based on this.state.saveModalIsOpen */
  renderSaveModal: function renderSaveModal() {
    var modal = null;
    if (this.state.saveModalIsOpen) {
      modal = React.createElement(_SaveModal2.default, { initialTitle: this.state.saveInitialTitle,
        tabWindow: this.state.saveTabWindow,
        onClose: this.closeSaveModal,
        onSubmit: this.doSave,
        appComponent: this
      });
    }

    return modal;
  },

  /* render revert modal (or not) based on this.state.revertModalIsOpen */
  renderRevertModal: function renderRevertModal() {
    var modal = null;
    if (this.state.revertModalIsOpen) {
      modal = React.createElement(_RevertModal2.default, {
        tabWindow: this.state.revertTabWindow,
        onClose: this.closeRevertModal,
        onSubmit: this.doRevert,
        appComponent: this
      });
    }

    return modal;
  },
  render: function render() {
    var ret;
    try {
      var saveModal = this.renderSaveModal();
      var revertModal = this.renderRevertModal();
      var filteredWindows = searchOps.filterTabWindows(this.state.sortedWindows, this.state.searchRE);
      ret = React.createElement(
        'div',
        null,
        React.createElement(_SelectableTabPage2.default, {
          onSearchInput: this.handleSearchInput,
          winStore: this.state.winStore,
          storeUpdateHandler: (0, _oneref.refUpdater)(this.props.storeRef),
          filteredWindows: filteredWindows,
          appComponent: this,
          searchStr: this.state.searchStr,
          searchRE: this.state.searchRE
        }),
        saveModal,
        revertModal
      );
    } catch (e) {
      console.error('App Component: caught exception during render: ');
      console.error(e.stack);
      throw e;
    }

    return ret;
  },
  componentWillMount: function componentWillMount() {
    var _this = this;

    if (this.props.noListener) {
      return;
    }

    var storeRef = this.props.storeRef;
    /*
     * This listener is essential for triggering a (recursive) re-render
     * in response to a state change.
     */
    var listenerId = storeRef.addViewListener(function () {
      console.log('TabliPopup: viewListener: updating store from storeRef');
      _this.setState(_this.storeAsState(storeRef.getValue()));
    });

    // console.log("componentWillMount: added view listener: ", listenerId);
    sendHelperMessage({ listenerId: listenerId });
  }
});

exports.default = NewTabPage;