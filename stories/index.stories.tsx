import React from 'react';

import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { linkTo } from '@storybook/addon-links';

import { themes, ThemeContext } from '../src/ts/components/themeContext';
import * as styles from '../src/ts/components/cssStyles';
import { css, cx } from 'emotion';
import TabItemUI from '../src/ts/components/TabItemUI';
import * as tabWindowUtils from '../src/ts/tabWindowUtils';
import HTML5Backend from 'react-dnd-html5-backend';
import { DragDropContextProvider } from 'react-dnd';

import testData from '../test-data/renderTest-chromeWindowSnap';
import TabManagerState from '../src/ts/tabManagerState';

// Prevent VS Code from complaining about this JSON import:
// @ts-ignore
import windowSnapshot from '../test-data/windowSnapshot.json';

import { mkRef, appContainer, mutableGet, StateRefProps } from 'oneref';
import FilteredTabWindowUI, {
    FilteredTabWindowUIBaseProps,
    FilteredTabWindowUIProps
} from '../src/ts/components/FilteredTabWindowUI';
import { TabWindow } from '../src/ts/tabWindow';

const theme = themes.light;

storiesOf('Test Story', module).add('Basic Div', () => <div />);

const testSavedWindow = tabWindowUtils.tabWindowFromJS(windowSnapshot);

const TEST_OPEN_WINDOW_ID = 999;

const testOpenSavedWindow = testSavedWindow
    .set('open', true)
    .set('openWindowId', TEST_OPEN_WINDOW_ID);

const testChromeWindows = testData.chromeWindows;

// log.info('renderPage: testData: ', testData)

const emptyWinStore = new TabManagerState();
const mockWinStore = emptyWinStore
    .syncWindowList(testChromeWindows as any)
    .registerTabWindow(testOpenSavedWindow)
    .set('showRelNotes', false);

console.log('mockWinStore: ', mockWinStore.toJS());

const stateRef = mkRef(mockWinStore);

const TEST_URL = 'https://www.quora.com/';

const [[testTabWindow, testTabItem]] = mockWinStore.findURL(TEST_URL);

console.log('testTabItem: ', testTabItem.toJS());

const openSaveModal = (tabWindow: TabWindow) => {
    console.log('openSaveModal');
};
const openRevertModal = (tabWindow: TabWindow) => {
    console.log('openRevertModal');
};
const modalActions = { openSaveModal, openRevertModal };

/* helper to wrap a component rendered from a StateRef<T> */
// const statefulComponent = ()

const TEST_UNSAVED_OPEN_WINDOW_ID = 13;

const StatefulFilteredTabWindowUI: React.FunctionComponent<
    FilteredTabWindowUIBaseProps & StateRefProps<TabManagerState>
> = props => {
    const { stateRef } = props;
    const appState = mutableGet(stateRef);
    const tabWindow = appState.getTabWindowByChromeId(TEST_OPEN_WINDOW_ID);
    return (
        <FilteredTabWindowUI
            stateRef={stateRef}
            tabWindow={tabWindow!}
            itemMatches={null}
            searchStr={null}
            isSelected={false}
            isFocused={true}
            selectedTabIndex={1}
            modalActions={modalActions}
            onItemSelected={() => console.log('onItemSelected')}
            expandAll={false}
        />
    );
};

const StatefulTabWindowContainer = appContainer<
    TabManagerState,
    FilteredTabWindowUIBaseProps
>(mockWinStore, StatefulFilteredTabWindowUI);

// helper to render a story horizontally centered:
const rootStyle = css({
    paddingTop: 10,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start'
});

const StoryRoot: React.FunctionComponent = ({ children }) => {
    return <div className={rootStyle}>{children}</div>;
};

storiesOf('Tabli Components', module)
    .add('Expand All Button', () => (
        <StoryRoot>
            <button
                className={styles.toolbarButton(theme)}
                title="Expand/Collapse All Window Summaries"
            >
                <div
                    className={cx(
                        styles.toolbarButtonIcon(theme),
                        styles.expandAllIconStyle
                    )}
                />
            </button>
        </StoryRoot>
    ))
    .add('Tab Item', () => (
        <StoryRoot>
            <DragDropContextProvider backend={HTML5Backend}>
                <TabItemUI
                    stateRef={stateRef}
                    tabWindow={testTabWindow}
                    tab={testTabItem}
                    tabIndex={0}
                    isSelected={false}
                    onItemSelected={() => console.log('item selected!')}
                />
            </DragDropContextProvider>
        </StoryRoot>
    ))
    .add('Filtered Tab Window', () => (
        <StoryRoot>
            <DragDropContextProvider backend={HTML5Backend}>
                <FilteredTabWindowUI
                    stateRef={stateRef}
                    tabWindow={testTabWindow}
                    itemMatches={null}
                    searchStr={null}
                    isSelected={false}
                    isFocused={true}
                    selectedTabIndex={1}
                    modalActions={modalActions}
                    onItemSelected={() => console.log('onItemSelected')}
                    expandAll={false}
                />
            </DragDropContextProvider>
        </StoryRoot>
    ))
    .add('Stateful Filtered Tab Window', () => (
        <StoryRoot>
            <DragDropContextProvider backend={HTML5Backend}>
                <StatefulTabWindowContainer
                    tabWindow={testTabWindow}
                    itemMatches={null}
                    searchStr={null}
                    isSelected={false}
                    isFocused={true}
                    selectedTabIndex={1}
                    modalActions={modalActions}
                    onItemSelected={() => console.log('onItemSelected')}
                    expandAll={false}
                />
            </DragDropContextProvider>
        </StoryRoot>
    ));
