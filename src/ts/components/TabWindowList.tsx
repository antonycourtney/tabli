import * as React from 'react';
import * as oneref from 'oneref';
import FilteredTabWindowUI from './FilteredTabWindowUI';
import WindowListSection from './WindowListSection';
import MessageCard from './MessageCard';

import * as actions from '../actions';

import { isNode } from '../utils';
import TabManagerState from '../tabManagerState';
import ModalActions from './modalActions';
import { FilteredTabWindow } from '../searchOps';
import { StateRef } from 'oneref';
import * as tippy from 'tippy.js';

var relNotesStr = '';
if (!isNode) {
    // in browser
    relNotesStr = require('../../html/relnotes.html');
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
    tippySingleton: (instance: tippy.Instance) => void;
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
    tippySingleton
}) => {
    /* acknowledge release notes (and hide them) */
    const ackRelNotes = () => {
        actions.hideRelNotes(stateRef);
    };

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
                tippySingleton={tippySingleton}
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
        otherOpenSection = (
            <WindowListSection title="Other Open Windows">
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
