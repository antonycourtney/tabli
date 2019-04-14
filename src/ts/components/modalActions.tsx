import { TabWindow } from '../tabWindow';
import { FilteredTabWindow } from '../searchOps';

export default interface ModalActions {
    openSaveModal: (tabWindow: TabWindow) => void;
    openRevertModal: (filteredTabWindow: FilteredTabWindow) => void;
}
