import log from 'loglevel';
import * as React from 'react';
import * as actions from '../actions';
import * as searchOps from '../searchOps';
import * as oneref from 'oneref';
import { css } from 'emotion';
import RevertModal from './RevertModal';
import SaveModal from './SaveModal';
import { ThemeContext, Theme, themes, ThemeName } from './themeContext';
import * as utils from '../utils';
import debounce from 'lodash/debounce';
import TabManagerState from '../tabManagerState';
import { useState, useCallback } from 'react';
import { TabWindow } from '../tabWindow';
import SelectablePopup from './SelectablePopup';
import { FilteredTabWindow } from '../searchOps';
import ModalActions from './modalActions';

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
        color: theme.foreground
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
    noListener
}: PopupProps) => {
    log.trace('Popup: ', appState.toJS());
    const themeName = appState.preferences.theme as ThemeName;
    const theme = themes[themeName];

    const tabWindows = appState.getAll();
    var cmpFn = utils.windowCmp(appState.currentWindowId);
    const sortedWindows = tabWindows.sort(cmpFn);

    const [prefsModalIsOpen, setPrefsModalIsOpen] = useState(false);
    const [saveModalIsOpen, setSaveModalIsOpen] = useState(false);
    const [saveInitialTitle, setSaveInitialTitle] = useState('');
    const [saveTabWindow, setSaveTabWindow] = useState<TabWindow | null>(null);
    const [revertModalIsOpen, setRevertModalIsOpen] = useState(false);
    const [revertTabWindow, setRevertTabWindow] = useState<TabWindow | null>(
        null
    );
    const [searchStr, setSearchStr] = useState('');
    const [searchRE, setSearchRE] = useState<RegExp | null>(null);

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
        [setSaveModalIsOpen, setSaveInitialTitle, setSaveTabWindow]
    );
    const closeSaveModal = () => {
        setSaveModalIsOpen(false);
    };

    // handler for save modal
    const doSave = (titleStr: string) => {
        actions.manageWindow(saveTabWindow!, titleStr, stateRef);
        closeSaveModal();
    };

    const openRevertModal = useCallback(
        (tabWindow: TabWindow) => {
            setRevertModalIsOpen(true);
            setRevertTabWindow(tabWindow);
        },
        [setRevertModalIsOpen, setRevertTabWindow]
    );

    const closeRevertModal = () => {
        setRevertModalIsOpen(false);
        setRevertTabWindow(null);
    };

    const doRevert = (tabWindow: TabWindow) => {
        actions.revertWindow(revertTabWindow!, stateRef);
        closeRevertModal();
    };

    const modalActions: ModalActions = React.useMemo(
        () => ({
            openSaveModal,
            openRevertModal
        }),
        [openSaveModal, openRevertModal]
    );

    const revertModal = revertModalIsOpen ? (
        <RevertModal
            tabWindow={revertTabWindow!}
            onClose={closeRevertModal}
            onSubmit={doRevert}
        />
    ) : null;

    const saveModal = saveModalIsOpen ? (
        <SaveModal
            initialTitle={saveInitialTitle}
            onClose={closeSaveModal}
            onSubmit={doSave}
        />
    ) : null;

    return (
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
            </div>
        </ThemeContext.Provider>
    );
};
