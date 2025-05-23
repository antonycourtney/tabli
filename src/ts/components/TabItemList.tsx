import * as React from 'react';
import { StateRef } from 'oneref';
import { cx, css } from '@emotion/css';
import * as styles from './cssStyles';
import TabItemUI from './TabItemUI';
import { TabWindow, TabItem } from '../tabWindow';
import TabManagerState from '../tabManagerState';
import { useContext } from 'react';
import { LayoutContext } from './LayoutContext';

const expandablePanelContentOpenStyle = css({
    marginTop: 4,
});
const expandablePanelContentClosedStyle = css({
    marginTop: '-999px',
});

interface TabItemListProps {
    stateRef: StateRef<TabManagerState>;
    tabWindow: TabWindow;
    tabs: TabItem[];
    selectedTabIndex: number;
    expanded: boolean;
    onItemSelected: () => void;
}

const TabItemList: React.FunctionComponent<TabItemListProps> = ({
    stateRef,
    tabWindow,
    tabs,
    selectedTabIndex,
    expanded,
    onItemSelected,
}: TabItemListProps) => {
    const items = [];
    
    for (let i = 0; i < tabs.length; i++) {
        const tab = tabs[i];
        const isSelected = i === selectedTabIndex;
        /*
        log.debug(
            '  TabItemList: renderTabItems: ',
            tab.title,
            tab,
        );
        */
        const tabItem = (
            <TabItemUI
                stateRef={stateRef}
                tabWindow={tabWindow}
                tab={tab}
                key={tab.key}
                tabIndex={i}
                isSelected={isSelected}
                onItemSelected={onItemSelected}
            />
        );
        items.push(tabItem);
    }

    const expandableContentStyle = expanded
        ? expandablePanelContentOpenStyle
        : expandablePanelContentClosedStyle;
    const tabListStyle = cx(styles.tabList, expandableContentStyle);
    
    return <div className={tabListStyle}>{items}</div>;
};

export default React.memo(TabItemList);