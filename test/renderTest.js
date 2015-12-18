'use strict';

import * as fs from 'fs';
import * as actions from '../src/js/actions';
import './testHelper';
import test from 'tape';
import React from 'react/addons';
import ViewRef from '../src/js/viewRef';
import TabManagerState from '../src/js/tabManagerState';
import TabliPopup from '../src/js/components/TabliPopup';
import * as sinon from 'sinon';

const {renderIntoDocument, scryRenderedDOMComponentsWithTag, scryRenderedDOMComponentsWithClass, Simulate}
  = React.addons.TestUtils;

function getWindowSnap() {
  const content = fs.readFileSync("test/chromeWindowSnap.json");
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

test('basic load state',(t) => {
  const snap = getWindowSnap();

  t.equal(snap.length,3,"read 3 windows from window snap");
  t.end();
});

test('basic window state',(t) => {
  const winStore = initialWinStore();

  const openTabCount = winStore.countOpenTabs();
  const openWinCount = winStore.countOpenWindows();
  const savedCount=winStore.countSavedWindows();

  // const summarySentence=openTabCount + " Open Tabs, " + openWinCount + " Open Windows, " + savedCount + " Saved Windows"
  const summarySentence="Tabs: " + openTabCount + " Open. Windows: " + openWinCount + " Open, " + savedCount + " Saved."

  console.log(summarySentence + "\n");
  t.equal(openTabCount,14);
  t.equal(openWinCount,3);
  t.equal(savedCount,0);
  t.end();
})

test('basic render test',(t) => {
  const winStore = initialWinStore();

  const component = renderIntoDocument(
      <TabliPopup storeRef={null} initialWinStore={winStore} noListener={true} />
    );

  t.notEqual(component,null,"component from renderIntoDocument is not null");
  t.end();
})

test('basic event test',(t) => {
  // Let's stub out all the stubs in actions libs:
  var actionsStubs = sinon.stub(actions);

  const winStore = initialWinStore();

  const component = renderIntoDocument(
      <TabliPopup storeRef={null} initialWinStore={winStore} noListener={true} />
    );

  const helpButtons = scryRenderedDOMComponentsWithClass(component,'fa-question-circle')

  t.equal(helpButtons.length,1,"found 1 help button");
  Simulate.click(helpButtons[0]);

  t.assert(actionsStubs.showHelp.calledOnce);
  t.end();
})

