import log from 'loglevel'; // eslint-disable-line no-unused-vars
import * as React from 'react';
import * as styles from './cssStyles';
import * as Constants from './constants';
import * as Modal from './Modal';
import { themes } from './themeContext';
import { css, cx } from 'emotion';
import { Preferences } from '../preferences';
import { useState } from 'react';
import { layouts } from './LayoutContext';
import {
    fontScaleFactorToSize,
    fontSizeToScaleFactor,
    fontSizeVals
} from '../renderUtils';
const themeSelectStyle = css({
    width: 80,
    marginLeft: 5
});

const fontSizeSelectStyle = css({
    width: 80,
    marginLeft: 5
});

const selectLabelStyle = css({
    marginTop: 0,
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 4
});

const checkLabelStyle = css({
    margin: 0
});

interface PreferencesModalProps {
    initialPrefs: Preferences;
    onClose: () => void;
    onApply: (newPrefs: Preferences) => void;
    onSubmit: (newPrefs: Preferences) => void;
}

const PreferencesModal: React.FC<PreferencesModalProps> = ({
    initialPrefs,
    onClose,
    onApply,
    onSubmit
}) => {
    const [prefs, setPrefs] = useState(initialPrefs);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.keyCode === Constants.KEY_ESC) {
            // ESC key
            e.preventDefault();
            onClose();
        } else if (e.keyCode === Constants.KEY_ENTER) {
            handleSubmit(e);
        }
    };

    const handleApply = (e: React.SyntheticEvent) => {
        e.preventDefault();
        onApply(prefs);
    };

    const handleSubmit = (e: React.SyntheticEvent) => {
        e.preventDefault();
        onSubmit(prefs);
    };

    const handlePopStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const oldPrefs = prefs;
        const nextPrefs = oldPrefs.set(
            'popoutOnStart',
            !oldPrefs.popoutOnStart
        );
        setPrefs(nextPrefs);
    };

    const handleTabDedupeChange = () => {
        const oldPrefs = prefs;
        const nextPrefs = oldPrefs.set('dedupeTabs', !oldPrefs.dedupeTabs);
        setPrefs(nextPrefs);
    };

    const handleRevertOnOpenChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const oldPrefs = prefs;
        const nextPrefs = oldPrefs.set('revertOnOpen', !oldPrefs.revertOnOpen);
        setPrefs(nextPrefs);
    };

    const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const oldPrefs = prefs;
        const nextPrefs = oldPrefs.set('theme', e.target.value);
        log.debug('handleThemeChange: nextPrefs:', nextPrefs.toJS());
        setPrefs(nextPrefs);
    };

    const handleLayoutChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const oldPrefs = prefs;
        const nextPrefs = oldPrefs.set('layout', e.target.value);
        log.debug('handleThemeChange: nextPrefs:', nextPrefs.toJS());
        setPrefs(nextPrefs);
    };

    const handleFontSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const oldPrefs = prefs;
        const nextScaleFactor = fontSizeToScaleFactor(
            Number.parseInt(e.target.value)
        );
        const nextPrefs = oldPrefs.set('fontScaleFactor', nextScaleFactor);
        log.debug(
            'handleFontSizeChange: fontSize: ',
            e.target.value,
            ', nextPrefs:',
            nextPrefs.toJS()
        );
        setPrefs(nextPrefs);
    };

    const popStart = prefs.popoutOnStart;
    const dedupeTabs = prefs.dedupeTabs;
    const revertOnOpen = prefs.revertOnOpen;

    const currentTheme = prefs.theme;
    const themeNames = Object.keys(themes);
    const themeOpts = themeNames.map(nm => (
        <option key={nm} value={nm}>
            {nm}
        </option>
    ));
    const themeSelect = (
        <select
            className={themeSelectStyle}
            name="theme"
            value={currentTheme}
            onChange={e => handleThemeChange(e)}
        >
            {themeOpts}
        </select>
    );

    const currentLayout = prefs.layout;
    const layoutNames = Object.keys(layouts);
    const layoutOpts = layoutNames.map(nm => (
        <option key={nm} value={nm}>
            {nm}
        </option>
    ));
    const layoutSelect = (
        <select
            className={themeSelectStyle}
            name="layout"
            value={currentLayout}
            onChange={e => handleLayoutChange(e)}
        >
            {layoutOpts}
        </select>
    );

    const currentFontSize = fontScaleFactorToSize(prefs.fontScaleFactor);
    const fontSizeOpts = fontSizeVals.map(sz => (
        <option key={sz.toString()} value={sz}>
            {sz.toString()}
        </option>
    ));
    const fontSizeSelect = (
        <select
            className={fontSizeSelectStyle}
            name="fontSize"
            value={currentFontSize}
            onChange={e => handleFontSizeChange(e)}
        >
            {fontSizeOpts}
        </select>
    );

    const rightCol = styles.prefsGridRightCol;

    return (
        <Modal.Dialog title="Tabli Preferences" onClose={onClose}>
            <Modal.Body>
                <div className={styles.modalBodyContainer}>
                    <form className={styles.prefsForm} onSubmit={handleSubmit}>
                        <div className={styles.prefsGridContainer}>
                            <div className={cx('checkbox', rightCol)}>
                                <label className={checkLabelStyle}>
                                    <input
                                        type="checkbox"
                                        checked={popStart}
                                        onChange={e => handlePopStartChange(e)}
                                    />
                                    Show Tabli popout window at startup
                                </label>
                            </div>
                            <div className={cx('checkbox', rightCol)}>
                                <label className={checkLabelStyle}>
                                    <input
                                        type="checkbox"
                                        checked={dedupeTabs}
                                        onChange={e => handleTabDedupeChange()}
                                    />
                                    Automatically close duplicate tabs
                                </label>
                            </div>
                            <div className={cx('checkbox', rightCol)}>
                                <label className={checkLabelStyle}>
                                    <input
                                        type="checkbox"
                                        checked={revertOnOpen}
                                        onChange={e =>
                                            handleRevertOnOpenChange(e)
                                        }
                                    />
                                    Only re-open saved tabs when re-opening
                                    saved windows
                                </label>
                            </div>
                            <div className={styles.prefsGridLabel}>
                                <label className={selectLabelStyle}>
                                    Theme
                                </label>
                            </div>
                            {themeSelect}
                            <div className={styles.prefsGridLabel}>
                                <label className={selectLabelStyle}>
                                    Layout
                                </label>
                            </div>
                            {layoutSelect}
                            <div className={styles.prefsGridLabel}>
                                <label className={selectLabelStyle}>
                                    Font Size
                                </label>
                            </div>
                            {fontSizeSelect}
                        </div>
                    </form>
                    <hr />
                    <div className={styles.dialogButtonRow}>
                        <button
                            type="button"
                            className="btn btn-primary btn-sm tabli-dialog-button"
                            onClick={e => handleApply(e)}
                            tabIndex={0}
                            onKeyDown={handleKeyDown}
                        >
                            Apply
                        </button>
                        <button
                            type="button"
                            className="btn btn-primary btn-sm tabli-dialog-button"
                            onClick={e => handleSubmit(e)}
                            tabIndex={0}
                            onKeyDown={handleKeyDown}
                        >
                            OK
                        </button>
                        <button
                            type="button"
                            className="btn btn-default btn-light btn-sm tabli-dialog-button"
                            onClick={e => onClose()}
                            tabIndex={0}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </Modal.Body>
        </Modal.Dialog>
    );
};

export default PreferencesModal;
