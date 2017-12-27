import React from 'react'

import { storiesOf } from '@storybook/react'
import { action } from '@storybook/addon-actions'
import { linkTo } from '@storybook/addon-links'

import { Button, Welcome } from '@storybook/react/demo'

import ExpanderButton from '../components/ExpanderButton'
import FlatButton from '../components/FlatButton'
import HeaderButton from '../components/HeaderButton'
import WindowHeader from '../components/WindowHeader'
import FilteredTabWindow from '../components/FilteredTabWindow'
import * as Util from '../components/util'
import Styles from '../components/styles'
import TabManagerState from '../tabManagerState'
import ViewRef from '../viewRef'
import * as searchOps from '../searchOps'
import { DragDropContextProvider } from 'react-dnd'
import HTML5Backend from 'react-dnd-html5-backend'

const mkWinStore = (testData) => {
  const testChromeWindows = testData.chromeWindows

  console.log('renderPage: testData: ', testData)

  // Let's arbitrary pick first window as current window:
  const curChromeWin = testChromeWindows[0]

  const emptyWinStore = new TabManagerState()
  const mockWinStore = emptyWinStore
    .syncWindowList(testChromeWindows)
    .set('showRelNotes', false)
    .setCurrentWindow(curChromeWin)

  console.log('Created mockWinStore and registered test windows')
  console.log('mock winStore: ', mockWinStore.toJS())

  const curWin = mockWinStore.getCurrentWindow()

  console.log('current window: ', curWin.toJS())
  const storeRef = new ViewRef(mockWinStore)

  const filteredTabWindows = searchOps.filterTabWindows(mockWinStore.getAll(), null)

  console.log('ftws: ', filteredTabWindows.map(r => r.toJS()))

  return { storeRef, winStore: mockWinStore, filteredTabWindows }
}

const chromeWinSnap = require('../../../test/renderTest-chromeWindowSnap.json')
const testState = mkWinStore(chromeWinSnap)

storiesOf('Welcome', module).add('to Storybook', () => <Welcome showApp={linkTo('Button')} />)

storiesOf('Button', module)
  .add('with text', () => <Button onClick={action('clicked')}>Hello Button</Button>)
  .add('with some emoji', () => <Button onClick={action('clicked')}>😀 😎 👍 💯</Button>)

storiesOf('ExpanderButton', module)
  .add('expanded', () => <ExpanderButton expanded={true} onClick={action('clicked')} />)
  .add('collapsed', () => <ExpanderButton expanded={false} onClick={action('clicked')} />)

storiesOf('FlatButton', module)
  .add('with basic label', () => <FlatButton label='hello' onClick={action('clicked')} />)

storiesOf('HeaderButton', module)
  .add('revert button', () =>
    <HeaderButton
      baseStyle={Util.merge(Styles.headerButton, Styles.revertButton)}
      visible={true}
      title='Revert to bookmarked tabs (Close other tabs)'
      onClick={action('clicked')} />
  )

storiesOf('WindowHeader', module)
  .add('basic header', () =>
    <WindowHeader
      winStore={testState.winStore}
      storeRef={testState.storeRef}
      tabWindow={testState.winStore.getCurrentWindow()}
      expanded={true}
      onExpand={action('expand')}
      onOpen={action('open')}
      onRevert={action('revert')}
      onClose={action('close')}
      appComponent={null}
      onItemSelected={action('itemSelected')} />
  )

storiesOf('FilteredTabWindow', module)
  .addDecorator(story => (
    <DragDropContextProvider backend={HTML5Backend}>
      {story()}
    </DragDropContextProvider>
  ))
  .add('basic window', () =>
    <FilteredTabWindow
      winStore={testState.winStore}
      storeRef={testState.storeRef}
      filteredTabWindow={testState.filteredTabWindows[0]}
      expanded={true}
      index={0}
      searchStr={''}
      searchRE={''}
      isSelected={false}
      isFocused={false}
      selectedTabIndex={-1}
      appComponent={null}
      onItemSelected={action('itemSelected')}
      expandAll={false} />
  )
