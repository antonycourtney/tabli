
import test from 'tape';
import * as TabWindow from '../src/js/tabWindow';
import difflet from 'difflet';

function dumpDiffs(objA, objB) {
  var s = difflet({indent:2, comment:true}).compare(objA, objB);
  console.log('diffs:');
  console.log(s);
}

test('basic test', (t) => {
  t.pass('This test will pass');
  t.end();
});

test('makeFolderTabWindow', (t) => {
  const bookmarkFolder =
    {
      children: [
        {
          dateAdded: 1395768341441,
          id: '432',
          index: 0,
          parentId: '431',
          title: 'API Reference · mbostock/d3 Wiki',
          url: 'https://github.com/mbostock/d3/wiki/API-Reference',
        },
        {
          dateAdded: 1398004320075,
          id: '534',
          index: 1,
          parentId: '431',
          title: 'D3.js - Data-Driven Documents',
          url: 'http://d3js.org/',
        },
        {
          dateAdded: 1398004321188,
          id: '535',
          index: 2,
          parentId: '431',
          title: 'Gallery · mbostock/d3 Wiki',
          url: 'https://github.com/mbostock/d3/wiki/Gallery',
        },
        {
          dateAdded: 1398004392395,
          id: '536',
          index: 3,
          parentId: '431',
          title: 'Tutorials · mbostock/d3 Wiki',
          url: 'https://github.com/mbostock/d3/wiki/Tutorials',
        },
        {
          dateAdded: 1398004621941,
          id: '537',
          index: 4,
          parentId: '431',
          title: 'Drag + Zoom',
          url: 'http://bl.ocks.org/mbostock/6123708',
        },
        {
          dateAdded: 1405471223073,
          id: '613',
          index: 5,
          parentId: '431',
          title: 'Focus+Context via Brushing',
          url: 'http://bl.ocks.org/mbostock/1667367',
        },
      ],
      dateAdded: 1395768341427,
      dateGroupModified: 1430260300118,
      id: '431',
      index: 4,
      parentId: '377',
      title: 'd3 docs',
    };

  const tabWindow = TabWindow.makeFolderTabWindow(bookmarkFolder);
  const tabWindowJS = JSON.parse(JSON.stringify(tabWindow.toJS()));

  //console.log("makeFolderTabWindow returned:");
  //console.log(JSON.stringify(tabWindowJS,null,2));

  const expectedTabWindow =
     {
      saved: true,
      savedTitle: 'd3 docs',
      savedFolderId: '431',
      open: false,
      openWindowId: -1,
      focused: false,
      tabItems: [
        {
          url: 'https://github.com/mbostock/d3/wiki/API-Reference',
          saved: true,
          savedBookmarkId: '432',
          savedBookmarkIndex: 0,
          savedTitle: 'API Reference · mbostock/d3 Wiki',
          open: false,
          openTabId: -1,
          active: false,
          openTabIndex: 0,
          favIconUrl: '',
          tabTitle: '',
          audible: false,
        },
        {
          url: 'http://d3js.org/',
          saved: true,
          savedBookmarkId: '534',
          savedBookmarkIndex: 1,
          savedTitle: 'D3.js - Data-Driven Documents',
          open: false,
          openTabId: -1,
          active: false,
          openTabIndex: 0,
          favIconUrl: '',
          tabTitle: '',
          audible: false,
        },
        {
          url: 'https://github.com/mbostock/d3/wiki/Gallery',
          saved: true,
          savedBookmarkId: '535',
          savedBookmarkIndex: 2,
          savedTitle: 'Gallery · mbostock/d3 Wiki',
          open: false,
          openTabId: -1,
          active: false,
          openTabIndex: 0,
          favIconUrl: '',
          tabTitle: '',
          audible: false,
        },
        {
          url: 'https://github.com/mbostock/d3/wiki/Tutorials',
          saved: true,
          savedBookmarkId: '536',
          savedBookmarkIndex: 3,
          savedTitle: 'Tutorials · mbostock/d3 Wiki',
          open: false,
          openTabId: -1,
          active: false,
          openTabIndex: 0,
          favIconUrl: '',
          tabTitle: '',
          audible: false,
        },
        {
          url: 'http://bl.ocks.org/mbostock/6123708',
          saved: true,
          savedBookmarkId: '537',
          savedBookmarkIndex: 4,
          savedTitle: 'Drag + Zoom',
          open: false,
          openTabId: -1,
          active: false,
          openTabIndex: 0,
          favIconUrl: '',
          tabTitle: '',
          audible: false,
        },
        {
          url: 'http://bl.ocks.org/mbostock/1667367',
          saved: true,
          savedBookmarkId: '613',
          savedBookmarkIndex: 5,
          savedTitle: 'Focus+Context via Brushing',
          open: false,
          openTabId: -1,
          active: false,
          openTabIndex: 0,
          favIconUrl: '',
          tabTitle: '',
          audible: false,
        },
      ],
    };

  console.log('diffs between tabWindowJS and expected:');
  dumpDiffs(tabWindowJS, expectedTabWindow);

  t.deepEqual(tabWindowJS, expectedTabWindow, 'makeFolderTabWindow basic functionality');

  t.equal(tabWindow.title, 'd3 docs', 'saved window title matches bookmark folder');

  t.end();
});

