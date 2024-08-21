import { TabWindow } from '../tabWindow';

export default interface ModalActions {
    openSaveModal: (tabWindow: TabWindow) => void;
    openRevertModal: (tabWindow: TabWindow) => void;
    openUnmanageModal: (tabWindow: TabWindow) => void;
}
