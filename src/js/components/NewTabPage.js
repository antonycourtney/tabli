// @flow
/* globals chrome */
import * as React from 'react'
import * as Util from './util'
import * as Constants from './constants'
import { DragDropContext } from 'react-dnd'
import HTML5Backend from 'react-dnd-html5-backend'
import * as immutable from 'immutable'
import * as searchOps from '../searchOps'
import * as actions from '../actions'
import TabSearchCard from './TabSearchCard'

class NewTabPage extends React.Component {
  state: Object
  searchInputRef: ?Object
  _matchInfo: ?Array<Object>

  constructor (props, context) {
    super(props, context)
    const st : Object = this.storeAsState(props.initialWinStore, true)
    st.searchStr = ''
    st.searchRE = null
    this.state = st
  }

  storeAsState = (winStore) => {
    var tabWindows = winStore.getAll()
    var cmpFn = Util.windowCmp(winStore.currentWindowId)
    var sortedWindows = tabWindows.sort(cmpFn)

    return {
      winStore,
      sortedWindows,
      selectedIndex: -1
    }
  };

  handleSearchInput = (rawSearchStr) => {
    const searchStr = rawSearchStr.trim()
    // console.log('searchStr: "' + searchStr + '"')
    var searchRE = null
    if (searchStr.length > 0) {
      searchRE = new RegExp(searchStr, 'i')
    }

    this.setState({ searchStr, searchRE })
    delete this._matchInfo
  };

  setInputRef = (ref) => {
    this.searchInputRef = ref
    if (this.props.setInputRef) {
      this.props.setInputRef(ref)
    }
  };

  handleChange = () => {
    const inputRef = this.searchInputRef
    if (inputRef != null) {
      const searchStr = inputRef.value
      this.handleSearchInput(searchStr)
    }
  };

  selectUp = () => {
    if (!this.matchInfo || this.matchInfo.length === 0) {
      return
    }
    let prevIndex
    if (this.state.selectedIndex > 0) {
      prevIndex = this.state.selectedIndex - 1
    } else {
      prevIndex = this.matchInfo.length - 1
    }
    this.setState({selectedIndex: prevIndex})
  }

  selectDown = () => {
    if (!this.matchInfo || this.matchInfo.length === 0) {
      return
    }
    let nextIndex
    if (this.state.selectedIndex < (this.matchInfo.length - 1)) {
      nextIndex = this.state.selectedIndex + 1
    } else {
      nextIndex = 0
    }
    this.setState({selectedIndex: nextIndex})
  }

  selectEnter = () => {
    const matchInfo = this.matchInfo
    const { selectedIndex } = this.state
    if (!matchInfo || matchInfo.length === 0 || selectedIndex > matchInfo.length) {
      return
    }
    const selData = matchInfo[selectedIndex].data
    const { storeRef } = this.props
    const winStore = storeRef.getValue()
    const currentWindow = winStore.getCurrentWindow()
    actions.activateTab(currentWindow, selData.tabWindow, selData.tabItem, undefined, this.props.storeRef)
  }

  searchExit = () => {
    console.log('clear selection')
  }

  handleKeyDown = (e) => {
    // console.log('handleKeyDown: ', _.omit(e, _.isObject))
    if ((!e.ctrlKey && e.keyCode === Constants.KEY_UP) ||
      (e.ctrlKey && !e.shiftKey && e.keyCode === Constants.KEY_P)) {
      e.preventDefault()
      this.selectUp()
    }

    if ((!e.ctrlKey && e.keyCode === Constants.KEY_DOWN) ||
      (e.ctrlKey && !e.shiftKey && e.keyCode === Constants.KEY_N)) {
      e.preventDefault()
      this.selectDown()
    }

    if (e.keyCode === Constants.KEY_TAB) {
      // We need to determine if it was forward or backwards tab:
      e.preventDefault()
      if (e.shiftKey) {
        this.selectUp()
      } else {
        this.selectDown()
      }
    }

    if (e.keyCode === Constants.KEY_ENTER) {
      e.preventDefault()
      this.selectEnter(this.searchInputRef)
    }

    if (e.keyCode === Constants.KEY_ESC) {
      if (this.props.onSearchExit) {
        const searchStr = this.searchInputRef ? this.searchInputRef.value : ''
        if (!searchStr || searchStr.length === 0) {
          e.preventDefault()
          this.searchExit()
        }
      }
    }
  }