const chromeWindowSnap =
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
          active: false,
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
          title: 'Component API | React',
          url: 'http://facebook.github.io/react/docs/component-api.html',
          width: 1258,
          windowId: 442,
        },
        {
          active: false,
          audible: false,
          favIconUrl: 'http://facebook.github.io/react/favicon.ico',
          height: 862,
          highlighted: false,
          id: 445,
          incognito: false,
          index: 1,
          muted: false,
          mutedCause: '',
          pinned: false,
          selected: false,
          status: 'complete',
          title: 'Tutorial | React',
          url: 'http://facebook.github.io/react/docs/tutorial.html',
          width: 1258,
          windowId: 442,
        },
        {
          active: false,
          audible: false,
          favIconUrl: 'http://cdn.sstatic.net/stackoverflow/img/favicon.ico?v=4f32ecc8f43d',
          height: 862,
          highlighted: false,
          id: 447,
          incognito: false,
          index: 2,
          muted: false,
          mutedCause: '',
          pinned: false,
          selected: false,
          status: 'complete',
          title: 'javascript - Is there any proper way to integrate d3.js graphics into Facebook React application? - Stack Overflow',
          url: 'http://stackoverflow.com/questions/21903604/is-there-any-proper-way-to-integrate-d3-js-graphics-into-facebook-react-applicat',
          width: 1258,
          windowId: 442,
        },
        {
          active: false,
          audible: false,
          height: 862,
          highlighted: false,
          id: 449,
          incognito: false,
          index: 3,
          muted: false,
          mutedCause: '',
          pinned: false,
          selected: false,
          status: 'complete',
          title: 'Flux | Application Architecture for Building User Interfaces',
          url: 'http://facebook.github.io/flux/docs/overview.html#content',
          width: 1258,
          windowId: 442,
        },
        {
          active: false,
          audible: false,
          favIconUrl: 'http://fluxxor.com/favicon.ico',
          height: 862,
          highlighted: false,
          id: 451,
          incognito: false,
          index: 4,
          muted: false,
          mutedCause: '',
          pinned: false,
          selected: false,
          status: 'complete',
          title: 'Fluxxor - Home',
          url: 'http://fluxxor.com/',
          width: 1258,
          windowId: 442,
        },
        {
          active: false,
          audible: false,
          favIconUrl: 'http://facebook.github.io/fixed-data-table/images/favicon-b4fca2450cb5aa407a2e106f42a92838.png',
          height: 862,
          highlighted: false,
          id: 453,
          incognito: false,
          index: 5,
          muted: false,
          mutedCause: '',
          pinned: false,
          selected: false,
          status: 'complete',
          title: 'FixedDataTable',
          url: 'http://facebook.github.io/fixed-data-table/',
          width: 1258,
          windowId: 442,
        },
        {
          active: true,
          audible: false,
          favIconUrl: 'https://www.google.com/images/icons/product/chrome-32.png',
          height: 862,
          highlighted: true,
          id: 734,
          incognito: false,
          index: 6,
          muted: false,
          mutedCause: '',
          openerTabId: 449,
          pinned: false,
          selected: true,
          status: 'complete',
          title: 'Declare Permissions - Google Chrome',
          url: 'https://developer.chrome.com/extensions/declare_permissions',
          width: 1258,
          windowId: 442,
        },
      ],
      top: 222,
      type: 'normal',
      width: 1258,
    };

