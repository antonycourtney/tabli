'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _react = require('react');

var React = _interopRequireWildcard(_react);

var _reactDom = require('react-dom');

var ReactDOM = _interopRequireWildcard(_reactDom);

var _immutable = require('immutable');

var Immutable = _interopRequireWildcard(_immutable);

var _styles = require('./styles');

var _styles2 = _interopRequireDefault(_styles);

var _util = require('./util');

var Util = _interopRequireWildcard(_util);

var _actions = require('../actions');

var actions = _interopRequireWildcard(_actions);

var _Hoverable = require('./Hoverable');

var _Hoverable2 = _interopRequireDefault(_Hoverable);

var _WindowHeader = require('./WindowHeader');

var _WindowHeader2 = _interopRequireDefault(_WindowHeader);

var _TabItem = require('./TabItem');

var _TabItem2 = _interopRequireDefault(_TabItem);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var FilteredTabWindow = React.createClass({
  displayName: 'FilteredTabWindow',

  mixins: [_Hoverable2.default],

  getInitialState: function getInitialState() {
    // Note:  We initialize this with null rather than false so that it will follow
    // open / closed state of window
    return { expanded: null };
  },
  componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
    if (nextProps.isSelected && !this.props.isSelected) {
      // scroll div for this window into view:
      ReactDOM.findDOMNode(this.refs.windowDiv).scrollIntoViewIfNeeded();
    }
  },
  handleOpen: function handleOpen() {
    console.log('handleOpen', this, this.props);
    actions.openWindow(this.props.filteredTabWindow.tabWindow, this.props.storeUpdateHandler);
  },
  handleClose: function handleClose(event) {
    // eslint-disable-line no-unused-vars
    // console.log("handleClose");
    actions.closeWindow(this.props.filteredTabWindow.tabWindow, this.props.storeUpdateHandler);
  },
  handleRevert: function handleRevert(event) {
    // eslint-disable-line no-unused-vars
    var appComponent = this.props.appComponent;
    appComponent.openRevertModal(this.props.filteredTabWindow);
  },


  /* expanded state follows window open/closed state unless it is
   * explicitly set interactively by the user
   */
  getExpandedState: function getExpandedState() {
    if (this.state.expanded === null) {
      return this.props.filteredTabWindow.tabWindow.open;
    }
    return this.state.expanded;
  },
  renderTabItems: function renderTabItems(tabWindow, tabs) {
    /*
     * We tried explicitly checking for expanded state and
     * returning null if not expanded, but (somewhat surprisingly) it
     * was no faster, even with dozens of hidden tabs
     */
    var items = [];
    for (var i = 0; i < tabs.count(); i++) {
      var id = 'tabItem-' + i;
      var isSelected = i === this.props.selectedTabIndex;
      var tabItem = React.createElement(_TabItem2.default, { winStore: this.props.winStore,
        storeUpdateHandler: this.props.storeUpdateHandler,
        tabWindow: tabWindow,
        tab: tabs.get(i),
        key: id,
        tabIndex: i,
        isSelected: isSelected,
        appComponent: this.props.appComponent
      });
      items.push(tabItem);
    }

    var expanded = this.getExpandedState();
    var expandableContentStyle = expanded ? _styles2.default.expandablePanelContentOpen : _styles2.default.expandablePanelContentClosed;
    var tabListStyle = Util.merge(_styles2.default.tabList, expandableContentStyle);
    return React.createElement(
      'div',
      { style: tabListStyle },
      items
    );
  },
  handleExpand: function handleExpand(expand) {
    this.setState({ expanded: expand });
  },
  render: function render() {
    var filteredTabWindow = this.props.filteredTabWindow;
    var tabWindow = filteredTabWindow.tabWindow;
    var tabs;
    if (this.props.searchStr.length === 0) {
      tabs = tabWindow.tabItems;
    } else {
      tabs = filteredTabWindow.itemMatches.map(function (fti) {
        return fti.tabItem;
      });
    }

    /*
     * optimization:  Let's only render tabItems if expanded
     */
    var expanded = this.getExpandedState();
    var tabItems = null;
    if (expanded) {
      tabItems = this.renderTabItems(tabWindow, tabs);
    } else {
      // render empty list of tab items to get -ve margin rollup layout right...
      tabItems = this.renderTabItems(tabWindow, Immutable.Seq());
    }

    var windowHeader = React.createElement(_WindowHeader2.default, { winStore: this.props.winStore,
      storeUpdateHandler: this.props.storeUpdateHandler,
      tabWindow: tabWindow,
      expanded: expanded,
      onExpand: this.handleExpand,
      onOpen: this.handleOpen,
      onRevert: this.handleRevert,
      onClose: this.handleClose,
      appComponent: this.props.appComponent
    });

    var selectedStyle = this.props.isSelected ? _styles2.default.tabWindowSelected : null;
    var windowStyles = Util.merge(_styles2.default.tabWindow, _styles2.default.expandablePanel, selectedStyle);

    return React.createElement(
      'div',
      { ref: 'windowDiv', style: windowStyles, onMouseOver: this.handleMouseOver, onMouseOut: this.handleMouseOut },
      windowHeader,
      tabItems
    );
  }
});

exports.default = FilteredTabWindow;