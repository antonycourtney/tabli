import test from 'tape'
import * as TabWindow from '../src/js/tabWindow'
import difflet from 'difflet'
import * as testData from './testData'

function dumpDiffs (objA, objB) {
  var s = difflet({indent: 2, comment: true}).compare(objA, objB)
  console.log('diffs:')
  console.log(s)
}

test('basic test', (t) => {
  t.pass('This test will pass')
  t.end()
})

test('makeFolderTabWindow', (t) => {

  const tabWindow = TabWindow.makeFolderTabWindow(testData.d3BookmarkFolder)
  const tabWindowJS = JSON.parse(JSON.stringify(tabWindow.toJS()))

  /*
    console.log("makeFolderTabWindow returned:")
    console.log(">>>>>>>")
    console.log(JSON.stringify(tabWindowJS,null,2))
    console.log(">>>>>>>")

    console.log('diffs between tabWindowJS and expected:')
    dumpDiffs(tabWindowJS, testData.d3InitialExpectedTabWindow)
  */

  t.deepEqual(tabWindowJS, testData.d3InitialExpectedTabWindow, 'makeFolderTabWindow basic functionality')

  t.equal(tabWindow.title, 'd3 docs', 'saved window title matches bookmark folder')

  t.end()
})

test('chromeTabWindow', (t) => {
  const baseTabWindow = TabWindow.makeChromeTabWindow(testData.chromeWindowSnap)

  const tabWindowJS = JSON.parse(JSON.stringify(baseTabWindow.toJS()))

/*
    console.log("makeChromeTabWindow returned: ")
    console.log(">>>>>")
    console.log(JSON.stringify(tabWindowJS,null,2))
    console.log(">>>>>")
*/
  const expectedTabWindow =
  {
    "saved": false,
    "savedTitle": "",
    "savedFolderId": -1,
    "open": true,
    "openWindowId": 442,
    "windowType": "normal",
    "width": 1258,
    "height": 957,
    "tabItems": [
      {
        "saved": false,
        "savedState": null,
        "open": true,
        "openState": {
          "url": "http://facebook.github.io/react/docs/component-api.html",
          "openTabId": 443,
          "active": false,
          "openTabIndex": 0,
          "favIconUrl": "http://facebook.github.io/react/favicon.ico",
          "title": "Component API | React",
          "audible": false,
          "pinned": false
        }
      },
      {
        "saved": false,
        "savedState": null,
        "open": true,
        "openState": {
          "url": "http://facebook.github.io/react/docs/tutorial.html",
          "openTabId": 445,
          "active": false,
          "openTabIndex": 1,
          "favIconUrl": "http://facebook.github.io/react/favicon.ico",
          "title": "Tutorial | React",
          "audible": false,
          "pinned": false
        }
      },
      {
        "saved": false,
        "savedState": null,
        "open": true,
        "openState": {
          "url": "http://stackoverflow.com/questions/21903604/is-there-any-proper-way-to-integrate-d3-js-graphics-into-facebook-react-applicat",
          "openTabId": 447,
          "active": false,
          "openTabIndex": 2,
          "favIconUrl": "http://cdn.sstatic.net/stackoverflow/img/favicon.ico?v=4f32ecc8f43d",
          "title": "javascript - Is there any proper way to integrate d3.js graphics into Facebook React application? - Stack Overflow",
          "audible": false,
          "pinned": false
        }
      },
      {
        "saved": false,
        "savedState": null,
        "open": true,
        "openState": {
          "url": "http://facebook.github.io/flux/docs/overview.html#content",
          "openTabId": 449,
          "active": false,
          "openTabIndex": 3,
          "title": "Flux | Application Architecture for Building User Interfaces",
          "audible": false,
          "pinned": false
        }
      },
      {
        "saved": false,
        "savedState": null,
        "open": true,
        "openState": {
          "url": "http://fluxxor.com/",
          "openTabId": 451,
          "active": false,
          "openTabIndex": 4,
          "favIconUrl": "http://fluxxor.com/favicon.ico",
          "title": "Fluxxor - Home",
          "audible": false,
          "pinned": false
        }
      },
      {
        "saved": false,
        "savedState": null,
        "open": true,
        "openState": {
          "url": "http://facebook.github.io/fixed-data-table/",
          "openTabId": 453,
          "active": false,
          "openTabIndex": 5,
          "favIconUrl": "http://facebook.github.io/fixed-data-table/images/favicon-b4fca2450cb5aa407a2e106f42a92838.png",
          "title": "FixedDataTable",
          "audible": false,
          "pinned": false
        }
      },
      {
        "saved": false,
        "savedState": null,
        "open": true,
        "openState": {
          "url": "https://developer.chrome.com/extensions/declare_permissions",
          "openTabId": 734,
          "active": true,
          "openTabIndex": 6,
          "favIconUrl": "https://www.google.com/images/icons/product/chrome-32.png",
          "title": "Declare Permissions - Google Chrome",
          "audible": false,
          "pinned": false
        }
      }
    ],
    "snapshot": false
  }

  // dumpDiffs(tabWindowJS,expectedTabWindow)

  t.deepEqual(tabWindowJS, expectedTabWindow, 'chromeTabWindow basic functionality')

  // Check that title matches active tab:
  const baseTitle = baseTabWindow.title
  t.equal(baseTitle, 'Declare Permissions - Google Chrome', 'title reflects active tab')

  // Now let's take state after closing the active tab that gave us our title:
  const updTabWindow = TabWindow.updateWindow(baseTabWindow, testData.chromeWindowSnap2)
  const updTabWindowJS = JSON.parse(JSON.stringify(updTabWindow.toJS()))

  // console.log("Updated tab window: ")
  // console.log(JSON.stringify(updTabWindowJS,null,2))

  const updTitle = updTabWindow.title
  t.equal(updTitle, 'Fluxxor - Home', 'Correct title after closing previously active tab and updating window')

  t.end()
})