// after closing tab
const chromeWindowSnap2 =
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
          active: false,
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
          title: 'Component API | React',
          url: 'http://facebook.github.io/react/docs/component-api.html',
          width: 1258,
          windowId: 442,
        },
        {
          active: false,
          audible: false,
          favIconUrl: 'http://facebook.github.io/react/favicon.ico',
          height: 862,
          highlighted: false,
          id: 445,
          incognito: false,
          index: 1,
          muted: false,
          mutedCause: '',
          pinned: false,
          selected: false,
          status: 'complete',
          title: 'Tutorial | React',
          url: 'http://facebook.github.io/react/docs/tutorial.html',
          width: 1258,
          windowId: 442,
        },
        {
          active: false,
          audible: false,
          favIconUrl: 'http://cdn.sstatic.net/stackoverflow/img/favicon.ico?v=4f32ecc8f43d',
          height: 862,
          highlighted: false,
          id: 447,
          incognito: false,
          index: 2,
          muted: false,
          mutedCause: '',
          pinned: false,
          selected: false,
          status: 'complete',
          title: 'javascript - Is there any proper way to integrate d3.js graphics into Facebook React application? - Stack Overflow',
          url: 'http://stackoverflow.com/questions/21903604/is-there-any-proper-way-to-integrate-d3-js-graphics-into-facebook-react-applicat',
          width: 1258,
          windowId: 442,
        },
        {
          active: false,
          audible: false,
          height: 862,
          highlighted: false,
          id: 449,
          incognito: false,
          index: 3,
          muted: false,
          mutedCause: '',
          pinned: false,
          selected: false,
          status: 'complete',
          title: 'Flux | Application Architecture for Building User Interfaces',
          url: 'http://facebook.github.io/flux/docs/overview.html#content',
          width: 1258,
          windowId: 442,
        },
        {
          active: true,
          audible: false,
          favIconUrl: 'http://fluxxor.com/favicon.ico',
          height: 862,
          highlighted: false,
          id: 451,
          incognito: false,
          index: 4,
          muted: false,
          mutedCause: '',
          pinned: false,
          selected: false,
          status: 'complete',
          title: 'Fluxxor - Home',
          url: 'http://fluxxor.com/',
          width: 1258,
          windowId: 442,
        },
        {
          active: false,
          audible: false,
          favIconUrl: 'http://facebook.github.io/fixed-data-table/images/favicon-b4fca2450cb5aa407a2e106f42a92838.png',
          height: 862,
          highlighted: false,
          id: 453,
          incognito: false,
          index: 5,
          muted: false,
          mutedCause: '',
          pinned: false,
          selected: false,
          status: 'complete',
          title: 'FixedDataTable',
          url: 'http://facebook.github.io/fixed-data-table/',
          width: 1258,
          windowId: 442,
        },
      ],
      top: 222,
      type: 'normal',
      width: 1258,
    };

