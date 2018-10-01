import PropTypes from 'prop-types'
import * as React from 'react'
import * as styles from './cssStyles'

import * as colors from './colors'
import * as actions from '../actions'
import { DragItemTypes } from './constants'
import { DragSource, DropTarget } from 'react-dnd'
import HeaderButton from './HeaderButton'
import HeaderCheckbox from './HeaderCheckbox'
import { cx, css } from 'emotion'

const emptyFavIconStyle = cx(styles.headerButton, styles.emptyFavIcon)
const favIconOpenStyle = styles.favIcon
const favIconClosedStyle = cx(styles.favIcon, styles.favIconClosed)

// Note explicit global css class name tabItemHoverContainer
// Due to limitation of nested class selectors with composition;
// see https://emotion.sh/docs/nested for more info.
const tabItemHoverVisible = css`
  visibility: hidden;
  .tabItemHoverContainer:hover & {
    visibility: visible;
  }
`
const tabItemCloseButtonStyle = cx(styles.headerButton, tabItemHoverVisible, styles.closeButtonBaseStyle)

const audibleIconStyle = cx(styles.headerButton, styles.audibleIcon)

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

class TabItem extends React.PureComponent {
  static propTypes = {
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
  };

  handleClick = (event) => {
    event.preventDefault()
    event.stopPropagation()
    var tabWindow = this.props.tabWindow
    var tab = this.props.tab
    var tabIndex = this.props.tabIndex

    // console.log("TabItem: handleClick: tab: ", tab)

    actions.activateTab(this.props.winStore.getCurrentWindow(), tabWindow, tab, tabIndex, this.props.storeRef)

    if (this.props.onItemSelected) {
      this.props.onItemSelected(tab)
    }
  };

  handleClose = () => {
    if (!this.props.tabWindow.open) {
      return
    }
    if (!this.props.tab.open) {
      return
    }
    var tabId = this.props.tab.openState.openTabId
    actions.closeTab(this.props.tabWindow, tabId, this.props.storeRef)
  };

  handleBookmarkTabItem = (event) => {
    event.stopPropagation()
    console.log('bookmark tab: ', this.props.tab.toJS())
    actions.saveTab(this.props.tabWindow, this.props.tab, this.props.storeRef)
  };

  handleUnbookmarkTabItem = (event) => {
    event.stopPropagation()
    console.log('unbookmark tab: ', this.props.tab.toJS())
    actions.unsaveTab(this.props.tabWindow, this.props.tab, this.props.storeRef)
  };

  render () {
    const { connectDragSource, connectDropTarget, isOver } = this.props
    var tabWindow = this.props.tabWindow
    var tab = this.props.tab

    var managed = tabWindow.saved

    var tabTitle = tab.title

    const tooltipContent = tabTitle + '\n' + tab.url

    // span style depending on whether open or closed window
    var tabOpenStateStyle = null

    const favIconStyle = tab.open ? favIconOpenStyle : favIconClosedStyle

    var tabCheckItem

    if (managed) {
      const tabTitleClosedHover = css({
        '&:hover': {
          color: colors.closedGray
        },
      })
      const tabTitleClosed = cx(styles.closed, tabTitleClosedHover)

      if (!tab.open) {
        tabOpenStateStyle = tabTitleClosed
      }
      const checkTitle = tab.saved ? 'Remove bookmark for this tab' : 'Bookmark this tab'
      const checkOnClick = tab.saved ? this.handleUnbookmarkTabItem : this.handleBookmarkTabItem

      tabCheckItem = (
        <HeaderCheckbox
          extraUncheckedStyle={tabItemHoverVisible}
          title={checkTitle}
          open={tab.open}
          onClick={checkOnClick}
          value={tab.saved}
        />)
    } else {
      // insert a spacer:
      tabCheckItem = <div className={styles.headerButton} />
    }
    // const favIconUrl = tab.open ? tab.openState.favIconUrl : null
    // var fiSrc = favIconUrl ? favIconUrl : ''
    var fiSrc = 'chrome://favicon/size/16/' + tab.url

    // Skip the chrome FAVICONs; they just throw when accessed.
    if (fiSrc.indexOf('chrome://theme/') === 0) {
      fiSrc = ''
    }

    const emptyFavIcon = <div className={emptyFavIconStyle} />

    var tabFavIcon = (fiSrc.length > 0) ? <img className={favIconStyle} src={fiSrc} /> : emptyFavIcon

    var tabActiveStyle = (tab.open && tab.openState.active) ? styles.activeSpan : null
    var tabTitleStyle = cx(styles.text, styles.tabTitle, styles.noWrap, tabOpenStateStyle, tabActiveStyle)
    var selectedStyle = this.props.isSelected ? styles.tabItemSelected : null

    var dropStyle = isOver ? styles.tabItemDropOver : null

    const audibleIcon = (tab.open && tab.openState.audible) ? <div className={audibleIconStyle} /> : null

    const closeButton = (
      <HeaderButton
        className={tabItemCloseButtonStyle}
        visible={tab.open}
        title='Close Window'
        onClick={this.handleClose} />)

    // Note explicit global css class name tabItemHoverContainer here
    // Due to limitation of nested class selectors with composition;
    // see https://emotion.sh/docs/nested for more info.

    const tabItemStyle = cx(styles.noWrap, styles.tabItem, selectedStyle, dropStyle)

    return connectDropTarget(connectDragSource(
      <div
        className = {tabItemStyle + ' tabItemHoverContainer'}
        onClick={this.handleClick}>
        <div className={styles.rowItemsFixedWidth}>
          {tabCheckItem}
          {tabFavIcon}
        </div>
        <a
          href={tab.url}
          className={tabTitleStyle}
          title={tooltipContent}
          onClick={this.handleClick}>{tabTitle}</a>
        <div className={styles.rowItemsFixedWidth}>
          {audibleIcon}
          {closeButton}
        </div>
      </div>))
  }
}

const DropWrap = DropTarget(DragItemTypes.TAB_ITEM, tabItemTarget, collectDropTarget)
const DragWrap = DragSource(DragItemTypes.TAB_ITEM, tabItemSource, collect)

export default DropWrap(DragWrap(TabItem))
