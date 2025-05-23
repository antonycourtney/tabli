import * as React from 'react';
import * as oneref from 'oneref';
import { log } from '../globals'; // eslint-disable-line no-unused-vars
import FilteredTabWindowUI from './FilteredTabWindowUI';
import WindowListSection from './WindowListSection';
import MessageCard from './MessageCard';
import * as actionsClient from '../actionsClient';
import { isNode } from '../utils';
import TabManagerState from '../tabManagerState';
import ModalActions from './modalActions';
import { FilteredTabWindow } from '../searchOps';
import { StateRef } from 'oneref';
import { TabWindow } from '../tabWindow';
import SortOrderSelect from './SortOrderSelect';

let relNotesModule: any = null;
if (!isNode) {
    // in browser
    relNotesModule = require('../../html/relnotes.html');
}

function checkKeys(filteredWindows: FilteredTabWindow[]) {
    // check for duplicate keys
    var keyMap = new Map<string, TabWindow>();
    for (var i = 0; i < filteredWindows.length; i++) {
        var filteredTabWindow = filteredWindows[i];
        var tabWindow = filteredTabWindow.tabWindow;
        var key = tabWindow.key;
        if (keyMap.has(key)) {
            log.error('Duplicate key: ', key);
            log.error('First window: ', keyMap.get(key));
            log.error('Second window: ', tabWindow);
        }
        keyMap.set(key, tabWindow);
    }
}

interface TabWindowListProps {
    filteredWindows: FilteredTabWindow[];
    selectedWindowIndex: number;
    selectedTabIndex: number;
    searchStr: string | null;
    searchRE: RegExp | null;
    modalActions: ModalActions;
    focusedTabWindowRef?: React.MutableRefObject<HTMLDivElement | null>;
    onItemSelected: () => void;
    stateRef: StateRef<TabManagerState>;
    expandAll: boolean;
    showRelNotes: boolean;
    currentWindowId: number;
    sortOrder: 'alpha' | 'recent';
}

const TabWindowList: React.FC<TabWindowListProps> = ({
    stateRef,
    filteredWindows,
    selectedWindowIndex,
    selectedTabIndex,
    searchStr,
    searchRE,
    modalActions,
    onItemSelected,
    focusedTabWindowRef,
    expandAll,
    showRelNotes,
    currentWindowId,
    sortOrder,
}) => {
    /* acknowledge release notes (and hide them) */
    const ackRelNotes = () => {
        actionsClient.hideRelNotes(stateRef);
    };

    const relNotesStr = relNotesModule ? relNotesModule.default : '';
    log.debug('TabWindowList: showRelNotes: ', showRelNotes);
    var relNotesSection = null;
    if (showRelNotes) {
        relNotesSection = (
            <WindowListSection>
                <MessageCard content={relNotesStr} onClick={ackRelNotes} />
            </WindowListSection>
        );
    }

    var focusedWindowElem: JSX.Element[] = [];
    var openWindows: JSX.Element[] = [];
    var savedWindows: JSX.Element[] = [];

    checkKeys(filteredWindows);

    for (var i = 0; i < filteredWindows.length; i++) {
        var filteredTabWindow = filteredWindows[i];
        var tabWindow = filteredTabWindow.tabWindow;

        var key = tabWindow.key;
        var isOpen = tabWindow.open;
        const isFocused = isOpen && currentWindowId === tabWindow.openWindowId;

        // focused property will only be true if isFocused and no rel notes to display:
        const focusedProp = !showRelNotes && isFocused;

        var isSelected = i === selectedWindowIndex;
        const trueSelectedTabIndex = isSelected ? selectedTabIndex : -1;

        const itemMatches =
            searchStr === null || searchStr.length === 0
                ? null
                : filteredTabWindow.itemMatches;

        var windowElem = (
            <FilteredTabWindowUI
                stateRef={stateRef}
                tabWindow={tabWindow}
                itemMatches={itemMatches}
                key={key}
                isSelected={isSelected}
                isFocused={focusedProp}
                selectedTabIndex={trueSelectedTabIndex}
                modalActions={modalActions}
                onItemSelected={onItemSelected}
                expandAll={expandAll}
            />
        );
        if (isFocused) {
            focusedWindowElem = [windowElem];
        } else if (isOpen) {
            openWindows.push(windowElem);
        } else {
            savedWindows.push(windowElem);
        }
    }

    var otherOpenSection = null;
    if (openWindows.length > 0) {
        const sortOrderSelect = (
            <SortOrderSelect stateRef={stateRef} sortOrder={sortOrder} />
        );
        otherOpenSection = (
            <WindowListSection
                title="Other Open Windows"
                extraElements={sortOrderSelect}
            >
                {openWindows}
            </WindowListSection>
        );
    }

    var savedSection = null;
    if (savedWindows.length > 0) {
        savedSection = (
            <WindowListSection title="Saved Closed Windows">
                {savedWindows}
            </WindowListSection>
        );
    }

    return (
        <div>
            {relNotesSection}
            <WindowListSection
                focusedRef={focusedTabWindowRef}
                title="Current Window"
            >
                {focusedWindowElem}
            </WindowListSection>
            {otherOpenSection}
            {savedSection}
        </div>
    );
};

export default TabWindowList;