test('chromeTabWindow', (t) => {
  const baseTabWindow = TabWindow.makeChromeTabWindow(chromeWindowSnap);

  const tabWindowJS = JSON.parse(JSON.stringify(baseTabWindow.toJS()));

  // console.log("makeChromeTabWindow returned: ");
  // console.log(JSON.stringify(tabWindowJS,null,2));

  const expectedTabWindow =
    {
      saved: false,
      savedTitle: '',
      savedFolderId: -1,
      open: true,
      openWindowId: 442,
      focused: false,
      tabItems: [
        {
          url: 'http://facebook.github.io/react/docs/component-api.html',
          saved: false,
          savedBookmarkId: '',
          savedBookmarkIndex: 0,
          savedTitle: '',
          open: true,
          openTabId: 443,
          active: false,
          openTabIndex: 0,
          favIconUrl: 'http://facebook.github.io/react/favicon.ico',
          tabTitle: 'Component API | React',
          audible: false,
        },
        {
          url: 'http://facebook.github.io/react/docs/tutorial.html',
          saved: false,
          savedBookmarkId: '',
          savedBookmarkIndex: 0,
          savedTitle: '',
          open: true,
          openTabId: 445,
          active: false,
          openTabIndex: 1,
          favIconUrl: 'http://facebook.github.io/react/favicon.ico',
          tabTitle: 'Tutorial | React',
          audible: false,
        },
        {
          url: 'http://stackoverflow.com/questions/21903604/is-there-any-proper-way-to-integrate-d3-js-graphics-into-facebook-react-applicat',
          saved: false,
          savedBookmarkId: '',
          savedBookmarkIndex: 0,
          savedTitle: '',
          open: true,
          openTabId: 447,
          active: false,
          openTabIndex: 2,
          favIconUrl: 'http://cdn.sstatic.net/stackoverflow/img/favicon.ico?v=4f32ecc8f43d',
          tabTitle: 'javascript - Is there any proper way to integrate d3.js graphics into Facebook React application? - Stack Overflow',
          audible: false,
        },
        {
          url: 'http://facebook.github.io/flux/docs/overview.html#content',
          saved: false,
          savedBookmarkId: '',
          savedBookmarkIndex: 0,
          savedTitle: '',
          open: true,
          openTabId: 449,
          active: false,
          openTabIndex: 3,
          tabTitle: 'Flux | Application Architecture for Building User Interfaces',
          audible: false,
        },
        {
          url: 'http://fluxxor.com/',
          saved: false,
          savedBookmarkId: '',
          savedBookmarkIndex: 0,
          savedTitle: '',
          open: true,
          openTabId: 451,
          active: false,
          openTabIndex: 4,
          favIconUrl: 'http://fluxxor.com/favicon.ico',
          tabTitle: 'Fluxxor - Home',
          audible: false,
        },
        {
          url: 'http://facebook.github.io/fixed-data-table/',
          saved: false,
          savedBookmarkId: '',
          savedBookmarkIndex: 0,
          savedTitle: '',
          open: true,
          openTabId: 453,
          active: false,
          openTabIndex: 5,
          favIconUrl: 'http://facebook.github.io/fixed-data-table/images/favicon-b4fca2450cb5aa407a2e106f42a92838.png',
          tabTitle: 'FixedDataTable',
          audible: false,
        },
        {
          url: 'https://developer.chrome.com/extensions/declare_permissions',
          saved: false,
          savedBookmarkId: '',
          savedBookmarkIndex: 0,
          savedTitle: '',
          open: true,
          openTabId: 734,
          active: true,
          openTabIndex: 6,
          favIconUrl: 'https://www.google.com/images/icons/product/chrome-32.png',
          tabTitle: 'Declare Permissions - Google Chrome',
          audible: false,
        },
      ],
    };

  // dumpDiffs(tabWindowJS,expectedTabWindow);

  t.deepEqual(tabWindowJS, expectedTabWindow, 'makeFolderTabWindow basic functionality');

  // Check that title matches active tab:
  const baseTitle = baseTabWindow.title;
  t.equal(baseTitle, 'Declare Permissions - Google Chrome', 'title reflects active tab');

  // Now let's take state after closing the active tab that gave us our title:
  const updTabWindow  = TabWindow.updateWindow(baseTabWindow, chromeWindowSnap2);
  const updTabWindowJS = JSON.parse(JSON.stringify(updTabWindow.toJS()));

  // console.log("Updated tab window: ");
  // console.log(JSON.stringify(updTabWindowJS,null,2));

  const updTitle = updTabWindow.title;
  t.equal(updTitle, 'Fluxxor - Home', 'Correct title after closing previously active tab and updating window');

  t.end();
});