/*
 * make sure we still get a deterministic title even when no tab active
 */
test('noActiveTabTitle', (t) => {
  const baseTabWindow = TabWindow.makeChromeTabWindow(testData.chromeWindowSnap3)

  const tabWindowJS = JSON.parse(JSON.stringify(baseTabWindow.toJS()))

  const baseTitle = baseTabWindow.title

  t.equal(baseTitle, testData.chromeWindowSnap3.tabs[0].title, 'use first tab title when no active tab')
  t.end()
})

test('missingSourceFieldsTests', (t) => {
  const bmFolder0 =
  {
    children: [
      {
        dateAdded: 1395768341441,
        id: '432',
        index: 0,
        parentId: '431',

        // title deliberately omitted
        url: 'https://github.com/mbostock/d3/wiki/API-Reference'
      }
    ],
    dateAdded: 1395768341427,
    dateGroupModified: 1430260300118,
    id: '431',
    index: 4,
    parentId: '377',
    title: 'd3 docs'
  }

  const tabWindow = TabWindow.makeFolderTabWindow(bmFolder0)
  const tabWindowJS = JSON.parse(JSON.stringify(tabWindow.toJS()))

  // console.log("makeFolderTabWindow returned:")
  // console.log(JSON.stringify(tabWindowJS,null,2))

  const bmTabItem = tabWindow.tabItems.get(0)
  const bmTabTitle = bmTabItem.title
  t.equal(bmTabTitle, bmFolder0.children[0].url, 'Revert to url when bookmark title missing')

  // window is still folder title:
  const windowTitle = tabWindow.title

  // Let's use URL for title of untitled tabs:
  t.equal(windowTitle, bmFolder0.title, 'use bookmark folder for window title')

  // TODO: Now omit folder title...
  const bmFolder1 =
  {
    children: [
      {
        dateAdded: 1395768341441,
        id: '432',
        index: 0,
        parentId: '431',
        title: 'd3 API Reference',
        url: 'https://github.com/mbostock/d3/wiki/API-Reference'
      }
    ],
    dateAdded: 1395768341427,
    dateGroupModified: 1430260300118,
    id: '431',
    index: 4,
    parentId: '377',

  // title deliberately omitted
  }

  const tabWindow1 = TabWindow.makeFolderTabWindow(bmFolder1)
  const tabWindow1JS = JSON.parse(JSON.stringify(tabWindow1.toJS()))

  const tabWindow1Title = tabWindow1.title

  // revert to title of first tab:
  t.equal(tabWindow1Title, bmFolder1.children[0].title, 'null folder title reverts to tab title')

  const chromeWindowSnap4 =
  {
    alwaysOnTop: false,
    focused: false,
    height: 957,
    id: 442,
    incognito: false,
    left: 428,
    state: 'normal',
    tabs: [
      {
        active: true,
        audible: false,
        favIconUrl: 'http://facebook.github.io/react/favicon.ico',
        height: 862,
        highlighted: false,
        id: 443,
        incognito: false,
        index: 0,
        muted: false,
        mutedCause: '',
        pinned: false,
        selected: false,
        status: 'complete',

        // title deliberately omitted
        url: 'http://facebook.github.io/react/docs/component-api.html',
        width: 1258,
        windowId: 442
      }
    ]
  }

  const chromeTabWindow = TabWindow.makeChromeTabWindow(chromeWindowSnap4)
  const chromeTabWindowJS = JSON.parse(JSON.stringify(chromeTabWindow.toJS()))

  const chromeTabWindowTitle = chromeTabWindow.title

  t.equal(chromeTabWindow.title, chromeWindowSnap4.tabs[0].url, 'Fall back to url for tabs with no title')

  t.end()
})

