import React from 'react';

import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { linkTo } from '@storybook/addon-links';

import { themes, ThemeContext } from '../src/ts/components/themeContext';
import * as styles from '../src/ts/components/cssStyles';
import { css, cx } from 'emotion';
import TabItemUI from '../src/ts/components/TabItemUI';

import HTML5Backend from 'react-dnd-html5-backend';
import { DragDropContextProvider } from 'react-dnd';

import testData from '../test-data/renderTest-chromeWindowSnap';
import TabManagerState from '../src/ts/tabManagerState';

import { mkRef, appContainer, mutableGet, StateRefProps } from 'oneref';
import FilteredTabWindowUI, {
    FilteredTabWindowUIBaseProps,
    FilteredTabWindowUIProps
} from '../src/ts/components/FilteredTabWindowUI';
import { TabWindow } from '../src/ts/tabWindow';

const theme = themes.light;

storiesOf('Test Story', module).add('Basic Div', () => <div />);

const testChromeWindows = testData.chromeWindows;

// log.info('renderPage: testData: ', testData)

const emptyWinStore = new TabManagerState();
const mockWinStore = emptyWinStore
    .syncWindowList(testChromeWindows as any)
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

const StatefulFilteredTabWindowUI: React.FunctionComponent<
    FilteredTabWindowUIBaseProps & StateRefProps<TabManagerState>
> = props => {
    const { stateRef } = props;
    const appState = mutableGet(stateRef);
    const tabWindow = appState.getTabWindowByChromeId(13);
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

storiesOf('Tabli Components', module)
    .add('Expand All Button', () => (
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
    ))
    .add('Tab Item', () => (
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
    ))
    .add('Filtered Tab Window', () => (
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
    ))
    .add('Stateful Filtered Tab Window', () => (
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
    ));

// Omit because not interesting and no types:
// import { Button, Welcome } from '@storybook/react/demo';
/*
storiesOf('Welcome', module).add('to Storybook', () => (
    <Welcome showApp={linkTo('Button')} />
));

storiesOf('Button', module)
    .add('with text', () => (
        <Button onClick={action('clicked')}>Hello Button</Button>
    ))
    .add('with some emoji', () => (
        <Button onClick={action('clicked')}>
            <span role="img" aria-label="so cool">
                😀 😎 👍 💯
            </span>
        </Button>
    ));
*/
