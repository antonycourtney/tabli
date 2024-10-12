import * as TabWindow from '../src/ts/tabWindow';
import * as tabWindowUtils from '../src/ts/tabWindowUtils';
import difflet from 'difflet';
import * as rawTestData from '../test-data/testData';
import log from 'loglevel';
import { enablePatches } from 'immer';

const testData = rawTestData as any;

function dumpDiffs(objA, objB) {
    var s = difflet({ indent: 2, comment: true }).compare(objA, objB);
    console.log('diffs:');
    console.log(s);
}

beforeAll(() => {
    enablePatches();
});

test('basic test', () => {});

test('makeFolderTabWindow', () => {
    const tabWindow = tabWindowUtils.makeFolderTabWindow(
        testData.d3BookmarkFolder,
    );
    const tabWindowJS = JSON.parse(JSON.stringify(tabWindow.toJS()));
    /*
      console.log("makeFolderTabWindow returned:")
      console.log(">>>>>>>")
      console.log(JSON.stringify(tabWindowJS,null,2))
      console.log(">>>>>>>")

      console.log('diffs between tabWindowJS and expected:')
      dumpDiffs(tabWindowJS, testData.d3InitialExpectedTabWindow)
  */

    expect(tabWindowJS).toMatchSnapshot();

    expect(tabWindow.title).toBe('d3 docs');
});

test('chromeTabWindow', () => {
    const baseTabWindow = tabWindowUtils.makeChromeTabWindow(
        testData.chromeWindowSnap,
    );

    const tabWindowJS = JSON.parse(JSON.stringify(baseTabWindow.toJS()));

    /*
      console.log("makeChromeTabWindow returned: ")
      console.log(">>>>>")
      console.log(JSON.stringify(tabWindowJS,null,2))
      console.log(">>>>>")
  */

    // dumpDiffs(tabWindowJS, expectedTabWindow);

    expect(tabWindowJS).toMatchSnapshot();

    // Check that title matches active tab:
    const baseTitle = baseTabWindow.title;
    expect(baseTitle).toBe('Declare Permissions - Google Chrome');

    // Now let's take state after closing the active tab that gave us our title:
    const updTabWindow = tabWindowUtils.updateWindow(
        baseTabWindow,
        testData.chromeWindowSnap2,
    );
    const updTabWindowJS = JSON.parse(JSON.stringify(updTabWindow.toJS()));

    // console.log("Updated tab window: ")
    // console.log(JSON.stringify(updTabWindowJS,null,2))

    const updTitle = updTabWindow.title;
    expect(updTitle).toBe('Fluxxor - Home');
});

/*
 * make sure we still get a deterministic title even when no tab active
 */
test('noActiveTabTitle', () => {
    const baseTabWindow = tabWindowUtils.makeChromeTabWindow(
        testData.chromeWindowSnap3,
    );

    const tabWindowJS = JSON.parse(JSON.stringify(baseTabWindow.toJS()));

    const baseTitle = baseTabWindow.title;

    expect(baseTitle).toBe(testData.chromeWindowSnap3.tabs[0].title);
});

