import * as React from 'react';
import * as Immutable from 'immutable';
import Styles from './styles';
import * as Util from './util';

import * as actions from '../actions';

import Hoverable from './Hoverable';
import WindowHeader from './WindowHeader';
import TabItem from './TabItem';


const FilteredTabWindow = React.createClass({
  mixins: [Hoverable],

  getInitialState() {
    // Note:  We initialize this with null rather than false so that it will follow
    // open / closed state of window
    return ({ expanded: null });
  },

  componentWillReceiveProps(nextProps) {
    if (nextProps.isSelected && !this.props.isSelected) {
      // scroll div for this window into view:
      React.findDOMNode(this.refs.windowDiv).scrollIntoViewIfNeeded();
    }
  },

  handleOpen() {
    console.log('handleOpen', this, this.props);
    actions.openWindow(this.props.filteredTabWindow.tabWindow, this.props.storeUpdateHandler);
  },

  handleClose(event) {  // eslint-disable-line no-unused-vars
    // console.log("handleClose");
    actions.closeWindow(this.props.filteredTabWindow.tabWindow, this.props.storeUpdateHandler);
  },

  handleRevert(event) { // eslint-disable-line no-unused-vars
    var appComponent = this.props.appComponent;
    appComponent.openRevertModal(this.props.filteredTabWindow);
  },

  /* expanded state follows window open/closed state unless it is
   * explicitly set interactively by the user
   */
  getExpandedState() {
    if (this.state.expanded === null) {
      return this.props.filteredTabWindow.tabWindow.open;
    }
    return this.state.expanded;
  },

  renderTabItems(tabWindow, tabs) {
    /*
     * We tried explicitly checking for expanded state and
     * returning null if not expanded, but (somewhat surprisingly) it
     * was no faster, even with dozens of hidden tabs
     */
    var items = [];
    for (var i = 0; i < tabs.count(); i++) {
      var id = 'tabItem-' + i;
      const isSelected = (i === this.props.selectedTabIndex);
      var tabItem = (
        <TabItem winStore={this.props.winStore}
          storeUpdateHandler={this.props.storeUpdateHandler}
          tabWindow={tabWindow}
          tab={tabs.get(i)}
          key={id}
          tabIndex={i}
          isSelected={isSelected}
          appComponent={this.props.appComponent}
        />);
      items.push(tabItem);
    }

    var expanded = this.getExpandedState();
    var expandableContentStyle = expanded ? Styles.expandablePanelContentOpen : Styles.expandablePanelContentClosed;
    var tabListStyle = Util.merge(Styles.tabList, expandableContentStyle);
    return (
      <div style={tabListStyle} >
        {items}
      </div>);
  },

  handleExpand(expand) {
    this.setState({ expanded: expand });
  },


  render() {
    var filteredTabWindow = this.props.filteredTabWindow;
    var tabWindow = filteredTabWindow.tabWindow;
    var tabs;
    if (this.props.searchStr.length === 0) {
      tabs = tabWindow.tabItems;
    } else {
      tabs = filteredTabWindow.itemMatches.map((fti) => fti.tabItem);
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

    var windowHeader = (
      <WindowHeader winStore={this.props.winStore}
        storeUpdateHandler={this.props.storeUpdateHandler}
        tabWindow={tabWindow}
        expanded={expanded}
        onExpand={this.handleExpand}
        onOpen={this.handleOpen}
        onRevert={this.handleRevert}
        onClose={this.handleClose}
        appComponent={this.props.appComponent}
      />);

    var selectedStyle = this.props.isSelected ? Styles.tabWindowSelected : null;
    var windowStyles = Util.merge(Styles.tabWindow, Styles.expandablePanel, selectedStyle);

    return (
      <div ref="windowDiv" style={windowStyles} onMouseOver={this.handleMouseOver} onMouseOut={this.handleMouseOut} >
        {windowHeader}
        {tabItems}
      </div>
      );
  },
});

export default FilteredTabWindow;
