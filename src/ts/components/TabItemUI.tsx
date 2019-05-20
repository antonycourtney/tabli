import log from 'loglevel';
import PropTypes from 'prop-types';
import * as oneref from 'oneref';
import * as React from 'react';
import * as styles from './cssStyles';
import { cx, css } from 'emotion';
import * as actions from '../actions';
import { DragItemTypes } from './constants';
import HeaderButton from './HeaderButton';
import HeaderCheckbox from './HeaderCheckbox';
import { ThemeContext } from './themeContext';
import * as tabItemUtil from './tabItemUtil';
import {
    DragSource,
    DragSourceMonitor,
    ConnectDragSource,
    DragSourceConnector,
    DropTarget,
    DropTargetConnector,
    DropTargetMonitor,
    DragElementWrapper,
    DragSourceOptions,
    ConnectDropTarget
} from 'react-dnd';
import TabManagerState from '../tabManagerState';
import { TabWindow, TabItem } from '../tabWindow';
import { useContext } from 'react';
import { StateRef } from 'oneref';

// Note explicit global css class name tabItemHoverContainer
// Due to limitation of nested class selectors with composition;
// see https://emotion.sh/docs/nested for more info.
const tabItemHoverVisible = css`
    visibility: hidden;
    .tabItemHoverContainer:hover & {
        visibility: visible;
    }
`;

const audibleIconStyle = cx(styles.headerButton, styles.audibleIcon);

export interface TabItemUIProps {
    tabWindow: TabWindow;
    tab: TabItem;
    tabIndex: number;
    isSelected: boolean;
    onItemSelected: (item: TabItem) => void;

    // "collected" props -- we define these as optional because there seems to be an issue
    // with the TypeScript bindings; these should probably not be exposed outside
    // the wrapper that injects them.
    // See https://stackoverflow.com/questions/40111314/react-dnd-typescript-support for a
    // mention of this
    connectDragSource?: ConnectDragSource;
    connectDropTarget?: ConnectDropTarget;
    isDragging?: boolean;
    isOver?: boolean;
    stateRef: StateRef<TabManagerState>;
}

const tabItemSource = {
    beginDrag(props: TabItemUIProps) {
        return { sourceTabWindow: props.tabWindow, sourceTab: props.tab };
    }
};

// collect for use as drag source:
function collect(connect: DragSourceConnector, monitor: DragSourceMonitor) {
    return {
        connectDragSource: connect.dragSource(),
        isDragging: monitor.isDragging()
    };
}

// for use as drop target:
const tabItemTarget = {
    drop(props: TabItemUIProps, monitor: DropTargetMonitor) {
        const sourceItem = monitor.getItem();
        actions.moveTabItem(
            props.tabWindow,
            props.tabIndex + 1,
            sourceItem.sourceTab,
            props.stateRef
        );
    }
};

// collect function for drop target:
function collectDropTarget(
    connect: DropTargetConnector,
    monitor: DropTargetMonitor
) {
    return {
        connectDropTarget: connect.dropTarget(),
        isOver: monitor.isOver()
    };
}