test('attachChromeWindow', (t) => {

  // Let's first create the tabWindow for our saved bookmark folder:
  const tabWindow = TabWindow.makeFolderTabWindow(testData.d3BookmarkFolder)
  const tabWindowJS = JSON.parse(JSON.stringify(tabWindow.toJS()))

/*
    console.log("makeFolderTabWindow returned:")
    console.log(">>>>>>>")
    console.log(JSON.stringify(tabWindowJS,null,2))
    console.log(">>>>>>>")



  console.log('diffs between tabWindowJS and expected:')
  dumpDiffs(tabWindowJS, testData.d3InitialExpectedTabWindow)
  */

  t.deepEqual(tabWindowJS, testData.d3InitialExpectedTabWindow, 'attachChromeWindow basic functionality')

  t.equal(tabWindow.title, 'd3 docs', 'saved window title matches bookmark folder')

  // Now let's do the attach:
  const updTabWindow = TabWindow.updateWindow(tabWindow, testData.d3OpenedChromeWindow)
  const updTabWindowJS = JSON.parse(JSON.stringify(updTabWindow.toJS()))

/*
    console.log("updateTabWindow returned:")
    console.log(">>>>>>>")
    console.log(JSON.stringify(updTabWindowJS,null,2))
    console.log(">>>>>>>")

    console.log("diffs between updTabWindow (actual) and expected:")
    dumpDiffs(updTabWindowJS, testData.d3AttachedExpectedTabWindow)
*/

  t.deepEqual(updTabWindowJS, testData.d3AttachedExpectedTabWindow, 'updateWindow -- after attach')

  const tabCount = updTabWindow.tabItems.count()
  const openCount = updTabWindow.tabItems.count(t => t.open)
  const savedCount = updTabWindow.tabItems.count(t => t.saved)

  console.log('attachChromeWindow: ' + tabCount + ' total tabs, ' + openCount + ' open, ' + savedCount + ' saved')
  t.equals(tabCount, 7, 'total tab count')
  t.equals(openCount, 6, 'open tab count')
  t.equals(savedCount, 6, 'saved tab count')

  // Now revert the window to saved state:
  const revTabWindow = TabWindow.removeOpenWindowState(updTabWindow, false)

  const revTabCount = revTabWindow.tabItems.count()
  const revOpenCount = revTabWindow.tabItems.count(t => t.open)
  const revSavedCount = revTabWindow.tabItems.count(t => t.saved)

  console.log('attachChromeWindow after revert: ' + revTabCount + ' total tabs, ' + revOpenCount + ' open, ' + revSavedCount + ' saved')
  t.equals(revTabCount, 6, 'total tab count')
  t.equals(revOpenCount, 0, 'open tab count')
  t.equals(revSavedCount, 6, 'saved tab count')

  t.end()
})
