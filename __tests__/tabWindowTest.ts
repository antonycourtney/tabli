import * as TabWindow from '../src/ts/tabWindow';
import * as tabWindowUtils from '../src/ts/tabWindowUtils';
import difflet from 'difflet';
import * as rawTestData from '../test-data/testData';

const testData = rawTestData as any;

function dumpDiffs(objA, objB) {
    var s = difflet({ indent: 2, comment: true }).compare(objA, objB);
    console.log('diffs:');
    console.log(s);
}

test('basic test', () => {});

test('makeFolderTabWindow', () => {
    const tabWindow = tabWindowUtils.makeFolderTabWindow(
        testData.d3BookmarkFolder
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
    expect(tabWindowJS).toEqual(testData.d3InitialExpectedTabWindow);

    expect(tabWindow.title).toBe('d3 docs');
});

test('chromeTabWindow', () => {
    const baseTabWindow = tabWindowUtils.makeChromeTabWindow(
        testData.chromeWindowSnap
    );

    const tabWindowJS = JSON.parse(JSON.stringify(baseTabWindow.toJS()));

    /*
      console.log("makeChromeTabWindow returned: ")
      console.log(">>>>>")
      console.log(JSON.stringify(tabWindowJS,null,2))
      console.log(">>>>>")
  */
    const expectedTabWindow = {
        saved: false,
        savedTitle: '',
        savedFolderId: '',
        open: true,
        openWindowId: 442,
        windowType: 'normal',
        width: 1258,
        height: 957,
        tabItems: [
            {
                saved: false,
                savedState: null,
                open: true,
                openState: {
                    url:
                        'http://facebook.github.io/react/docs/component-api.html',
                    openTabId: 443,
                    active: false,
                    openTabIndex: 0,
                    favIconUrl: 'http://facebook.github.io/react/favicon.ico',
                    title: 'Component API | React',
                    audible: false,
                    pinned: false,
                    isSuspended: false,
                    muted: false
                }
            },
            {
                saved: false,
                savedState: null,
                open: true,
                openState: {
                    url: 'http://facebook.github.io/react/docs/tutorial.html',
                    openTabId: 445,
                    active: false,
                    openTabIndex: 1,
                    favIconUrl: 'http://facebook.github.io/react/favicon.ico',
                    title: 'Tutorial | React',
                    audible: false,
                    pinned: false,
                    isSuspended: false,
                    muted: false
                }
            },
            {
                saved: false,
                savedState: null,
                open: true,
                openState: {
                    url:
                        'http://stackoverflow.com/questions/21903604/is-there-any-proper-way-to-integrate-d3-js-graphics-into-facebook-react-applicat',
                    openTabId: 447,
                    active: false,
                    openTabIndex: 2,
                    favIconUrl:
                        'http://cdn.sstatic.net/stackoverflow/img/favicon.ico?v=4f32ecc8f43d',
                    title:
                        'javascript - Is there any proper way to integrate d3.js graphics into Facebook React application? - Stack Overflow',
                    audible: false,
                    pinned: false,
                    isSuspended: false,
                    muted: false
                }
            },
            {
                saved: false,
                savedState: null,
                open: true,
                openState: {
                    url:
                        'http://facebook.github.io/flux/docs/overview.html#content',
                    openTabId: 449,
                    active: false,
                    openTabIndex: 3,
                    favIconUrl: '',
                    title:
                        'Flux | Application Architecture for Building User Interfaces',
                    audible: false,
                    pinned: false,
                    isSuspended: false,
                    muted: false
                }
            },
            {
                saved: false,
                savedState: null,
                open: true,
                openState: {
                    url: 'http://fluxxor.com/',
                    openTabId: 451,
                    active: false,
                    openTabIndex: 4,
                    favIconUrl: 'http://fluxxor.com/favicon.ico',
                    title: 'Fluxxor - Home',
                    audible: false,
                    pinned: false,
                    isSuspended: false,
                    muted: false
                }
            },
            {
                saved: false,
                savedState: null,
                open: true,
                openState: {
                    url: 'http://facebook.github.io/fixed-data-table/',
                    openTabId: 453,
                    active: false,
                    openTabIndex: 5,
                    favIconUrl:
                        'http://facebook.github.io/fixed-data-table/images/favicon-b4fca2450cb5aa407a2e106f42a92838.png',
                    title: 'FixedDataTable',
                    audible: false,
                    pinned: false,
                    isSuspended: false,
                    muted: false
                }
            },
            {
                saved: false,
                savedState: null,
                open: true,
                openState: {
                    url:
                        'https://developer.chrome.com/extensions/declare_permissions',
                    openTabId: 734,
                    active: true,
                    openTabIndex: 6,
                    openerTabId: 449,
                    favIconUrl:
                        'https://www.google.com/images/icons/product/chrome-32.png',
                    title: 'Declare Permissions - Google Chrome',
                    audible: false,
                    pinned: false,
                    isSuspended: false,
                    muted: false
                }
            }
        ],
        snapshot: false,
        chromeSessionId: null,
        expanded: null
    };

    // dumpDiffs(tabWindowJS, expectedTabWindow);

    expect(tabWindowJS).toEqual(expectedTabWindow);

    // Check that title matches active tab:
    const baseTitle = baseTabWindow.title;
    expect(baseTitle).toBe('Declare Permissions - Google Chrome');

    // Now let's take state after closing the active tab that gave us our title:
    const updTabWindow = tabWindowUtils.updateWindow(
        baseTabWindow,
        testData.chromeWindowSnap2
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
        testData.chromeWindowSnap3
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
                url: 'https://github.com/mbostock/d3/wiki/API-Reference'
            }
        ],
        dateAdded: 1395768341427,
        dateGroupModified: 1430260300118,
        id: '431',
        index: 4,
        parentId: '377',
        title: 'd3 docs'
    };

    const tabWindow = tabWindowUtils.makeFolderTabWindow(
        bmFolder0 as any,
        false
    );
    const tabWindowJS = JSON.parse(JSON.stringify(tabWindow.toJS()));

    // console.log("makeFolderTabWindow returned:")
    // console.log(JSON.stringify(tabWindowJS,null,2))

    const bmTabItem = tabWindow.tabItems.get(0);
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
                url: 'https://github.com/mbostock/d3/wiki/API-Reference'
            }
        ],
        dateAdded: 1395768341427,
        dateGroupModified: 1430260300118,
        id: '431',
        index: 4,
        parentId: '377'

        // title deliberately omitted
    };

    const tabWindow1 = tabWindowUtils.makeFolderTabWindow(
        bmFolder1 as any,
        false
    );
    const tabWindow1JS = JSON.parse(JSON.stringify(tabWindow1.toJS()));

    const tabWindow1Title = tabWindow1.title;

    // revert to title of first tab:
    expect(tabWindow1Title).toBe(bmFolder1.children[0].title);

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
                windowId: 442
            }
        ]
    };

    const chromeTabWindow = tabWindowUtils.makeChromeTabWindow(
        chromeWindowSnap4 as any
    );
    const chromeTabWindowJS = JSON.parse(
        JSON.stringify(chromeTabWindow.toJS())
    );

    const chromeTabWindowTitle = chromeTabWindow.title;

    expect(chromeTabWindow.title).toBe(chromeWindowSnap4.tabs[0].url);
});

test('attachChromeWindow', () => {
    // Let's first create the tabWindow for our saved bookmark folder:
    const tabWindow = tabWindowUtils.makeFolderTabWindow(
        testData.d3BookmarkFolder
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
    expect(tabWindowJS).toEqual(testData.d3InitialExpectedTabWindow);

    expect(tabWindow.title).toBe('d3 docs');

    // Now let's do the attach:
    const updTabWindow = tabWindowUtils.updateWindow(
        tabWindow,
        testData.d3OpenedChromeWindow as any
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

    expect(updTabWindowJS).toEqual(testData.d3AttachedExpectedTabWindow);

    const tabCount = updTabWindow.tabItems.count();
    const openCount = updTabWindow.tabItems.count(t => t.open);
    const savedCount = updTabWindow.tabItems.count(t => t.saved);

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
        false
    );

    const revTabCount = revTabWindow.tabItems.count();
    const revOpenCount = revTabWindow.tabItems.count(t => t.open);
    const revSavedCount = revTabWindow.tabItems.count(t => t.saved);

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
