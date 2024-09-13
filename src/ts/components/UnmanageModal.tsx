import { log } from '../globals';
import * as React from 'react';
import * as Immutable from 'immutable';
import * as styles from './cssStyles';
import { cx } from '@emotion/css';

import * as Constants from './constants';

import * as Modal from './Modal';

import { TabWindow, TabItem } from '../tabWindow';
import { ThemeContext } from './themeContext';
import * as tabItemUtil from './tabItemUtil';
import TabManagerState from '../tabManagerState';
import { StateRef } from 'oneref';
import { useContext, useRef, useEffect } from 'react';
import * as tabWindowUtils from '../tabWindowUtils';
import { LayoutContext } from './LayoutContext';

/*
 * Modal dialog for unmanaging a window
 */
interface UnmanageModalProps {
    tabWindow: TabWindow;
    onClose: () => void;
    onSubmit: (w: TabWindow) => void;
}

const UnmanageModal: React.FC<UnmanageModalProps> = ({
    tabWindow,
    onClose,
    onSubmit,
}: UnmanageModalProps) => {
    const theme = useContext(ThemeContext);
    const layout = useContext(LayoutContext);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
        if (e.keyCode === Constants.KEY_ESC) {
            // ESC key
            e.preventDefault();
            onClose();
        } else if (e.keyCode === Constants.KEY_ENTER) {
            handleSubmit(e);
        }
    };

    const handleSubmit = (e: React.BaseSyntheticEvent) => {
        e.preventDefault();
        onSubmit(tabWindow);
    };

    const defaultButtonRef = useRef<HTMLButtonElement | null>(null);

    useEffect(() => {
        log.debug('Unmanage modal effect handler: ', defaultButtonRef.current);
        if (defaultButtonRef.current) {
            defaultButtonRef.current.focus();
        }
    }, []);

    return (
        <Modal.Dialog title="Unmanage Saved Window?" onClose={onClose}>
            <Modal.Body>
                <div className={styles.dialogInfoContents}>
                    <p>
                        Are you sure you want to unmanage the saved window "
                        {tabWindow.title}"?
                        <br />
                        Unmanaging a saved window will disconnect all tabs from
                        their saved bookmarks, and archive all bookmarks for the
                        window.
                    </p>
                    <br />
                    <p>This action can not be undone.</p>
                </div>
                <div className={styles.dialogButtonRow}>
                    <button
                        type="button"
                        className="btn btn-primary tabli-dialog-button"
                        onClick={(e) => handleSubmit(e)}
                        ref={defaultButtonRef}
                        tabIndex={0}
                        onKeyDown={handleKeyDown}
                    >
                        OK
                    </button>
                    <button
                        type="button"
                        className="btn btn-default btn-light tabli-dialog-button"
                        onClick={onClose}
                        tabIndex={0}
                    >
                        Cancel
                    </button>
                </div>
            </Modal.Body>
        </Modal.Dialog>
    );
};

export default UnmanageModal;
