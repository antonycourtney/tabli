import React from 'react';

import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { linkTo } from '@storybook/addon-links';

import { themes, ThemeContext } from '../src/ts/components/themeContext';
import * as styles from '../src/ts/components/cssStyles';
import { css, cx } from '@emotion/css';
import TabItemUI from '../src/ts/components/TabItemUI';
import { PopupBaseProps, Popup } from '../src/ts/components/Popup';
import * as tabWindowUtils from '../src/ts/tabWindowUtils';

import testData from '../test-data/renderTest-chromeWindowSnap';
import TabManagerState from '../src/ts/tabManagerState';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
// Prevent VS Code from complaining about this JSON import:
// @ts-ignore
import windowSnapshot from '../test-data/windowSnapshot.json';

import { mkRef, appContainer, mutableGet, StateRefProps } from 'oneref';
import FilteredTabWindowUI, {
    FilteredTabWindowUIBaseProps,
    FilteredTabWindowUIProps,
} from '../src/ts/components/FilteredTabWindowUI';
import { TabWindow } from '../src/ts/tabWindow';
import { matchTabWindow } from '../src/ts/searchOps';
import { HeaderButtonSVG } from '../src/ts/components/HeaderButtonSVG';
import * as svg from '../src/ts/components/svg';

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
    .set('showRelNotes', false)
    .setCurrentWindowId(TEST_OPEN_WINDOW_ID);

console.log('mockWinStore: ', mockWinStore.toJS());

console.log('mockWinStore: getOpen(): ', mockWinStore.getOpen().toJS());

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
> = (props) => {
    const { stateRef } = props;
    const appState = mutableGet(stateRef);
    const tabWindow = appState.getTabWindowByChromeId(TEST_OPEN_WINDOW_ID);
    return (
        <FilteredTabWindowUI
            stateRef={stateRef}
            tabWindow={tabWindow!}
            itemMatches={null}
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

const statefulPopup = (st0: TabManagerState) =>
    appContainer<TabManagerState, PopupBaseProps>(st0, Popup);

const LightPopup = statefulPopup(mockWinStore);

const darkStore = mockWinStore.setIn(['preferences', 'theme'], 'dark');

const DarkPopup = statefulPopup(darkStore);

// helper to render a story horizontally centered:
const rootStyle = css({
    paddingTop: 10,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
});

const rootInnerStyle = css({
    width: 450,
    height: 600,
    border: '1px solid #888888',
});

const StoryRoot: React.FunctionComponent = ({ children }) => {
    return (
        <div className={rootStyle}>
            <div className={rootInnerStyle}>{children}</div>
        </div>
    );
};

const debugBorder = css({
    border: '1px solid #ff0000',
});

const debugBlueBorder = css({
    border: '1px solid #0000ff',
});

const debugRedBG = css({
    backgroundColor: 'lightcoral',
});

const debugBlueBG = css({
    backgroundColor: 'lightblue',
});

const buttonContainerStyle = css({
    display: 'flex',
    width: '100%',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    height: 24,
});

const AllSVGButtons = ({}) => {
    const svgs = [
        // svg.popout,
        // svg.popin,
        // svg.menu,
        svg.expandMore,
        svg.expandLess,
        svg.check,
        // svg.page,
        svg.edit,
        svg.sound,
        svg.silent,
        svg.chevron,
        svg.closeIcon,
    ];
    const buttons = svgs.map((svgElem, idx) => (
        <HeaderButtonSVG
            className={debugRedBG}
            svgClassName={debugBlueBG}
            key={idx}
            svgElem={svgElem}
        />
    ));
    return (
        <div className={cx(buttonContainerStyle, debugBorder)}>{buttons}</div>
    );
};

const onDragEnd = (result: DropResult) => {
    console.log('onDragEnd: ', result);
};

storiesOf('Tabli Components', module)
    .add('Expand All Button', () => (
        <StoryRoot>
            <button
                className={styles.toolbarButton(theme)}
                title="Expand/Collapse All Window Summaries"
            >
                <div className={styles.expandAllIconStyle(theme)} />
            </button>
        </StoryRoot>
    ))
    .add('SVG close button', () => (
        <StoryRoot>
            <HeaderButtonSVG className={debugBorder} svgElem={svg.closeIcon} />
        </StoryRoot>
    ))
    .add('All SVG buttons', () => (
        <StoryRoot>
            <AllSVGButtons />
        </StoryRoot>
    ))
    /*
    .add('Tab Item', () => (
        <StoryRoot>
            <DragDropContext onDragEnd={onDragEnd}>
                <TabItemUI
                    stateRef={stateRef}
                    tabWindow={testTabWindow}
                    tab={testTabItem}
                    tabIndex={0}
                    isSelected={false}
                    onItemSelected={() => console.log('item selected!')}
                />
            </DragDropContext>
        </StoryRoot>
    )) */
    .add('Filtered Tab Window', () => (
        <StoryRoot>
            <DragDropContext onDragEnd={onDragEnd}>
                <FilteredTabWindowUI
                    stateRef={stateRef}
                    tabWindow={testTabWindow}
                    itemMatches={null}
                    isSelected={false}
                    isFocused={true}
                    selectedTabIndex={1}
                    modalActions={modalActions}
                    onItemSelected={() => console.log('onItemSelected')}
                    expandAll={false}
                />
            </DragDropContext>
        </StoryRoot>
    ))
    .add('Stateful Filtered Tab Window', () => (
        <StoryRoot>
            <DragDropContext onDragEnd={onDragEnd}>
                <StatefulTabWindowContainer
                    tabWindow={testTabWindow}
                    itemMatches={null}
                    isSelected={false}
                    isFocused={true}
                    selectedTabIndex={1}
                    modalActions={modalActions}
                    onItemSelected={() => console.log('onItemSelected')}
                    expandAll={false}
                />
            </DragDropContext>
        </StoryRoot>
    ))
    .add('Full Popup', () => (
        <StoryRoot>
            <DragDropContext onDragEnd={onDragEnd}>
                <LightPopup isPopout={false} noListener={true} />
            </DragDropContext>
        </StoryRoot>
    ))
    .add('Dark Mode Full Popup', () => (
        <StoryRoot>
            <DragDropContext onDragEnd={onDragEnd}>
                <DarkPopup isPopout={false} noListener={true} />
            </DragDropContext>
        </StoryRoot>
    ));
