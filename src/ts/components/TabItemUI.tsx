import { log } from '../globals';
import PropTypes from 'prop-types';
import * as oneref from 'oneref';
import * as React from 'react';
import * as styles from './cssStyles';
import { cx, css } from '@emotion/css';
import * as actions from '../actions';
import * as actionsClient from '../actionsClient';
import { DragItemTypes } from './constants';
import { HeaderButton } from './HeaderButton';
import HeaderCheckbox from './HeaderCheckbox';
import { ThemeContext } from './themeContext';
import * as tabItemUtil from './tabItemUtil';
import {
    Draggable,
    DraggableProvided,
    DraggableStateSnapshot,
} from '@hello-pangea/dnd';
import TabManagerState from '../tabManagerState';
import { TabWindow, TabItem } from '../tabWindow';
import { useContext, useState } from 'react';
import { StateRef, mutableGet } from 'oneref';
import { areEqualShallow, windowIsPopout } from '../utils';
import { HeaderButtonSVG } from './HeaderButtonSVG';
import * as svg from './svg';
import { LayoutContext } from './LayoutContext';
import { Tooltip } from '@radix-ui/react-tooltip';
import { TabTooltip } from './ui/TabTooltip';
import { TabPreview } from './TabPreview';
import ExpanderButton from './ExpanderButton';

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

const getDragContainerStyle = (
    isDragging: boolean,
    draggableStyle: any,
    snapshot: any,
) => {
    return {
        // styles we need to apply on draggables
        ...draggableStyle,
        cursor: snapshot.isDragging ? 'grabbing' : 'pointer',
    };
};

export interface TabItemUIProps {
    tabWindow: TabWindow;
    tab: TabItem;
    tabIndex: number;
    isSelected: boolean;
    onItemSelected: (item: TabItem) => void;

    isOver?: boolean;
    stateRef: StateRef<TabManagerState>;
}

