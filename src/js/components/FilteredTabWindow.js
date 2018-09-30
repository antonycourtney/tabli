import * as React from 'react'
import * as Immutable from 'immutable'
import OldStyles from './oldStyles'
import * as Util from './util'
import { cx } from 'emotion'
import * as styles from './cssStyles'
import * as actions from '../actions'

import WindowHeader from './WindowHeader'
import TabItem from './TabItem'

class FilteredTabWindow extends React.Component {
  componentWillReceiveProps (nextProps) {
    if (nextProps.isSelected && !this.props.isSelected) {
      // If this window becomes selected:
      if (this.windowDivRef) {
        this.windowDivRef.scrollIntoViewIfNeeded()
      }
    }
  }

  handleOpen = () => {
    actions.openWindow(this.props.winStore.getCurrentWindow(), this.props.filteredTabWindow.tabWindow, this.props.storeRef)
    if (this.props.onItemSelected) {
      this.props.onItemSelected(this.props.filteredTabWindow.tabWindow)
    }
  };

  handleClose = (event) => { // eslint-disable-line no-unused-vars
    // console.log("handleClose")
    actions.closeWindow(this.props.filteredTabWindow.tabWindow, this.props.storeRef)
  };

  handleRevert = (event) => { // eslint-disable-line no-unused-vars
    var appComponent = this.props.appComponent
    appComponent.openRevertModal(this.props.filteredTabWindow)
  };

  /* expanded state follows window open/closed state unless it is
   * explicitly set interactively by the user
   */
  getExpandedState = () => {
    const tabWindow = this.props.filteredTabWindow.tabWindow
    return tabWindow.isExpanded(this.props.winStore)
  };

  renderTabItems = (tabWindow, tabs) => {
    /*
     * We tried explicitly checking for expanded state and
     * returning null if not expanded, but (somewhat surprisingly) it
     * was no faster, even with dozens of hidden tabs
     */
    var items = []
    for (var i = 0; i < tabs.count(); i++) {
      var id = 'tabItem-' + i
      const isSelected = (i === this.props.selectedTabIndex)
      var tabItem = (
        <TabItem
          winStore={this.props.winStore}
          storeRef={this.props.storeRef}
          tabWindow={tabWindow}
          tab={tabs.get(i)}
          key={id}
          tabIndex={i}
          isSelected={isSelected}
          appComponent={this.props.appComponent}
          onItemSelected={this.props.onItemSelected} />)
      items.push(tabItem)
    }

    var expanded = this.getExpandedState()
    var expandableContentStyle = expanded ? styles.expandablePanelContentOpen : styles.expandablePanelContentClosed
    var tabListStyle = cx(styles.tabList, expandableContentStyle)
    return (
      <div className={tabListStyle}>
        {items}
      </div>)
  };

  handleExpand = (expand) => {
    actions.expandWindow(this.props.filteredTabWindow.tabWindow, expand, this.props.storeRef)
  };

  render () {
    var filteredTabWindow = this.props.filteredTabWindow
    var tabWindow = filteredTabWindow.tabWindow
    var tabs
    if (this.props.searchStr.length === 0) {
      tabs = tabWindow.tabItems
    } else {
      tabs = filteredTabWindow.itemMatches.map((fti) => fti.tabItem)
    }

    /*
     * optimization:  Let's only render tabItems if expanded
     */
    var expanded = this.getExpandedState()
    var tabItems = null
    if (expanded) {
      tabItems = this.renderTabItems(tabWindow, tabs)
    } else {
      // render empty list of tab items to get -ve margin rollup layout right...
      tabItems = this.renderTabItems(tabWindow, Immutable.Seq())
    }

    var windowHeader = (
      <WindowHeader
        winStore={this.props.winStore}
        storeRef={this.props.storeRef}
        tabWindow={tabWindow}
        expanded={expanded}
        onExpand={this.handleExpand}
        onOpen={this.handleOpen}
        onRevert={this.handleRevert}
        onClose={this.handleClose}
        appComponent={this.props.appComponent}
        onItemSelected={this.props.onItemSelected} />)

    var selectedStyle = this.props.isSelected ? OldStyles.tabWindowSelected : null
    var focusedStyle = this.props.isFocused ? OldStyles.tabWindowFocused : null
    var windowStyles = Util.merge(OldStyles.tabWindow, OldStyles.expandablePanel, selectedStyle, focusedStyle)

    var windowDivProps = {
      style: windowStyles,
      ref: wdiv => { this.windowDivRef = wdiv }
    }
    return (
      <div {...windowDivProps}>
        {windowHeader}
        {tabItems}
      </div>
    )
  }
}

export default FilteredTabWindow