const TabItemUI: React.FunctionComponent<TabItemUIProps> = ({
    connectDragSource,
    connectDropTarget,
    isDragging,
    tabWindow,
    tab,
    tabIndex,
    isSelected,
    isOver,
    onItemSelected,
    stateRef
}: TabItemUIProps) => {
    const theme = useContext(ThemeContext);

    const handleClick = (event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();

        // log.debug("TabItem: handleClick: tab: ", tab)

        actions.activateTab(tabWindow, tab, tabIndex, stateRef);

        if (onItemSelected) {
            onItemSelected(tab);
        }
    };

    const handleClose = () => {
        if (!tabWindow.open) {
            return;
        }
        if (!tab.open) {
            return;
        }
        var tabId = tab.openState!.openTabId;
        actions.closeTab(tabWindow, tabId, stateRef);
    };

    const handleBookmarkTabItem = (event: React.MouseEvent) => {
        event.stopPropagation();
        log.debug('bookmark tab: ', tab.toJS());
        actions.saveTab(tabWindow, tab, stateRef);
    };

    const handleUnbookmarkTabItem = (event: React.MouseEvent) => {
        event.stopPropagation();
        log.debug('unbookmark tab: ', tab.toJS());
        actions.unsaveTab(tabWindow, tab, stateRef);
    };

    const managed = tabWindow.saved;

    const tabTitle = tab.title;

    const tooltipContent = tabTitle + '\n' + tab.url;

    // span style depending on whether open or closed window
    let tabOpenStateStyle: string | null = null;

    let tabCheckItem: JSX.Element;

    if (managed) {
        const tabTitleClosedHover = css({
            '&:hover': {
                color: theme.closedGray
            }
        });
        const tabTitleClosed = cx(styles.closed(theme), tabTitleClosedHover);

        if (!tab.open) {
            tabOpenStateStyle = tabTitleClosed;
        }
        const checkTitle = tab.saved
            ? 'Remove bookmark for this tab'
            : 'Bookmark this tab';
        const checkOnClick = tab.saved
            ? handleUnbookmarkTabItem
            : handleBookmarkTabItem;

        tabCheckItem = (
            <HeaderCheckbox
                extraUncheckedStyle={tabItemHoverVisible}
                title={checkTitle}
                open={tab.open}
                onClick={checkOnClick}
                value={tab.saved}
            />
        );
    } else {
        // insert a spacer:
        tabCheckItem = <div className={styles.headerButton} />;
    }

    const tabFavIcon = tabItemUtil.mkFavIcon(tab);
    var tabActiveStyle =
        tab.open && tab.openState!.active ? styles.activeSpan : null;
    var tabTitleStyle = cx(
        styles.text,
        styles.tabTitle,
        styles.noWrap,
        tabOpenStateStyle,
        tabActiveStyle
    );
    var selectedStyle = isSelected ? styles.tabItemSelected(theme) : null;

    var dropStyle = isOver ? styles.tabItemDropOver : null;

    const suspendedIcon =
        tab.open && tab.openState!.isSuspended ? (
            <div className={styles.headerButton}>💤</div>
        ) : null;
    const audibleIcon =
        tab.open && tab.openState!.audible ? (
            <div className={audibleIconStyle} />
        ) : null;

    const tabItemCloseButtonStyle = cx(
        styles.headerButton,
        tabItemHoverVisible,
        styles.closeButtonBaseStyle(theme)
    );

    const closeButton = (
        <HeaderButton
            className={tabItemCloseButtonStyle}
            visible={tab.open}
            title="Close Window"
            onClick={handleClose}
        />
    );

    // Note explicit global css class name tabItemHoverContainer here
    // Due to limitation of nested class selectors with composition;
    // see https://emotion.sh/docs/nested for more info.

    const tabItemStyle = cx(
        styles.noWrap,
        styles.tabItem,
        selectedStyle,
        dropStyle
    );

    return connectDropTarget!(
        connectDragSource!(
            <div
                className={tabItemStyle + ' tabItemHoverContainer'}
                onClick={handleClick}
            >
                <div className={styles.rowItemsFixedWidth}>
                    {tabCheckItem}
                    {tabFavIcon}
                </div>
                <a
                    href={tab.url}
                    className={tabTitleStyle}
                    title={tooltipContent}
                    onClick={handleClick}
                >
                    {tabTitle}
                </a>
                <div className={styles.rowItemsFixedWidth}>
                    {suspendedIcon}
                    {audibleIcon}
                    {closeButton}
                </div>
            </div>
        )
    );
};

const DropWrap = DropTarget(
    DragItemTypes.TAB_ITEM,
    tabItemTarget,
    collectDropTarget
);
const DragWrap = DragSource(DragItemTypes.TAB_ITEM, tabItemSource, collect);

const WrappedTabItemUI = DropWrap(DragWrap(TabItemUI));
const MemoWrappedTabItemUI = React.memo(WrappedTabItemUI);
export default MemoWrappedTabItemUI;
