import * as React from 'react';
import { StateRef } from 'oneref';
import { cx, css } from '@emotion/css';
import * as styles from './cssStyles';
import TabItemUI from './TabItemUI';
import { TabWindow, TabItem } from '../tabWindow';
import TabManagerState from '../tabManagerState';
import { useState, useCallback, useRef, useEffect } from 'react';

const expandablePanelContentOpenStyle = css({
    marginTop: 4,
});
const expandablePanelContentClosedStyle = css({
    marginTop: '-999px',
});

// Fisheye effect styles
const fisheyeContainerStyle = css({
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
});

const fisheyeItemWrapperStyle = css({
    position: 'relative',
    transition: 'all 0.15s cubic-bezier(0.23, 1, 0.32, 1)',
    transformOrigin: 'left center',
    marginBottom: '2px',
    
    '&.fisheye-active': {
        transform: 'scale(1.15)',
        zIndex: 10,
        marginBottom: '4px',
        marginTop: '4px',
    },
    
    '&.fisheye-adjacent-1': {
        transform: 'scale(1.08)',
        zIndex: 5,
        marginBottom: '3px',
        marginTop: '2px',
    },
    
    '&.fisheye-adjacent-2': {
        transform: 'scale(1.03)',
        marginBottom: '2px',
        marginTop: '1px',
    },
    
    '&.fisheye-distant': {
        transform: 'scale(0.98)',
        marginBottom: '1px',
    },
});

interface FisheyeTabItemListProps {
    stateRef: StateRef<TabManagerState>;
    tabWindow: TabWindow;
    tabs: TabItem[];
    selectedTabIndex: number;
    expanded: boolean;
    onItemSelected: () => void;
}

const FisheyeTabItemList: React.FunctionComponent<FisheyeTabItemListProps> = ({
    stateRef,
    tabWindow,
    tabs,
    selectedTabIndex,
    expanded,
    onItemSelected,
}: FisheyeTabItemListProps) => {
    const [currentActiveIndex, setCurrentActiveIndex] = useState<number>(-1);
    const [isMouseInList, setIsMouseInList] = useState<boolean>(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const updateTimerRef = useRef<number | null>(null);
    
    const clearAllEffects = useCallback(() => {
        setCurrentActiveIndex(-1);
    }, []);
    
    const applyFisheyeEffect = useCallback((activeIndex: number) => {
        setCurrentActiveIndex(activeIndex);
    }, []);
    
    const updateFisheyeEffect = useCallback((e: React.MouseEvent) => {
        if (!containerRef.current) return;
        
        const containerRect = containerRef.current.getBoundingClientRect();
        const mouseY = e.clientY - containerRect.top;
        
        let closestIndex = -1;
        let minDistance = Infinity;
        
        // Find the closest item to the mouse
        const itemElements = containerRef.current.children;
        Array.from(itemElements).forEach((item, index) => {
            if (index >= tabs.length) return; // Skip any extra elements
            
            const itemRect = item.getBoundingClientRect();
            const itemY = itemRect.top - containerRect.top;
            const itemCenter = itemY + (itemRect.height / 2);
            const distance = Math.abs(mouseY - itemCenter);
            
            if (distance < minDistance) {
                minDistance = distance;
                closestIndex = index;
            }
        });
        
        // Use a threshold to prevent micro-movements from triggering changes
        const threshold = 8; // pixels
        if (closestIndex !== currentActiveIndex && closestIndex >= 0 && minDistance < threshold * 3) {
            applyFisheyeEffect(closestIndex);
        }
    }, [tabs.length, currentActiveIndex, applyFisheyeEffect]);
    
    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (updateTimerRef.current) {
            clearTimeout(updateTimerRef.current);
        }
        
        updateTimerRef.current = window.setTimeout(() => {
            updateFisheyeEffect(e);
        }, 5); // Fast updates for smooth movement
    }, [updateFisheyeEffect]);
    
    const handleMouseEnter = useCallback(() => {
        setIsMouseInList(true);
    }, []);
    
    const handleMouseLeave = useCallback(() => {
        setIsMouseInList(false);
        clearAllEffects();
    }, [clearAllEffects]);
    
    // Clean up timer on unmount
    useEffect(() => {
        return () => {
            if (updateTimerRef.current) {
                clearTimeout(updateTimerRef.current);
            }
        };
    }, []);
    
    // Create items with fisheye effect wrappers
    const items = [];
    for (let i = 0; i < tabs.length; i++) {
        const tab = tabs[i];
        const isSelected = i === selectedTabIndex;
        
        // Determine fisheye class based on distance from active item
        let fisheyeClass = '';
        if (isMouseInList && currentActiveIndex >= 0) {
            const distance = Math.abs(i - currentActiveIndex);
            if (distance === 0) {
                fisheyeClass = 'fisheye-active';
            } else if (distance === 1) {
                fisheyeClass = 'fisheye-adjacent-1';
            } else if (distance === 2) {
                fisheyeClass = 'fisheye-adjacent-2';
            } else {
                fisheyeClass = 'fisheye-distant';
            }
        }
        
        const tabItem = (
            <div
                key={tab.key}
                className={cx(fisheyeItemWrapperStyle, fisheyeClass)}
            >
                <TabItemUI
                    stateRef={stateRef}
                    tabWindow={tabWindow}
                    tab={tab}
                    tabIndex={i}
                    isSelected={isSelected}
                    onItemSelected={onItemSelected}
                />
            </div>
        );
        items.push(tabItem);
    }

    const expandableContentStyle = expanded
        ? expandablePanelContentOpenStyle
        : expandablePanelContentClosedStyle;
    const tabListStyle = cx(styles.tabList, expandableContentStyle);
    
    return (
        <div 
            className={cx(tabListStyle, fisheyeContainerStyle)}
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {items}
        </div>
    );
};

export default React.memo(FisheyeTabItemList);