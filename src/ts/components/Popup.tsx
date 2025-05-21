import { log } from '../globals';
import * as React from 'react';
import * as actionsClient from '../actionsClient';
import * as searchOps from '../searchOps';
import * as oneref from 'oneref';
import { css } from '@emotion/css';
import RevertModal from './RevertModal';
import SaveModal from './SaveModal';
import { ThemeContext, Theme, themes, ThemeName } from './themeContext';
import { LayoutContext, Layout, layouts, LayoutName } from './LayoutContext';
import * as utils from '../utils';
import debounce from 'lodash/debounce';
import TabManagerState from '../tabManagerState';
import { useState, useCallback, useEffect } from 'react';
import { TabWindow } from '../tabWindow';
import SelectablePopup from './SelectablePopup';
import { FilteredTabWindow } from '../searchOps';
import ModalActions from './modalActions';
import { setRootFontSize } from '../renderUtils';
import UnmanageModal from './UnmanageModal';

const _ = { debounce };

// entire popup window container, including modals:
const popupOuterStyle = (theme: Theme) =>
    css({
        minWidth: 352,
        width: '100%',
        height: '100%',
        // adding this border is useful for debugging styling issues:
        // border: '1px solid #bababa'
        background: theme.background,
        color: theme.foreground,
    });

export interface PopupBaseProps {
    isPopout: boolean;
    noListener: boolean;
}

type PopupProps = PopupBaseProps & oneref.StateRefProps<TabManagerState>;

export const Popup: React.FunctionComponent<PopupProps> = ({
    appState,
    stateRef,
    isPopout,
}: PopupProps) => {
    log.trace('Popup: ', appState.toJS());
    const themeName = appState.preferences.theme as ThemeName;
    const theme = themes[themeName];

    const layoutName = appState.preferences.layout as LayoutName;
    const layout = layouts[layoutName];

    React.useLayoutEffect(() => {
        setRootFontSize(appState.preferences.fontScaleFactor);
    }, [appState.preferences.fontScaleFactor]);

    const tabWindows = appState.getAll();
    var cmpFn = utils.windowCmp(
        appState.preferences.sortOrder,
        appState.currentWindowId,
    );
    const sortedWindows = tabWindows.sort(cmpFn);

    const [prefsModalIsOpen, setPrefsModalIsOpen] = useState(false);
    const [saveModalIsOpen, setSaveModalIsOpen] = useState(false);
    const [saveInitialTitle, setSaveInitialTitle] = useState('');
    const [saveTabWindow, setSaveTabWindow] = useState<TabWindow | null>(null);
    const [revertModalIsOpen, setRevertModalIsOpen] = useState(false);
    const [revertTabWindow, setRevertTabWindow] = useState<TabWindow | null>(
        null,
    );
    const [searchStr, setSearchStr] = useState('');
    const [searchRE, setSearchRE] = useState<RegExp | null>(null);
    const [unmanageModalIsOpen, setUnmanageModalIsOpen] = useState(false);
    const [unmanageTabWindow, setUnmanageTabWindow] =
        useState<TabWindow | null>(null);

    const handleSearchInput = (rawSearchStr: string) => {
        const nextSearchStr = rawSearchStr.trim();

        let nextSearchRE = null;
        if (nextSearchStr.length > 0) {
            nextSearchRE = new RegExp(nextSearchStr, 'i');
        }
        setSearchStr(nextSearchStr);
        setSearchRE(nextSearchRE);
    };

    const filteredWindows = searchOps.filterTabWindows(sortedWindows, searchRE);

    const openSaveModal = useCallback(
        (tabWindow: TabWindow) => {
            const initialTitle = tabWindow.title;
            setSaveModalIsOpen(true);
            setSaveInitialTitle(initialTitle);
            setSaveTabWindow(tabWindow);
        },
        [setSaveModalIsOpen, setSaveInitialTitle, setSaveTabWindow],
    );
    const closeSaveModal = () => {
        setSaveModalIsOpen(false);
    };

    // handler for save modal
    const doSave = (titleStr: string) => {
        actionsClient.manageWindow(saveTabWindow!, titleStr, stateRef);
        closeSaveModal();
    };

    const openRevertModal = useCallback(
        (tabWindow: TabWindow) => {
            setRevertModalIsOpen(true);
            setRevertTabWindow(tabWindow);
        },
        [setRevertModalIsOpen, setRevertTabWindow],
    );

    const closeRevertModal = () => {
        setRevertModalIsOpen(false);
        setRevertTabWindow(null);
    };

    const doRevert = (tabWindow: TabWindow) => {
        actionsClient.revertWindow(revertTabWindow!, stateRef);
        closeRevertModal();
    };

    const openUnmanageModal = useCallback(
        (tabWindow: TabWindow) => {
            setUnmanageModalIsOpen(true);
            setUnmanageTabWindow(tabWindow);
        },
        [setUnmanageModalIsOpen, setUnmanageTabWindow],
    );

    const closeUnmanageModal = () => {
        setUnmanageModalIsOpen(false);
        setUnmanageTabWindow(null);
    };

    const doUnmanage = (tabWindow: TabWindow) => {
        actionsClient.unmanageWindow(unmanageTabWindow!, stateRef);
        closeUnmanageModal();
    };

    const modalActions: ModalActions = React.useMemo(
        () => ({
            openSaveModal,
            openRevertModal,
            openUnmanageModal,
        }),
        [openSaveModal, openRevertModal, openUnmanageModal],
    );

    const revertModal = revertModalIsOpen ? (
        <RevertModal
            tabWindow={revertTabWindow!}
            onClose={closeRevertModal}
            onSubmit={doRevert}
        />
    ) : null;

    const unmanageModal = unmanageModalIsOpen ? (
        <UnmanageModal
            tabWindow={unmanageTabWindow!}
            onClose={closeUnmanageModal}
            onSubmit={doUnmanage}
        />
    ) : null;

    const saveModal = saveModalIsOpen ? (
        <SaveModal
            initialTitle={saveInitialTitle}
            onClose={closeSaveModal}
            onSubmit={doSave}
        />
    ) : null;

    useEffect(() => {
        const searchBoxElem = document.getElementById('searchBox');
        if (searchBoxElem) {
            searchBoxElem.focus();
        }
    }, []);

    return (
        <LayoutContext.Provider value={layout}>
            <ThemeContext.Provider value={theme}>
                <div className={popupOuterStyle(theme)}>
                    <SelectablePopup
                        onSearchInput={handleSearchInput}
                        appState={appState}
                        stateRef={stateRef}
                        filteredWindows={filteredWindows}
                        modalActions={modalActions}
                        searchStr={searchStr}
                        searchRE={searchRE}
                        isPopout={isPopout}
                    />
                    {revertModal}
                    {saveModal}
                    {unmanageModal}
                </div>
            </ThemeContext.Provider>
        </LayoutContext.Provider>
    );
};