test('missingSourceFieldsTests', () => {
    const bmFolder0 = {
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

    const tabWindow = tabWindowUtils.makeFolderTabWindow(
        bmFolder0 as any,
        false,
    );
    const tabWindowJS = JSON.parse(JSON.stringify(tabWindow.toJS()));

    // console.log("makeFolderTabWindow returned:")
    // console.log(JSON.stringify(tabWindowJS,null,2))

    const bmTabItem = tabWindow.tabItems[0];
    const bmTabTitle = bmTabItem.title;
    expect(bmTabTitle).toBe(bmFolder0.children[0].url);

    // window is still folder title:
    const windowTitle = tabWindow.title;

    // Let's use URL for title of untitled tabs:
    expect(windowTitle).toBe(bmFolder0.title);

    // TODO: Now omit folder title...
    const bmFolder1 = {
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

    const tabWindow1 = tabWindowUtils.makeFolderTabWindow(
        bmFolder1 as any,
        false,
    );
    const tabWindow1JS = JSON.parse(JSON.stringify(tabWindow1.toJS()));

    const tabWindow1Title = tabWindow1.title;

    // revert to title of first tab:
    // expect(tabWindow1Title).toBe(bmFolder1.children[0].title);

    const chromeWindowSnap4 = {
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

    const chromeTabWindow = tabWindowUtils.makeChromeTabWindow(
        chromeWindowSnap4 as any,
    );
    const chromeTabWindowJS = JSON.parse(
        JSON.stringify(chromeTabWindow.toJS()),
    );

    const chromeTabWindowTitle = chromeTabWindow.title;

    expect(chromeTabWindow.title).toBe(chromeWindowSnap4.tabs[0].url);
});

test('attachChromeWindow', () => {
    // Let's first create the tabWindow for our saved bookmark folder:
    const tabWindow = tabWindowUtils.makeFolderTabWindow(
        testData.d3BookmarkFolder,
    );
    const tabWindowJS = JSON.parse(JSON.stringify(tabWindow.toJS()));

    /*
    console.log('makeFolderTabWindow returned:');
    console.log('>>>>>>>');
    console.log(JSON.stringify(tabWindowJS, null, 2));
    console.log('>>>>>>>');

    console.log('diffs between tabWindowJS and expected:');
    dumpDiffs(tabWindowJS, testData.d3InitialExpectedTabWindow);
    */
    // expect(tabWindowJS).toEqual(testData.d3InitialExpectedTabWindow);
    expect(tabWindowJS).toMatchSnapshot();

    expect(tabWindow.title).toBe('d3 docs');

    // Now let's do the attach:
    const updTabWindow = tabWindowUtils.updateWindow(
        tabWindow,
        testData.d3OpenedChromeWindow as any,
    );
    const updTabWindowJS = JSON.parse(JSON.stringify(updTabWindow.toJS()));

    /*
      console.log("updateTabWindow returned:")
      console.log(">>>>>>>")
      console.log(JSON.stringify(updTabWindowJS,null,2))
      console.log(">>>>>>>")

      console.log("diffs between updTabWindow (actual) and expected:")
      dumpDiffs(updTabWindowJS, testData.d3AttachedExpectedTabWindow)
  */

    expect(updTabWindowJS).toMatchSnapshot();

    const tabCount = updTabWindow.tabItems.length;
    const openCount = updTabWindow.tabItems.filter((t) => t.open).length;
    const savedCount = updTabWindow.tabItems.filter((t) => t.saved).length;

    /*
    console.log(
        'attachChromeWindow: ' +
            tabCount +
            ' total tabs, ' +
            openCount +
            ' open, ' +
            savedCount +
            ' saved'
    );
    */
    expect(tabCount).toBe(7);
    expect(openCount).toBe(6);
    expect(savedCount).toBe(6);

    // Now revert the window to saved state:
    const revTabWindow = tabWindowUtils.removeOpenWindowState(
        updTabWindow,
        false,
    );

    const revTabCount = revTabWindow.tabItems.length;
    const revOpenCount = revTabWindow.tabItems.filter((t) => t.open).length;
    const revSavedCount = revTabWindow.tabItems.filter((t) => t.saved).length;

    /*
    console.log(
        'attachChromeWindow after revert: ' +
            revTabCount +
            ' total tabs, ' +
            revOpenCount +
            ' open, ' +
            revSavedCount +
            ' saved'
    );
    */
    expect(revTabCount).toBe(6);
    expect(revOpenCount).toBe(0);
    expect(revSavedCount).toBe(6);
});

const TEST_SAVE_TAB_ID = 445;

test('saveTab', () => {
    log.setLevel(log.levels.DEBUG);
    const baseTabWindow = tabWindowUtils.makeChromeTabWindow(
        testData.chromeWindowSnap,
    );

    const tabWindowJS = JSON.parse(JSON.stringify(baseTabWindow.toJS()));

    /*
        console.log("makeChromeTabWindow returned: ")
        console.log(">>>>>")
        console.log(JSON.stringify(tabWindowJS,null,2))
        console.log(">>>>>")
    */

    const entry = baseTabWindow.findChromeTabId(TEST_SAVE_TAB_ID);

    expect(entry.length).toBe(2);
    const [tabIndex, baseTabItem] = entry;

    console.log('saveTab: base tab item: ', baseTabItem.toJS());
    expect(baseTabItem.saved).toBe(false);
    expect(baseTabItem.savedState).toBe(null);

    const saveTabNode: chrome.bookmarks.BookmarkTreeNode = {
        dateAdded: 1405471223073,
        id: '999',
        index: 5,
        parentId: '777',
        title: 'React Tutorial',
        url: 'http://facebook.github.io/react/docs/tutorial.html',
    };

    const savedTabWindow = tabWindowUtils.saveTab(
        baseTabWindow,
        baseTabItem,
        saveTabNode,
    );
    const savedTabWindowJS = JSON.parse(JSON.stringify(savedTabWindow.toJS()));

    /*
    console.log('savedTab returned: ');
    console.log('>>>>>');
    console.log(JSON.stringify(savedTabWindowJS, null, 2));
    console.log('>>>>>');
    */

    const savedEntry = savedTabWindow.findChromeTabId(TEST_SAVE_TAB_ID);

    expect(savedEntry.length).toBe(2);
    const [savedTabIndex, savedTabItem] = savedEntry;

    console.log('saveTab: savedTabItem:', savedTabItem.toJS());
    expect(savedTabItem.saved).toBe(true);
    expect(savedTabItem.savedState.bookmarkId).toBe(saveTabNode.id);
    expect(savedTabItem.savedState.bookmarkIndex).toBe(saveTabNode.index);
    expect(savedTabItem.savedState.url).toBe(saveTabNode.url);
});
