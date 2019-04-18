import log from 'loglevel';
import * as React from 'react';
import * as actions from '../actions';
import * as searchOps from '../searchOps';
import * as oneref from 'oneref';
import { css } from 'emotion';
import RevertModal from './RevertModal';
/*
import PreferencesModal from './PreferencesModal'
import SaveModal from './SaveModal'
import SelectablePopup from './SelectablePopup'
*/
import { ThemeContext, Theme, themes, ThemeName } from './themeContext';
import * as utils from '../utils';
import { DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import debounce from 'lodash/debounce';
import TabManagerState from '../tabManagerState';
import { useState } from 'react';
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

/**
 * send message to BGhelper
 */
function sendHelperMessage(msg: any) {
    var port = chrome.runtime.connect({ name: 'popup' });
    port.postMessage(msg);
    port.onMessage.addListener((response: any) => {
        log.debug('Got response message: ', response);
    });
}

export interface PopupBaseProps {
    isPopout: boolean;
    noListener: boolean;
}

type PopupProps = PopupBaseProps & oneref.StateRefProps<TabManagerState>;

/* class Popup extends React.Component {
    constructor(props, context) {
        super(props, context);
        var st: Object = this.storeAsState(props.initialWinStore, true);

        st.prefsModalIsOpen = false;
        st.saveModalIsOpen = false;
        st.revertModalIsOpen = false;
        st.revertTabWindow = null;
        st.searchStr = '';
        st.searchRE = null;
        st.theme = themes.light;
        log.debug('Popup ctor: theme: ', themes.light, st.theme);
        this.state = st;
    }

    storeAsState = winStore => {
        var tabWindows = winStore.getAll();
        var cmpFn = utils.windowCmp(winStore.currentWindowId);
        var sortedWindows = tabWindows.sort(cmpFn);

        return {
            winStore,
            sortedWindows
        };
    };

    handleSearchInput = rawSearchStr => {
        const searchStr = rawSearchStr.trim();

        var searchRE = null;
        if (searchStr.length > 0) {
            searchRE = new RegExp(searchStr, 'i');
        }

        this.setState({ searchStr, searchRE });
    };

    openSaveModal = tabWindow => {
        const initialTitle = tabWindow.title;
        this.setState({
            saveModalIsOpen: true,
            saveInitialTitle: initialTitle,
            saveTabWindow: tabWindow
        });
    };

    closeSaveModal = () => {
        this.setState({ saveModalIsOpen: false });
    };


    openPreferencesModal = () => {
        log.debug('openPreferencesModal');
        this.setState({ prefsModalIsOpen: true });
    };

    closePreferencesModal = () => {
        this.setState({ prefsModalIsOpen: false });
    };

    // handler for save modal
    doSave = titleStr => {
        const storeRef = this.props.storeRef;
        const storeState = storeRef.getValue();
        const tabliFolderId = storeState.folderId;
        actions.manageWindow(
            tabliFolderId,
            storeState.currentWindowId,
            this.state.saveTabWindow,
            titleStr,
            storeRef
        );
        this.closeSaveModal();
    };


    doUpdatePreferences = newPrefs => {
        log.debug('update preferences: ', newPrefs.toJS());
        actions.savePreferences(newPrefs, this.props.storeRef);
        this.closePreferencesModal();
    };

    // render Preferences modal based on storeState.showPreferences
    renderPreferencesModal = () => {
        let modal = null;
        if (this.state.prefsModalIsOpen) {
            modal = (
                <PreferencesModal
                    onClose={this.closePreferencesModal}
                    initialPrefs={this.state.winStore.preferences}
                    storeRef={this.props.storeRef}
                    onSubmit={this.doUpdatePreferences}
                />
            );
        }
        return modal;
    };

    // render save modal (or not) based on this.state.saveModalIsOpen
    renderSaveModal = () => {
        var modal = null;
        if (this.state.saveModalIsOpen) {
            modal = (
                <SaveModal
                    initialTitle={this.state.saveInitialTitle}
                    tabWindow={this.state.saveTabWindow}
                    onClose={this.closeSaveModal}
                    onSubmit={this.doSave}
                    appComponent={this}
                />
            );
        }

        return modal;
    };

    // render revert modal (or not) based on this.state.revertModalIsOpen
    renderRevertModal = () => {
        var modal = null;
        if (this.state.revertModalIsOpen) {
            modal = (
                <RevertModal
                    tabWindow={this.state.revertTabWindow}
                    onClose={this.closeRevertModal}
                    onSubmit={this.doRevert}
                    appComponent={this}
                />
            );
        }

        return modal;
    };

    render() {
        var ret;
        try {
            let themeName = this.state.winStore.preferences.theme;
            const theme = themes[themeName];
            const PreferencesModal = this.renderPreferencesModal();
            const saveModal = this.renderSaveModal();
            const revertModal = this.renderRevertModal();
            const filteredWindows = searchOps.filterTabWindows(
                this.state.sortedWindows,
                this.state.searchRE
            );
            ret = (
                <ThemeContext.Provider value={theme}>
                    <div className={popupOuterStyle(theme)}>
                        <SelectablePopup
                            onSearchInput={this.handleSearchInput}
                            winStore={this.state.winStore}
                            storeRef={this.props.storeRef}
                            filteredWindows={filteredWindows}
                            appComponent={this}
                            searchStr={this.state.searchStr}
                            searchRE={this.state.searchRE}
                            isPopout={this.props.isPopout}
                        />
                        {PreferencesModal}
                        {saveModal}
                        {revertModal}
                    </div>
                </ThemeContext.Provider>
            );
        } catch (e) {
            log.error('App Component: caught exception during render: ');
            log.error(e.stack);
            throw e;
        }

        return ret;
    }

    componentDidMount() {
        if (this.props.noListener) {
            return;
        }

        const storeRef = this.props.storeRef;
        //
        // This listener is essential for triggering a (recursive) re-render
        // in response to a state change.
        //  
        const viewStateListener = () => {
            const nextStore = storeRef.getValue();
            this.setState(this.storeAsState(nextStore));
        };

        const throttledListener = _.debounce(viewStateListener, 200);

        var listenerId = storeRef.addViewListener(throttledListener);

        log.debug('componentDidMount: added view listener: ', listenerId);
        sendHelperMessage({ listenerId });
    }
}
*/

const PopupBase: React.FunctionComponent<PopupProps> = ({
    appState,
    stateRef,
    isPopout,
    noListener
}: PopupProps) => {
    console.log('PopupBase: ', appState.toJS());
    const themeName = appState.preferences.theme as ThemeName;
    const theme = themes[themeName];

    const tabWindows = appState.getAll();
    var cmpFn = utils.windowCmp(appState.currentWindowId);
    const sortedWindows = tabWindows.sort(cmpFn);

    const [prefsModalIsOpen, setPrefsModalIsOpen] = useState(false);
    const [saveModalIsOpen, setSaveModalIsOpen] = useState(false);
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

    const openSaveModal = (tabWindow: TabWindow) => {
        log.debug('TODO: openSaveModal');
    };

    const openRevertModal = (filteredTabWindow: FilteredTabWindow) => {
        setRevertModalIsOpen(true);
        setRevertTabWindow(filteredTabWindow.tabWindow);
    };

    const closeRevertModal = () => {
        setRevertModalIsOpen(false);
        setRevertTabWindow(null);
    };

    const doRevert = (tabWindow: TabWindow) => {
        actions.revertWindow(revertTabWindow!, stateRef);
        closeRevertModal();
    };

    const modalActions: ModalActions = {
        openSaveModal,
        openRevertModal
    };

    const revertModal = revertModalIsOpen ? (
        <RevertModal
            tabWindow={revertTabWindow!}
            onClose={closeRevertModal}
            onSubmit={doRevert}
        />
    ) : null;

    return (
        <ThemeContext.Provider value={theme}>
            <div className={popupOuterStyle(theme)}>
                <SelectablePopup
                    onSearchInput={handleSearchInput}
                    onShowPreferences={() => setPrefsModalIsOpen(true)}
                    appState={appState}
                    stateRef={stateRef}
                    filteredWindows={filteredWindows}
                    modalActions={modalActions}
                    searchStr={searchStr}
                    searchRE={searchRE}
                    isPopout={isPopout}
                />
                {revertModal}
            </div>
        </ThemeContext.Provider>
    );
};

export const Popup = DragDropContext(HTML5Backend)(PopupBase);
