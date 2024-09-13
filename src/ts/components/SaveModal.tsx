import { log } from '../globals';
import * as React from 'react';
import * as styles from './cssStyles';
import * as Constants from './constants';
import * as Modal from './Modal';
import { useRef } from 'react';

interface SaveModalProps {
    initialTitle: string;
    onClose: () => void;
    onSubmit: (title: string) => void;
}

const SaveModal: React.FC<SaveModalProps> = ({
    initialTitle,
    onClose,
    onSubmit,
}) => {
    const titleInputRef = useRef<HTMLInputElement | null>(null);

    React.useEffect(() => {
        const titleElem = titleInputRef.current;
        const titleLen = initialTitle.length;
        if (titleElem) {
            window.setTimeout(() => {
                log.debug('savemodal timer func');
                titleElem.setSelectionRange(0, titleLen);
            }, 0);
        } else {
            log.debug('SaveModal: no titleInput element');
        }
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.keyCode === Constants.KEY_ESC) {
            // ESC key
            e.preventDefault();
            onClose();
        }
    };

    const handleSubmit = (e: React.BaseSyntheticEvent) => {
        e.preventDefault();
        const ic = titleInputRef.current;
        if (ic) {
            const titleStr = ic.value;
            log.debug('handleSubmit: title: ', titleStr);
            onSubmit(titleStr);
        }
    };

    return (
        <Modal.Dialog title="Save Tabs" onClose={onClose}>
            <Modal.Info>
                <span>Save all tabs in this window</span>
            </Modal.Info>
            <Modal.Body>
                <div className={styles.centerContents}>
                    <form
                        className="dialog-form save-form"
                        onSubmit={handleSubmit}
                    >
                        <fieldset>
                            <label htmlFor="title">Window Title</label>
                            <input
                                type="text"
                                name="title"
                                id="title"
                                ref={titleInputRef}
                                autoFocus
                                autoComplete="off"
                                defaultValue={initialTitle}
                                onKeyDown={handleKeyDown}
                            />
                        </fieldset>
                    </form>
                </div>
            </Modal.Body>
        </Modal.Dialog>
    );
};

export default SaveModal;
