import * as fs from 'fs';
import TabManagerState from '../src/ts/tabManagerState';
import * as actions from '../src/ts/actions';
import React from 'react';
import ReactTestUtils, {
    findRenderedDOMComponentWithClass
} from 'react-dom/test-utils';
import { PopupBaseProps, Popup } from '../src/ts/components/Popup';
import SelectablePopup from '../src/ts/components/SelectablePopup';
import SearchBar from '../src/ts/components/SearchBar';
import TabItemUI from '../src/ts/components/TabItemUI';
import * as popperJS from 'popper.js';
import * as sinon from 'sinon';
import { appContainer } from 'oneref';
import { resetServerContext } from 'react-beautiful-dnd';

beforeAll(() => {
    if (window.document)
        (document as any).createRange = () => {
            let ret = {
                setStart: () => {},
                setEnd: () => {},
                commonAncestorContainer: {
                    nodeName: 'BODY',
                    ownerDocument: document
                }
            };
            return ret;
        };
});

test('adds 1 + 2 to equal 3', () => {
    expect(1 + 2).toBe(3);
});

function getWindowSnap() {
    const content = fs.readFileSync('test-data/chromeWindowSnap.json');
    const snap = JSON.parse(content.toString());
    return snap.chromeWindows;
}

function initialWinStore() {
    const folderId = 6666;
    const archiveFolderId = 7777;
    const baseWinStore = new TabManagerState({
        folderId,
        archiveFolderId
    } as any);

    const windowList = getWindowSnap();
    const initWinStore = baseWinStore.syncWindowList(windowList);

    return initWinStore;
}

test('basic load state', () => {
    const snap = getWindowSnap();

    // console.log('basic load state: ', snap);

    expect(snap.length).toBe(3);
});

test('basic window state', () => {
    const winStore = initialWinStore();

    const openTabCount = winStore.countOpenTabs();
    const openWinCount = winStore.countOpenWindows();
    const savedCount = winStore.countSavedWindows();

    // const summarySentence=openTabCount + " Open Tabs, " + openWinCount + " Open Windows, " + savedCount + " Saved Windows"
    const summarySentence =
        'Tabs: ' +
        openTabCount +
        ' Open. Windows: ' +
        openWinCount +
        ' Open, ' +
        savedCount +
        ' Saved.';

    console.log(summarySentence + '\n');
    expect(openTabCount).toBe(14);
    expect(openWinCount).toBe(3);
    expect(savedCount).toBe(0);
});

test('basic load state', () => {
    const snap = getWindowSnap();

    expect(snap.length).toBe(3);
});

test('basic window state', () => {
    const winStore = initialWinStore();

    const openTabCount = winStore.countOpenTabs();
    const openWinCount = winStore.countOpenWindows();
    const savedCount = winStore.countSavedWindows();

    // const summarySentence=openTabCount + " Open Tabs, " + openWinCount + " Open Windows, " + savedCount + " Saved Windows"
    const summarySentence =
        'Tabs: ' +
        openTabCount +
        ' Open. Windows: ' +
        openWinCount +
        ' Open, ' +
        savedCount +
        ' Saved.';

    console.log(summarySentence + '\n');
    expect(openTabCount).toBe(14);
    expect(openWinCount).toBe(3);
    expect(savedCount).toBe(0);
});

/*
 * A simple class wrapper, because these tests pre-date functional
 * components:
 */
class ClassWrapper extends React.Component {
    render() {
        return <div>{this.props.children}</div>;
    }
}

test('basic render test', () => {
    (window as any).isTesting = true;

    const winStore = initialWinStore();

    expect(winStore).not.toBe(null);

    const App = appContainer<TabManagerState, PopupBaseProps>(winStore, Popup);

    resetServerContext();
    const component = ReactTestUtils.renderIntoDocument<
        PopupBaseProps,
        React.Component<PopupBaseProps>
    >(
        <ClassWrapper>
            <App isPopout={false} noListener={true} />
        </ClassWrapper>
    );

    expect(component).not.toBe(null);
});

