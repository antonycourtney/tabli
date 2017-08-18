import * as React from 'react'
import Styles from './styles'
import * as Util from './util'
import * as actions from '../actions'
import { DragItemTypes } from './constants'
import { DragSource, DropTarget } from 'react-dnd'

import * as PureRenderMixin from 'react-addons-pure-render-mixin'

import HeaderButton from './HeaderButton'

const PropTypes = React.PropTypes

const tabItemSource = {
  beginDrag (props) {
    return { sourceTabWindow: props.tabWindow, sourceTab: props.tab }
  }
}

// collect for use as drag source:
function collect (connect, monitor) {
  return {
    connectDragSource: connect.dragSource(),
    isDragging: monitor.isDragging()
  }
}

// for use as drop target:
const tabItemTarget = {
  drop (props, monitor, component) {
    const sourceItem = monitor.getItem()
    actions.moveTabItem(props.tabWindow, props.tabIndex + 1, sourceItem.sourceTab, props.storeRef)
  }
}

// coleect function for drop target:
function collectDropTarget (connect, monitor) {
  return {
    connectDropTarget: connect.dropTarget(),
    isOver: monitor.isOver()
  }
}

const TabItem = React.createClass({
  mixins: [PureRenderMixin],

  propTypes: {
    connectDragSource: PropTypes.func.isRequired,
    connectDropTarget: PropTypes.func.isRequired,
    isDragging: PropTypes.bool.isRequired,
    tabWindow: PropTypes.object.isRequired,
    tab: PropTypes.object.isRequired,
    tabIndex: PropTypes.number.isRequired,
    winStore: PropTypes.object.isRequired,
    storeRef: PropTypes.object.isRequired,
    isSelected: PropTypes.bool.isRequired,
    appComponent: PropTypes.object.isRequired,
    isOver: PropTypes.bool.isRequired,
    onItemSelected: PropTypes.func
  },

  handleClick (event) {
    var tabWindow = this.props.tabWindow
    var tab = this.props.tab
    var tabIndex = this.props.tabIndex

    // console.log("TabItem: handleClick: tab: ", tab)

    actions.activateTab(this.props.winStore.getCurrentWindow(), tabWindow, tab, tabIndex, this.props.storeRef)

    if (this.props.onItemSelected) {
      this.props.onItemSelected(tab)
    }
  },

  handleClose () {
    if (!this.props.tabWindow.open) {
      return
    }
    if (!this.props.tab.open) {
      return
    }
    var tabId = this.props.tab.openState.openTabId
    actions.closeTab(this.props.tabWindow, tabId, this.props.storeRef)
  },

  handleBookmarkTabItem (event) {
    event.stopPropagation()
    console.log('bookmark tab: ', this.props.tab.toJS())
    actions.saveTab(this.props.tabWindow, this.props.tab, this.props.storeRef)
  },

  handleUnbookmarkTabItem (event) {
    event.stopPropagation()
    console.log('unbookmark tab: ', this.props.tab.toJS())
    actions.unsaveTab(this.props.tabWindow, this.props.tab, this.props.storeRef)
  },

  render () {
    const { connectDragSource, connectDropTarget, isOver } = this.props
    var tabWindow = this.props.tabWindow
    var tab = this.props.tab

    var managed = tabWindow.saved

    var tabTitle = tab.title

    const tooltipContent = tabTitle + '\n' + tab.url

    // span style depending on whether open or closed window
    var tabOpenStyle = null
    var favIconOpenStyle = null
    var checkOpenStyle = null

    var tabCheckItem

    if (managed) {
      if (!tab.open) {
        tabOpenStyle = Styles.closed
        favIconOpenStyle = Styles.favIconClosed
        checkOpenStyle = Styles.imageButtonClosed
      }

      if (tab.saved) {
        tabCheckItem = (
          <button style={Util.merge(Styles.headerButton, Styles.tabManagedButton, checkOpenStyle)} title='Remove bookmark for this tab' onClick={this.handleUnbookmarkTabItem} />)

      // TODO: callback
      } else {
        // We used to include headerCheckbox, but that only set width and height
        // to something to 13x13; we want 16x16 from headerButton
        tabCheckItem = (
          <input
            className='tabCheck'
            style={Util.merge(Styles.headerButton, Styles.tabCheckItem)}
            type='checkbox'
            title='Bookmark this tab'
            onClick={this.handleBookmarkTabItem} />)
      }
    } else {
      // insert a spacer:
      tabCheckItem = <div style={Styles.headerButton} />
    }

    // const favIconUrl = tab.open ? tab.openState.favIconUrl : null
    // var fiSrc = favIconUrl ? favIconUrl : ''
    var fiSrc = 'chrome://favicon/size/16/' + tab.url

    // Skip the chrome FAVICONs; they just throw when accessed.
    if (fiSrc.indexOf('chrome://theme/') === 0) {
      fiSrc = ''
    }

    const emptyFavIcon = <div style={Util.merge(Styles.headerButton, Styles.emptyFavIcon)} />

    const favIconStyle = Util.merge(Styles.favIcon, favIconOpenStyle)

    var tabFavIcon = (fiSrc.length > 0) ? <img style={favIconStyle} src={fiSrc} /> : emptyFavIcon

    var tabActiveStyle = (tab.open && tab.openState.active) ? Styles.activeSpan : null
    var tabTitleStyles = Util.merge(Styles.text, Styles.tabTitle, Styles.noWrap, tabOpenStyle, tabActiveStyle)
    var selectedStyle = this.props.isSelected ? Styles.tabItemSelected : null

    var dropStyle = isOver ? Styles.tabItemDropOver : null

    const audibleIcon = (tab.open && tab.openState.audible) ? <div style={Util.merge(Styles.headerButton, Styles.audibleIcon)} /> : null

    var closeButton = (
      <HeaderButton
        className='closeButton'
        baseStyle={Styles.headerButton}
        visible={tab.open}
        title='Close Tab'
        onClick={this.handleClose} />)

    return connectDropTarget(connectDragSource(
      <div
        style={Util.merge(Styles.noWrap, Styles.tabItem, selectedStyle, dropStyle)}
        className='tabItem'
        onMouseOut={this.handleMouseOut}
        onMouseOver={this.handleMouseOver}
        onClick={this.handleClick}>
        {tabCheckItem}
        {tabFavIcon}
        <span style={tabTitleStyles} title={tooltipContent}>{tabTitle}</span>
        <div style={Styles.spacer} />
        {audibleIcon}
        {closeButton}
      </div>))
  }
})

const DropWrap = DropTarget(DragItemTypes.TAB_ITEM, tabItemTarget, collectDropTarget)
const DragWrap = DragSource(DragItemTypes.TAB_ITEM, tabItemSource, collect)

export default DropWrap(DragWrap(TabItem))