const TabItemUI: React.FunctionComponent<TabItemUIProps> = ({
    tabWindow,
    tab,
    tabIndex,
    isSelected,
    isOver,
    onItemSelected,
    stateRef,
}: TabItemUIProps) => {
    // log.debug('  --TabItemUI: rendering: ', tab.title);
    const theme = useContext(ThemeContext);
    const layout = useContext(LayoutContext);

    // State for preview expand/collapse
    const [isPreviewExpanded, setIsPreviewExpanded] = useState<boolean>(false);

    const handlePreviewToggle = (expanded: boolean) => {
        setIsPreviewExpanded(expanded);
    };

    const handleClick = async (event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();

        // log.debug("TabItem: handleClick: tab: ", tab)

        await actionsClient.activateOrRestoreTab(
            tabWindow,
            tab,
            tabIndex,
            stateRef,
        );

        if (onItemSelected) {
            await onItemSelected(tab);
        }
        if (!windowIsPopout()) {
            window.close();
        }
    };

    const handleMuteToggle = () => {
        if (!tabWindow.open) {
            return;
        }
        if (!tab.open) {
            return;
        }
        const openState = tab.openState!;
        const mute = !openState.muted;
        actions.tabSetMute(tabWindow, openState.openTabId, mute, stateRef);
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
        actionsClient.saveTab(tabWindow, tab, stateRef);
    };

    const handleUnbookmarkTabItem = (event: React.MouseEvent) => {
        event.stopPropagation();
        log.debug('unbookmark tab: ', tab.toJS());
        actionsClient.unsaveTab(tabWindow, tab, stateRef);
    };

    const managed = tabWindow.saved;

    const tabTitle = tab.title;

    // Get last active timestamp if available
    const lastActive =
        tab.open && tab.openState!.lastActive
            ? tab.openState!.lastActive
            : null;

    // span style depending on whether open or closed window
    let tabOpenStateStyle: string | null = null;

    let tabCheckItem: JSX.Element;

    if (managed) {
        const tabTitleClosedHover = css({
            '&:hover': {
                color: theme.closedGray,
            },
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

    // Create preview expand/collapse button (only visible on hover)
    // N.B.: Was in a div with className={tabItemHoverVisible} but that was too hidden/undiscoverable
    const previewButton = (
        <ExpanderButton
            expanded={isPreviewExpanded}
            onClick={handlePreviewToggle}
        />
    );

    const tabActiveTextStyle =
        tab.open && tab.openState!.active ? styles.activeSpan : null;

    const tabTitleStyle = cx(
        styles.text,
        styles.tabTitle,
        styles.noWrap,
        tabOpenStateStyle,
        tabActiveTextStyle,
    );

    const selectedStyle = isSelected ? styles.tabItemSelected(theme) : null;
    const dropStyle = isOver ? styles.tabItemDropOver : null;

    const activeStyle =
        tab.open && tab.openState!.active ? styles.tabItemActive(theme) : null;

    // Note explicit global css class name tabItemHoverContainer here
    // Due to limitation of nested class selectors with composition;
    // see https://emotion.sh/docs/nested for more info.
    const getTabItemStyle = (isDragging: boolean): string => {
        const dragStyle = isDragging
            ? styles.tabItemDragging(theme)
            : styles.tabItemNotDragging;
        const tabItemStyle = cx(
            styles.noWrap,
            styles.tabItem(theme, layout),
            activeStyle,
            selectedStyle,
            dropStyle,
            dragStyle,
        );
        return tabItemStyle;
    };

    const suspendedIcon =
        tab.open && tab.openState!.isSuspended ? (
            <div className={styles.headerButton}>💤</div>
        ) : null;

    let audibleIcon: JSX.Element | null = null;
    if (tab.open) {
        const openState = tab.openState!;
        if (openState.audible || openState.muted) {
            const svgElem = openState.muted ? svg.silent : svg.sound;
            const title = openState.muted ? 'Unmute Tab' : 'Mute Tab';
            audibleIcon = (
                <HeaderButtonSVG
                    svgElem={svgElem}
                    visible={true}
                    title={title}
                    onClick={handleMuteToggle}
                />
            );
        }
    }

    const tabItemCloseButtonStyle = cx(
        styles.headerButton,
        tabItemHoverVisible,
        styles.closeButtonBaseStyle(theme),
    );

    const closeButton = (
        <HeaderButtonSVG
            className={tabItemHoverVisible}
            svgElem={svg.closeIcon}
            visible={tab.open}
            title="Close Tab"
            onClick={handleClose}
        />
    );

    const draggableId = tab.key;

    const tabLink = (
        <a href={tab.url} className={tabTitleStyle} onClick={handleClick}>
            {tabTitle}
        </a>
    );
    const useTooltip = false;
    const tabTitleElement = useTooltip ? (
        <TabTooltip
            title={tabTitle}
            url={tab.url}
            lastActive={lastActive}
            side="bottom"
            align="center"
        >
            {tabLink}
        </TabTooltip>
    ) : (
        tabLink
    );

    return (
        <Draggable draggableId={draggableId} key={draggableId} index={tabIndex}>
            {(
                dragProvided: DraggableProvided,
                dragSnapshot: DraggableStateSnapshot,
            ) => {
                const draggableStyle = dragProvided.draggableProps.style;
                log.debug('TabItemUI: draggableStyle: ', draggableStyle);
                // console.log({ dragProvided, dragSnapshot });
                // for debugging: const blueBorder = css({ border: '1px solid #0000ff' });
                return (
                    <div
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        {...dragProvided.dragHandleProps}
                        style={getDragContainerStyle(
                            dragSnapshot.isDragging,
                            dragProvided.draggableProps.style,
                            dragSnapshot,
                        )}
                    >
                        <div
                            className={
                                getTabItemStyle(dragSnapshot.isDragging) +
                                ' tabItemHoverContainer'
                            }
                            data-testid="tabItem-container"
                            onClick={handleClick}
                        >
                            <div className={styles.rowItemsFixedWidth}>
                                {tabCheckItem}
                                {previewButton}
                                {tabFavIcon}
                            </div>
                            {tabTitleElement}
                            <div className={styles.rowItemsFixedWidth}>
                                {suspendedIcon}
                                {audibleIcon}
                                {closeButton}
                            </div>
                        </div>
                        <TabPreview
                            url={tab.url}
                            title={tabTitle}
                            lastActive={lastActive}
                            isVisible={isPreviewExpanded}
                        />
                    </div>
                );
            }}
        </Draggable>
    );
};

/*
 * N.B. We briefly attempted to wrap this in React.memo.
 * Doesn't work out of the box because the tabWindow property
 * is always different between oldProps and newProps because
 * we've already done the functional update.
 * Could fix with custom arePropsEqual function, but really
 * not so essential since we already memoize at the level of
 * FilteredTabWindowUI.
 */
export default TabItemUI;