/*
   * disabling because menu is now handled by our
   * custom MenuButton, which uses Popper.js, which doesn't
   * play nicely with our fake dom setup. :-(
  test('basic event test', (t) => {
  
    // Let's stub out all the stubs in actions libs:
    var actionsMock = sinon.mock(actions)
  
    actionsMock.expects('showHelp').once()
  
    const winStore = initialWinStore()
  
    const component = ReactTestUtils.renderIntoDocument(
      <TabliPopup storeRef={null} initialWinStore={winStore} noListener={true} />
    )
  
    console.log('event test: rendered into document')
  
    const helpButton = ReactTestUtils.findRenderedDOMComponentWithClass(component, 'help-button')
  
    ReactTestUtils.Simulate.click(helpButton)
  
    console.log('simulated help click')
  
    // N.B. verify restores mocked methods:
    actionsMock.verify()
  
    console.log('event test done')
    t.end()
  })
  */

test('isearch test', () => {
    // Let's stub out all the stubs in actions libs:
    var actionsMock = sinon.mock(actions);

    const winStore = initialWinStore();

    const App = appContainer<TabManagerState, PopupBaseProps>(winStore, Popup);

    resetServerContext();
    const component = ReactTestUtils.renderIntoDocument<
        PopupBaseProps,
        React.Component<PopupBaseProps>
    >(
        <ClassWrapper>
            <App isPopout={false} noListener={true} />
        </ClassWrapper>
    );

    console.log('document: ', document);

    // console.log('isearch test: component: ', component);

    const baseTabItems = ReactTestUtils.scryRenderedDOMComponentsWithClass(
        component,
        'tabItemHoverContainer'
    );

    console.log('isearch test: initial tab items found: ', baseTabItems.length);

    expect(baseTabItems.length).toBe(14);

    /*
    const selectablePopup = ReactTestUtils.findRenderedComponentWithType(
        component,
        SelectablePopup
    );

    const searchInput = selectablePopup.searchInputRef;
    */
    const searchInput = findRenderedDOMComponentWithClass(
        component,
        'search-input'
    ) as HTMLInputElement;
    searchInput.value = 'git';

    // const searchBar = ReactTestUtils.findRenderedComponentWithType(component, SearchBar)
    // const searchInput = searchBar.refs.searchInput
    // searchInput.value = 'git'

    // const inputComponents = ReactTestUtils.scryRenderedDOMComponentsWithTag(searchBar,'input')
    // console.log("inputComponents: ", inputComponents)

    ReactTestUtils.Simulate.change(searchInput); //  {target: { value: 'git'}})

    const filteredTabItems = ReactTestUtils.scryRenderedDOMComponentsWithClass(
        component,
        'tabItemHoverContainer'
    );

    console.log(
        'isearch test: filtered tab items found: ',
        filteredTabItems.length
    );

    expect(filteredTabItems.length).toBe(8);

    actionsMock.restore();
});

test('search and open test', () => {
    // Let's stub out all the stubs in actions libs:
    var actionsMock = sinon.mock(actions);

    actionsMock.expects('activateTab').once();

    const winStore = initialWinStore();
    const App = appContainer<TabManagerState, PopupBaseProps>(winStore, Popup);
    resetServerContext();
    const component = ReactTestUtils.renderIntoDocument<
        PopupBaseProps,
        React.Component<PopupBaseProps>
    >(
        <ClassWrapper>
            <App isPopout={false} noListener={true} />
        </ClassWrapper>
    );

    const baseTabItems = ReactTestUtils.scryRenderedDOMComponentsWithClass(
        component,
        'tabItemHoverContainer'
    );

    console.log(
        'search and open test: initial tab items found: ',
        baseTabItems.length
    );

    expect(baseTabItems.length).toBe(14);

    /*
    const searchBar = ReactTestUtils.findRenderedComponentWithType(
        component,
        SearchBar
    );

    const selectablePopup = ReactTestUtils.findRenderedComponentWithType(
        component,
        SelectablePopup
    );

    const searchInput = selectablePopup.searchInputRef;
    */

    const searchInput = findRenderedDOMComponentWithClass(
        component,
        'search-input'
    ) as HTMLInputElement;

    searchInput.value = 'git';

    console.log('About to update searchInput.value');
    searchInput.value = 'git';
    ReactTestUtils.Simulate.change(searchInput);
    console.log('simulated input value update applied.');

    const filteredTabItems = ReactTestUtils.scryRenderedDOMComponentsWithClass(
        component,
        'tabItemHoverContainer'
    );

    console.log(
        'search and open test: filtered tab items found: ',
        filteredTabItems.length
    );

    expect(filteredTabItems.length).toBe(8);

    ReactTestUtils.Simulate.keyDown(searchInput, {
        key: 'Enter',
        keyCode: 13,
        which: 13
    });

    actionsMock.verify();
});