// A window with no active tab
const chromeWindowSnap3 =
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
          active: false,
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
          title: 'Component API | React',
          url: 'http://facebook.github.io/react/docs/component-api.html',
          width: 1258,
          windowId: 442,
        },
        {
          active: false,
          audible: false,
          favIconUrl: 'http://facebook.github.io/react/favicon.ico',
          height: 862,
          highlighted: false,
          id: 445,
          incognito: false,
          index: 1,
          muted: false,
          mutedCause: '',
          pinned: false,
          selected: false,
          status: 'complete',
          title: 'Tutorial | React',
          url: 'http://facebook.github.io/react/docs/tutorial.html',
          width: 1258,
          windowId: 442,
        },
        {
          active: false,
          audible: false,
          favIconUrl: 'http://cdn.sstatic.net/stackoverflow/img/favicon.ico?v=4f32ecc8f43d',
          height: 862,
          highlighted: false,
          id: 447,
          incognito: false,
          index: 2,
          muted: false,
          mutedCause: '',
          pinned: false,
          selected: false,
          status: 'complete',
          title: 'javascript - Is there any proper way to integrate d3.js graphics into Facebook React application? - Stack Overflow',
          url: 'http://stackoverflow.com/questions/21903604/is-there-any-proper-way-to-integrate-d3-js-graphics-into-facebook-react-applicat',
          width: 1258,
          windowId: 442,
        },
        {
          active: false,
          audible: false,
          height: 862,
          highlighted: false,
          id: 449,
          incognito: false,
          index: 3,
          muted: false,
          mutedCause: '',
          pinned: false,
          selected: false,
          status: 'complete',
          title: 'Flux | Application Architecture for Building User Interfaces',
          url: 'http://facebook.github.io/flux/docs/overview.html#content',
          width: 1258,
          windowId: 442,
        },
        {
          active: false,
          audible: false,
          favIconUrl: 'http://fluxxor.com/favicon.ico',
          height: 862,
          highlighted: false,
          id: 451,
          incognito: false,
          index: 4,
          muted: false,
          mutedCause: '',
          pinned: false,
          selected: false,
          status: 'complete',
          title: 'Fluxxor - Home',
          url: 'http://fluxxor.com/',
          width: 1258,
          windowId: 442,
        },
        {
          active: false,
          audible: false,
          favIconUrl: 'http://facebook.github.io/fixed-data-table/images/favicon-b4fca2450cb5aa407a2e106f42a92838.png',
          height: 862,
          highlighted: false,
          id: 453,
          incognito: false,
          index: 5,
          muted: false,
          mutedCause: '',
          pinned: false,
          selected: false,
          status: 'complete',
          title: 'FixedDataTable',
          url: 'http://facebook.github.io/fixed-data-table/',
          width: 1258,
          windowId: 442,
        },
      ],
      top: 222,
      type: 'normal',
      width: 1258,
    };

/*
 * make sure we still get a deterministic title even when no tab active */
test('noActiveTabTitle', (t) => {
  const baseTabWindow = TabWindow.makeChromeTabWindow(chromeWindowSnap3);

  const tabWindowJS = JSON.parse(JSON.stringify(baseTabWindow.toJS()));

  const baseTitle = baseTabWindow.title;

  t.equal(baseTitle, chromeWindowSnap3.tabs[0].title, 'use first tab title when no active tab');
  t.end();
});

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
          url: 'https://github.com/mbostock/d3/wiki/API-Reference',
        },
      ],
      dateAdded: 1395768341427,
      dateGroupModified: 1430260300118,
      id: '431',
      index: 4,
      parentId: '377',
      title: 'd3 docs',
    };

  const tabWindow = TabWindow.makeFolderTabWindow(bmFolder0);
  const tabWindowJS = JSON.parse(JSON.stringify(tabWindow.toJS()));

  // console.log("makeFolderTabWindow returned:");
  // console.log(JSON.stringify(tabWindowJS,null,2));

  const bmTabItem = tabWindow.tabItems.get(0);
  const bmTabTitle = bmTabItem.title;
  t.equal(bmTabTitle, bmFolder0.children[0].url, 'Revert to url when bookmark title missing');

  // window is still folder title:
  const windowTitle = tabWindow.title;

  // Let's use URL for title of untitled tabs:
  t.equal(windowTitle, bmFolder0.title, 'use bookmark folder for window title');

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
          url: 'https://github.com/mbostock/d3/wiki/API-Reference',
        },
      ],
      dateAdded: 1395768341427,
      dateGroupModified: 1430260300118,
      id: '431',
      index: 4,
      parentId: '377',

      // title deliberately omitted
    };

  const tabWindow1 = TabWindow.makeFolderTabWindow(bmFolder1);
  const tabWindow1JS = JSON.parse(JSON.stringify(tabWindow1.toJS()));

  const tabWindow1Title = tabWindow1.title;

  // revert to title of first tab:
  t.equal(tabWindow1Title, bmFolder1.children[0].title, 'null folder title reverts to tab title');

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
            windowId: 442,
          },
        ],
      };

  const chromeTabWindow = TabWindow.makeChromeTabWindow(chromeWindowSnap4);
  const chromeTabWindowJS = JSON.parse(JSON.stringify(chromeTabWindow.toJS()));

  const chromeTabWindowTitle = chromeTabWindow.title;

  t.equal(chromeTabWindow.title, chromeWindowSnap4.tabs[0].url, 'Fall back to url for tabs with no title');

  t.end();
});
