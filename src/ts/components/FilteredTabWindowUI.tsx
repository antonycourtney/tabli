import { log } from '../globals'; // eslint-disable-line no-unused-consts
import * as React from 'react';
import { StateRef } from 'oneref';
import { cx, css } from '@emotion/css';
import * as styles from './cssStyles';
import * as actions from '../actions';
import * as actionsClient from '../actionsClient';
import * as Constants from './constants';
import WindowHeader from './WindowHeader';
import TabItemList from './TabItemList';
import { TabWindow, TabItem } from '../tabWindow';
import { FilteredTabItem } from '../searchOps';
import TabManagerState from '../tabManagerState';
import { useState, useRef, useContext } from 'react';
import { FilteredTabWindow } from '../searchOps';
import ModalActions from './modalActions';
import { areEqualShallow, windowIsPopout } from '../utils';
import {
    Droppable,
    DroppableProvided,
    DroppableStateSnapshot,
} from '@hello-pangea/dnd';
import { Theme, ThemeContext } from './themeContext';
import { LayoutContext } from './LayoutContext';

const tabWindowSelectedStyle = (theme: Theme) =>
    css({
        border: '2px solid ' + theme.windowSelectedBorder,
    });

const getListStyle = (isDraggingOver: boolean) =>
    css({
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
    });

export interface FilteredTabWindowUIBaseProps {
    tabWindow: TabWindow;
    itemMatches: FilteredTabItem[] | null;
    isSelected: boolean;
    isFocused: boolean;
    modalActions: ModalActions;
    selectedTabIndex: number;
    onItemSelected: () => void; // N.B. just clears selection; tab or window selected both trigger this
    expandAll: boolean;
}

// factored out to allow wrapping in a local
// appContainer for testing with StoryBook:
export interface FilteredTabWindowStateRefProps {
    stateRef: StateRef<TabManagerState>;
}

export type FilteredTabWindowUIProps = FilteredTabWindowUIBaseProps &
    FilteredTabWindowStateRefProps;

const FilteredTabWindowUI: React.FunctionComponent<
    FilteredTabWindowUIProps
> = ({
    tabWindow,
    itemMatches,
    isSelected,
    isFocused,
    stateRef,
    onItemSelected,
    selectedTabIndex,
    modalActions,
    expandAll,
}: FilteredTabWindowUIProps) => {
    const layout = useContext(LayoutContext);

    /*
    log.trace(
        '  FilteredTabWindowUI: rendering ',
        tabWindow.key,
        tabWindow.title,
    );
    */
    const theme = useContext(ThemeContext);
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

    const handleOpen = async () => {
        await actionsClient.openWindow(tabWindow, stateRef);
        if (onItemSelected) {
            onItemSelected();
        }
        if (!windowIsPopout()) {
            window.close();
        }
    };

    const handleClose = () => {
        // eslint-disable-line no-unused-consts
        // log.log("handleClose")
        actionsClient.closeWindow(tabWindow, stateRef);
    };

    const handleRevert = () => {
        log.debug('FilteredTabWindowUI: handleRevert: ', modalActions);
        modalActions.openRevertModal(tabWindow);
    };

    /* expanded state follows window open/closed state unless it is
     * explicitly set interactively by the user
     */
    const getExpandedState = () => {
        return tabWindow.isExpanded(expandAll);
    };


    const handleExpand = (expand: boolean) => {
        actionsClient.expandWindow(tabWindow, expand, stateRef);
    };

    let tabs;
    if (itemMatches === null) {
        tabs = tabWindow.tabItems;
    } else {
        tabs = itemMatches.map((fti) => fti.tabItem);
    }

    /*
     * optimization:  Let's only render tabItems if expanded
     */
    const expanded = getExpandedState();
    const tabItemsToRender = expanded ? tabs : [];
    
    const tabItems = (
        <TabItemList
            stateRef={stateRef}
            tabWindow={tabWindow}
            tabs={tabItemsToRender}
            selectedTabIndex={selectedTabIndex}
            expanded={expanded}
            onItemSelected={onItemSelected}
        />
    );

    // log.debug('FilteredTabWindowUI: rendering: ', tabWindow.title, tabWindow);

    const windowHeader = (
        <WindowHeader
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

    const selectedStyle = isSelected ? tabWindowSelectedStyle(theme) : null;
    const focusedStyle = isFocused ? styles.tabWindowFocused(theme) : null;
    const windowStyles = cx(
        styles.tabWindow(theme),
        styles.expandablePanel(layout),
        selectedStyle,
        focusedStyle,
    );

    const windowDivProps = {
        className: windowStyles,
        ref: windowDivRef,
    };

    /* N.B.: On inner div, may want to set class name / styling with:
        className={getListStyle(snapshot.isDraggingOver)}
    */
    const droppableId = tabWindow.key;
    return (
        <div {...windowDivProps}>
            <Droppable droppableId={droppableId}>
                {(
                    provided: DroppableProvided,
                    snapshot: DroppableStateSnapshot,
                ) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={getListStyle(snapshot.isDraggingOver)}
                    >
                        {windowHeader}
                        {tabItems}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </div>
    );
};

export default React.memo(FilteredTabWindowUI);
