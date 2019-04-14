import * as log from 'loglevel'; // eslint-disable-line no-unused-consts
import * as React from 'react';
import * as oneref from 'oneref';
import * as Immutable from 'immutable';
import { cx, css } from 'emotion';
import * as styles from './cssStyles';
import * as actions from '../actions';
import * as Constants from './constants';
import WindowHeader from './WindowHeader';
import TabItemUI from './TabItemUI';
import { TabWindow, TabItem } from '../tabWindow';
import TabManagerState from '../tabManagerState';
import { useState, useRef } from 'react';
import { FilteredTabWindow } from '../searchOps';
import ModalActions from './modalActions';

const expandablePanelContentOpenStyle = css({
    marginTop: 0
});
const expandablePanelContentClosedStyle = css({
    marginTop: '-999px'
});
const tabWindowSelectedStyle = css({
    border: Constants.selectedBorder
});

interface FilteredTabWindowUIBaseProps {
    filteredTabWindow: FilteredTabWindow;
    isSelected: boolean;
    isFocused: boolean;
    modalActions: ModalActions;
    selectedTabIndex: number;
    searchStr: string | null;
    onItemSelected: () => void; // N.B. just clears selection; tab or window selected both trigger this
}

type FilteredTabWindowUIProps = FilteredTabWindowUIBaseProps &
    oneref.StateRefProps<TabManagerState>;

const FilteredTabWindowUI: React.FunctionComponent<
    FilteredTabWindowUIProps
> = ({
    filteredTabWindow,
    searchStr,
    isSelected,
    isFocused,
    appState,
    stateRef,
    onItemSelected,
    selectedTabIndex,
    modalActions
}: FilteredTabWindowUIProps) => {
    const [prevIsSelected, setPrevIsSelected] = useState(false);
    const windowDivRef = useRef<HTMLDivElement | null>(null);

    if (isSelected && !prevIsSelected && windowDivRef.current) {
        (windowDivRef.current! as any).scrollIntoViewIfNeeded();
    }

    /* We may want to use a ref instead of state here just to prevent
     * extra re-rendering
     */
    if (isSelected !== prevIsSelected) {
        setPrevIsSelected(isSelected);
    }

    const handleOpen = () => {
        actions.openWindow(
            appState,
            appState.getCurrentWindow(),
            filteredTabWindow.tabWindow,
            stateRef
        );
        if (onItemSelected) {
            onItemSelected();
        }
    };

    const handleClose = () => {
        // eslint-disable-line no-unused-consts
        // log.log("handleClose")
        actions.closeWindow(appState, filteredTabWindow.tabWindow, stateRef);
    };

    const handleRevert = () => {
        modalActions.openRevertModal(filteredTabWindow);
    };

    /* expanded state follows window open/closed state unless it is
     * explicitly set interactively by the user
     */
    const getExpandedState = () => {
        const tabWindow = filteredTabWindow.tabWindow;
        return tabWindow.isExpanded(appState);
    };

    const renderTabItems = (
        tabWindow: TabWindow,
        tabs: Immutable.Collection.Indexed<TabItem>
    ) => {
        /*
         * We tried explicitly checking for expanded state and
         * returning null if not expanded, but (somewhat surprisingly) it
         * was no faster, even with dozens of hidden tabs
         */
        const items = [];
        for (let i = 0; i < tabs.count(); i++) {
            const id = 'tabItem-' + i;
            const isSelected = i === selectedTabIndex;
            const tabItem = (
                <TabItemUI
                    appState={appState}
                    stateRef={stateRef}
                    tabWindow={tabWindow}
                    tab={tabs.get(i)!}
                    key={id}
                    tabIndex={i}
                    isSelected={isSelected}
                    onItemSelected={onItemSelected}
                />
            );
            items.push(tabItem);
        }

        const expanded = getExpandedState();
        const expandableContentStyle = expanded
            ? expandablePanelContentOpenStyle
            : expandablePanelContentClosedStyle;
        const tabListStyle = cx(styles.tabList, expandableContentStyle);
        return <div className={tabListStyle}>{items}</div>;
    };

    const handleExpand = (expand: boolean) => {
        actions.expandWindow(filteredTabWindow.tabWindow, expand, stateRef);
    };

    const tabWindow = filteredTabWindow.tabWindow;
    let tabs;
    if (searchStr == null || searchStr.length === 0) {
        tabs = tabWindow.tabItems;
    } else {
        tabs = filteredTabWindow.itemMatches.map(fti => fti.tabItem);
    }

    /*
     * optimization:  Let's only render tabItems if expanded
     */
    const expanded = getExpandedState();
    let tabItems: JSX.Element | null = null;
    if (expanded) {
        tabItems = renderTabItems(tabWindow, tabs);
    } else {
        // render empty list of tab items to get -ve margin rollup layout right...
        tabItems = renderTabItems(tabWindow, Immutable.List<TabItem>());
    }

    const windowHeader = (
        <WindowHeader
            appState={appState}
            stateRef={stateRef}
            tabWindow={tabWindow}
            expanded={expanded}
            onExpand={handleExpand}
            onOpen={handleOpen}
            onRevert={handleRevert}
            onClose={handleClose}
            modalActions={modalActions}
            onItemSelected={onItemSelected}
        />
    );

    const selectedStyle = isSelected ? tabWindowSelectedStyle : null;
    const focusedStyle = isFocused ? styles.tabWindowFocused : null;
    const windowStyles = cx(
        styles.tabWindow,
        styles.expandablePanel,
        selectedStyle,
        focusedStyle
    );

    const windowDivProps = {
        className: windowStyles,
        ref: windowDivRef
    };
    return (
        <div {...windowDivProps}>
            {windowHeader}
            {tabItems}
        </div>
    );
};

export default FilteredTabWindowUI;