  get matchInfo () {
    if (this._matchInfo === undefined) {
      this._matchInfo = this.computeMatchInfo()
    }
    return this._matchInfo
  }

  computeMatchInfo () {
    const openWindows = this.state.sortedWindows
    const filteredWindows = searchOps.filterTabWindows(openWindows, this.state.searchRE)
    const windowList = immutable.List(filteredWindows)
    // console.log('windowList: ', windowList.toJS())

    const openWindowList = windowList.filter(ftw => ftw.tabWindow.open)
    const openWinMatchingTabs = openWindowList.flatMap(ftw => ftw.itemMatches.map(item => [ftw.tabWindow, item.tabItem]))
    // console.log('openWinMatchingTabs: ', openWinMatchingTabs.toJS())

    // openMatchTabs require both tab AND window to be open:
    const openMatchingTabs = openWinMatchingTabs.filter(([_, ti]) => ti.open)
    const openMatches = openMatchingTabs.map(([tw, ti]) => (
      {
        data: {
          tabWindow: tw,
          tabItem: ti,
        },
        renderProps: {
          open: true,
          saved: ti.saved,
          title: ti.title,
          url: ti.url,
          providerName: 'Open Tab'
        }
      }))
    // closed tabs will be comprises of closed tabs in open windows
    // and tabs in closed windows:
    const openWinClosedMatchingTabs = openWinMatchingTabs.filter(([_, ti]) => !ti.open)
    const closedWinMatchingTabs = windowList.filter(ftw => !(ftw.tabWindow.open)).flatMap(ftw => ftw.itemMatches.map(item => [ftw.tabWindow, item.tabItem]))
    const closedMatchingTabs = openWinClosedMatchingTabs.concat(closedWinMatchingTabs)
    const closedMatches = closedMatchingTabs.map(([tw, ti]) => (
      {
        data: {
          tabWindow: tw,
          tabItem: ti,
        },
        renderProps: {
          open: false,
          saved: ti.saved,
          title: ti.title,
          url: ti.url,
          providerName: 'Saved Tab'
        }
      }))
    return openMatches.concat(closedMatches).toArray()
  }

  componentWillReceiveProps () {
    delete this._matchInfo
  }

  render () {
    let ret
    const tipStr = 'Search Tabs, History, Bookmarks, ...'

    const matches = this.matchInfo
    const matchElems = matches ? matches.map((mi, i) => {
      const selected = this.state.selectedIndex === i
      const { renderProps } = mi
      return (
        <TabSearchCard
          {...renderProps}
          selected={selected}
          key={'match-' + i.toString()} />
      )
    }) : null
    try {
      ret = (
        <div className='newtab-main-container'>
          <div className='newtab-content-container'>
            <div className='newtab-logo-container'>
              <img src="images/newtab-logo.png" />
              <h1 className='newtab-logo-title'>Tabli</h1>
            </div>
            <div className='newtab-search-container'>
              <input
                className='newtab-search-input'
                type='search'
                tabIndex={1}
                ref={this.setInputRef}
                id='searchBox'
                placeholder={tipStr}
                onChange={this.handleChange}
                onKeyDown={this.handleKeyDown}
                title={tipStr} />
            </div>
            <div className='newtab-search-results'>
              {matchElems}
            </div>
          </div>
        </div>
      )
    } catch (e) {
      console.error('NewTabPage: caught exception during render: ')
      console.error(e.stack)
      throw e
    }

    return ret
  }
}

export default DragDropContext(HTML5Backend)(NewTabPage)
