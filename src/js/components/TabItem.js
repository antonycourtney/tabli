import * as log from 'loglevel'
import PropTypes from 'prop-types'
import * as React from 'react'
import * as styles from './cssStyles'
import { cx, css } from 'emotion'
import * as actions from '../actions'
import { DragItemTypes } from './constants'
import { DragSource, DropTarget } from 'react-dnd'
import HeaderButton from './HeaderButton'
import HeaderCheckbox from './HeaderCheckbox'
import { ThemeContext } from './themeContext'
import * as tabItemUtil from './tabItemUtil'

// Note explicit global css class name tabItemHoverContainer
// Due to limitation of nested class selectors with composition;
// see https://emotion.sh/docs/nested for more info.
const tabItemHoverVisible = css`
  visibility: hidden;
  .tabItemHoverContainer:hover & {
    visibility: visible;
  }
`

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
  static contextType = ThemeContext
  handleClick = (event) => {
    event.preventDefault()
    event.stopPropagation()
    var tabWindow = this.props.tabWindow
    var tab = this.props.tab
    var tabIndex = this.props.tabIndex

    // log.log("TabItem: handleClick: tab: ", tab)

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
    log.log('bookmark tab: ', this.props.tab.toJS())
    actions.saveTab(this.props.tabWindow, this.props.tab, this.props.storeRef)
  };

  handleUnbookmarkTabItem = (event) => {
    event.stopPropagation()
    log.log('unbookmark tab: ', this.props.tab.toJS())
    actions.unsaveTab(this.props.tabWindow, this.props.tab, this.props.storeRef)
  };

  render () {
    let theme = this.context
    // log.log('TabItem: theme: ', theme)
    const { connectDragSource, connectDropTarget, isOver } = this.props
    var tabWindow = this.props.tabWindow
    var tab = this.props.tab

    var managed = tabWindow.saved

    var tabTitle = tab.title

    const tooltipContent = tabTitle + '\n' + tab.url

    // span style depending on whether open or closed window
    var tabOpenStateStyle = null

    var tabCheckItem

    if (managed) {
      const tabTitleClosedHover = css({
        '&:hover': {
          color: theme.closedGray
        },
      })
      const tabTitleClosed = cx(styles.closed(theme), tabTitleClosedHover)

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

    const tabFavIcon = tabItemUtil.mkFavIcon(tab)
    var tabActiveStyle = (tab.open && tab.openState.active) ? styles.activeSpan : null
    var tabTitleStyle = cx(styles.text, styles.tabTitle, styles.noWrap, tabOpenStateStyle, tabActiveStyle)
    var selectedStyle = this.props.isSelected ? styles.tabItemSelected(theme) : null

    var dropStyle = isOver ? styles.tabItemDropOver : null

    const audibleIcon = (tab.open && tab.openState.audible) ? <div className={audibleIconStyle} /> : null

    const tabItemCloseButtonStyle = cx(styles.headerButton, tabItemHoverVisible, styles.closeButtonBaseStyle(theme))

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
