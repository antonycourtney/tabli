// @flow
/* globals chrome */
import * as React from 'react'
import * as Util from './util'
import { DragDropContext } from 'react-dnd'
import HTML5Backend from 'react-dnd-html5-backend'
import * as immutable from 'immutable'
import * as searchOps from '../searchOps'
import TabSearchCard from './TabSearchCard'

class NewTabPage extends React.Component {
  state: Object
  searchInputRef: ?Object

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
      sortedWindows
    }
  };

  handleSearchInput = (rawSearchStr) => {
    const searchStr = rawSearchStr.trim()
    console.log('searchStr: "' + searchStr + '"')
    var searchRE = null
    if (searchStr.length > 0) {
      searchRE = new RegExp(searchStr, 'i')
    }

    this.setState({ searchStr, searchRE })
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

  handleKeyDown = (e) => {
    // console.log('handleKeyDown: ', _.omit(e, _.isObject))
  }

  render () {
    let ret
    const tipStr = 'Search Tabs, History, Bookmarks, ...'
    const openWindows = this.state.sortedWindows.filter(tw => tw.open)
    const filteredWindows = searchOps.filterTabWindows(openWindows, this.state.searchRE)
    const windowList = immutable.List(filteredWindows)
    console.log('windowList: ', windowList.toJS())
    const matchingTabs = windowList.flatMap(ftw => ftw.itemMatches.map(item => item.tabItem))
    const openMatchingTabs = matchingTabs.filter(ti => ti.open)
    console.log('openMatchingTabs: ', openMatchingTabs.toJS())
    const searchElems = openMatchingTabs.map(ti => (
      <TabSearchCard
        tabItem = {ti}
      />
    ))
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
              {searchElems}
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
