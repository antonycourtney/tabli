import * as React from 'react'
import * as actions from '../actions'
import * as searchOps from '../searchOps'
import { refUpdater } from 'oneref'

import Styles from './styles'
import RevertModal from './RevertModal'
import SaveModal from './SaveModal'
import SelectablePopup from './SelectablePopup'
import * as Util from './util'
import { DragDropContext } from 'react-dnd'
import HTML5Backend from 'react-dnd-html5-backend'

/**
 * send message to BGhelper
 */
function sendHelperMessage (msg) {
  var port = chrome.runtime.connect({ name: 'popup' })
  port.postMessage(msg)
  port.onMessage.addListener((response) => {
    console.log('Got response message: ', response)
  })
}

const Popup = React.createClass({
  storeAsState(winStore) {
    var tabWindows = winStore.getAll()
    var cmpFn = Util.windowCmp(winStore.currentWindowId)
    var sortedWindows = tabWindows.sort(cmpFn)

    const winTitles = sortedWindows.map(w => w.title)

    return {
      winStore,
    sortedWindows}
  },

  getInitialState() {
    var st = this.storeAsState(this.props.initialWinStore, true)

    st.saveModalIsOpen = false
    st.revertModalIsOpen = false
    st.revertTabWindow = null
    st.searchStr = ''
    st.searchRE = null
    return st
  },

  handleSearchInput(rawSearchStr) {
    const searchStr = rawSearchStr.trim()

    var searchRE = null
    if (searchStr.length > 0) {
      searchRE = new RegExp(searchStr, 'i')
    }

    this.setState({ searchStr, searchRE})
  },

  openSaveModal(tabWindow) {
    const initialTitle = tabWindow.title
    this.setState({ saveModalIsOpen: true, saveInitialTitle: initialTitle, saveTabWindow: tabWindow })
  },

  closeSaveModal() {
    this.setState({ saveModalIsOpen: false })
  },

  openRevertModal(filteredTabWindow) {
    this.setState({ revertModalIsOpen: true, revertTabWindow: filteredTabWindow.tabWindow })
  },

  closeRevertModal() {
    this.setState({ revertModalIsOpen: false, revertTabWindow: null })
  },

  /* handler for save modal */
  doSave(titleStr) {
    const storeRef = this.props.storeRef
    const storeState = storeRef.getValue()
    const tabliFolderId = storeState.folderId
    actions.manageWindow(tabliFolderId, storeState.currentWindowId, this.state.saveTabWindow, titleStr, refUpdater(storeRef))
    this.closeSaveModal()
  },

  doRevert(tabWindow) { // eslint-disable-line no-unused-vars
    const updateHandler = refUpdater(this.props.storeRef)
    actions.revertWindow(this.state.revertTabWindow, updateHandler)
    this.closeRevertModal()
  },

  /* render save modal (or not) based on this.state.saveModalIsOpen */
  renderSaveModal() {
    var modal = null
    if (this.state.saveModalIsOpen) {
      modal = (
        <SaveModal
          initialTitle={this.state.saveInitialTitle}
          tabWindow={this.state.saveTabWindow}
          onClose={this.closeSaveModal}
          onSubmit={this.doSave}
          appComponent={this} />)
    }

    return modal
  },

  /* render revert modal (or not) based on this.state.revertModalIsOpen */
  renderRevertModal() {
    var modal = null
    if (this.state.revertModalIsOpen) {
      modal = (
        <RevertModal
          tabWindow={this.state.revertTabWindow}
          onClose={this.closeRevertModal}
          onSubmit={this.doRevert}
          appComponent={this} />)
    }

    return modal
  },

  render() {
    var ret
    try {
      const saveModal = this.renderSaveModal()
      const revertModal = this.renderRevertModal()
      const filteredWindows = searchOps.filterTabWindows(this.state.sortedWindows, this.state.searchRE)
      ret = (
        <div style={Styles.popupContainer}>
          <SelectablePopup
            onSearchInput={this.handleSearchInput}
            winStore={this.state.winStore}
            storeUpdateHandler={refUpdater(this.props.storeRef)}
            filteredWindows={filteredWindows}
            appComponent={this}
            searchStr={this.state.searchStr}
            searchRE={this.state.searchRE}
            isPopout={this.props.isPopout} />
          {saveModal}
          {revertModal}
        </div>
      )
    } catch (e) {
      console.error('App Component: caught exception during render: ')
      console.error(e.stack)
      throw e
    }

    return ret
  },

  componentWillMount() {
    if (this.props.noListener) {
      return
    }

    const storeRef = this.props.storeRef
    /*
     * This listener is essential for triggering a (recursive) re-render
     * in response to a state change.
     */
    const viewStateListener = () => {
      // console.log('TabliPopup: viewListener: updating popup state from storeRef')
      const t_preSet = performance.now()

      const nextStore = storeRef.getValue()
      this.setState(this.storeAsState(nextStore))
      const t_postSet = performance.now()
    // console.log('TabliPopup: setState took ', t_postSet - t_preSet, " ms")
    }

    const throttledListener = _.debounce(viewStateListener, 200)

    var listenerId = storeRef.addViewListener(throttledListener)

    console.log('componentWillMount: added view listener: ', listenerId)
    sendHelperMessage({ listenerId})
  }
})

export default DragDropContext(HTML5Backend)(Popup)
