'use strict';

import * as fs from 'fs';
import * as actions from '../src/tabli-core/src/js/actions';
import './testHelper';
import test from 'tape';
import React from 'react';
import * as ReactTestUtils from 'react-addons-test-utils'
import ViewRef from '../src/tabli-core/src/js/viewRef';
import TabManagerState from '../src/tabli-core/src/js/tabManagerState';
import TabliPopup from '../src/tabli-core/src/js/components/Popup';
import SearchBar from '../src/tabli-core/src/js/components/SearchBar';
import TabItem from '../src/tabli-core/src/js/components/TabItem';
import * as sinon from 'sinon';

function getWindowSnap() {
  const content = fs.readFileSync('test/chromeWindowSnap.json');
  const snap = JSON.parse(content);
  return snap.chromeWindows;
}

function initialWinStore() {
  const folderId = 6666;
  const archiveFolderId = 7777;
  const baseWinStore = new TabManagerState({folderId, archiveFolderId });

  const windowList = getWindowSnap();
  const initWinStore = baseWinStore.syncWindowList(windowList);

  return initWinStore;
}

test('basic load state', (t) => {
  const snap = getWindowSnap();

  t.equal(snap.length, 3, 'read 3 windows from window snap');
  t.end();
});

test('basic window state', (t) => {
  const winStore = initialWinStore();

  const openTabCount = winStore.countOpenTabs();
  const openWinCount = winStore.countOpenWindows();
  const savedCount = winStore.countSavedWindows();

  // const summarySentence=openTabCount + " Open Tabs, " + openWinCount + " Open Windows, " + savedCount + " Saved Windows"
  const summarySentence = 'Tabs: ' + openTabCount + ' Open. Windows: ' + openWinCount + ' Open, ' + savedCount + ' Saved.';

  console.log(summarySentence + '\n');
  t.equal(openTabCount, 14);
  t.equal(openWinCount, 3);
  t.equal(savedCount, 0);
  t.end();
});

test('basic render test', (t) => {
  const winStore = initialWinStore();

  const component = ReactTestUtils.renderIntoDocument(
      <TabliPopup storeRef={null} initialWinStore={winStore} noListener={true} />
    );

  t.notEqual(component, null, 'component from renderIntoDocument is not null');
  t.end();
});

test('basic event test', (t) => {
  // Let's stub out all the stubs in actions libs:
  var actionsMock = sinon.mock(actions);

  actionsMock.expects('showHelp').once();

  const winStore = initialWinStore();

  const component = ReactTestUtils.renderIntoDocument(
      <TabliPopup storeRef={null} initialWinStore={winStore} noListener={true} />
    );

  const helpButton = ReactTestUtils.findRenderedDOMComponentWithClass(component, 'fa-question-circle');

  ReactTestUtils.Simulate.click(helpButton);

  // N.B. verify restores mocked methods:
  actionsMock.verify();

  t.end();
});

test('isearch test', (t) => {
  // Let's stub out all the stubs in actions libs:
  var actionsMock = sinon.mock(actions);

  const winStore = initialWinStore();

  const component = ReactTestUtils.renderIntoDocument(
      <TabliPopup storeRef={null} initialWinStore={winStore} noListener={true} />
    );

  const baseTabItems = ReactTestUtils.scryRenderedComponentsWithType(component, TabItem);

  console.log('isearch test: initial tab items found: ', baseTabItems.length);

  t.equals(baseTabItems.length, 14, 'Initial tab count');

  const searchBar = ReactTestUtils.findRenderedComponentWithType(component, SearchBar);

  const searchInput = searchBar.refs.searchInput;

  searchInput.value = 'git';

  /*
   * This also works:
  const inputComponents = ReactTestUtils.scryRenderedDOMComponentsWithTag(searchBar,'input')
  console.log("inputComponents: ", inputComponents);
    */

  ReactTestUtils.Simulate.change(searchInput); //  {target: { value: 'git'}});
  /*
  ReactTestUtils.Simulate.keyDown(searchInput, {key: "g", keyCode: 103});
  ReactTestUtils.Simulate.keyDown(searchInput, {key: "i", keyCode: 105});
  ReactTestUtils.Simulate.keyDown(searchInput, {key: "t", keyCode: 116});
  */

  const filteredTabItems = ReactTestUtils.scryRenderedComponentsWithType(component, TabItem);

  console.log('isearch test: filtered tab items found: ', filteredTabItems.length);

  t.equals(filteredTabItems.length, 8, 'filtered tab count');

  actionsMock.restore();
  t.end();
});

test('search and open test', (t) => {
  // Let's stub out all the stubs in actions libs:
  var actionsMock = sinon.mock(actions);

  actionsMock.expects('activateTab').once();

  const winStore = initialWinStore();

  const component = ReactTestUtils.renderIntoDocument(
      <TabliPopup storeRef={null} initialWinStore={winStore} noListener={true} />
    );

  const baseTabItems = ReactTestUtils.scryRenderedComponentsWithType(component, TabItem);

  console.log('search and open test: initial tab items found: ', baseTabItems.length);

  t.equals(baseTabItems.length, 14, 'Initial tab count');

  const searchBar = ReactTestUtils.findRenderedComponentWithType(component, SearchBar);

  const searchInput = searchBar.refs.searchInput;

  searchInput.value = 'git';

  ReactTestUtils.Simulate.change(searchInput);
  const filteredTabItems = ReactTestUtils.scryRenderedComponentsWithType(component, TabItem);

  console.log('search and open test: filtered tab items found: ', filteredTabItems.length);

  t.equals(filteredTabItems.length, 8, 'filtered tab count');

  ReactTestUtils.Simulate.keyDown(searchInput, {key: 'Enter', keyCode: 13, which: 13});

  actionsMock.verify();
  t.end();
});
