import { produce, immerable, Draft } from 'immer';
import { log } from './globals';

export interface SavedTabStateProps {
    bookmarkId: string;
    bookmarkIndex: number;
    title: string;
    url: string;
}

export class SavedTabState {
    [immerable] = true;

    bookmarkId: string = '';
    bookmarkIndex: number = 0;
    title: string = '';
    url: string = '';

    private constructor() {}

    static create(props: Partial<SavedTabStateProps> = {}): SavedTabState {
        return produce(new SavedTabState(), (draft: Draft<SavedTabState>) => {
            Object.assign(draft, props);
        });
    }

    static update(
        state: SavedTabState,
        updates: Partial<SavedTabStateProps>,
    ): SavedTabState {
        return produce(state, (draft: Draft<SavedTabState>) => {
            Object.assign(draft, updates);
        });
    }
}

export interface OpenTabStateProps {
    url: string;
    openTabId: number;
    active: boolean;
    openTabIndex: number;
    favIconUrl: string;
    title: string;
    audible: boolean;
    muted: boolean;
    pinned: boolean;
    isSuspended: boolean;
    openerTabId?: number;
    openerUrl?: string;
}

export class OpenTabState {
    [immerable] = true;

    url: string = '';
    openTabId: number = -1;
    active: boolean = false;
    openTabIndex: number = -1;
    favIconUrl: string = '';
    title: string = '';
    audible: boolean = false;
    muted: boolean = false;
    pinned: boolean = false;
    isSuspended: boolean = false;
    openerTabId?: number;
    openerUrl?: string;

    private constructor() {}

    static create(props: Partial<OpenTabStateProps> = {}): OpenTabState {
        return produce(new OpenTabState(), (draft: Draft<OpenTabState>) => {
            Object.assign(draft, props);
        });
    }

    static update(
        state: OpenTabState,
        updates: Partial<OpenTabStateProps>,
    ): OpenTabState {
        return produce(state, (draft: Draft<OpenTabState>) => {
            Object.assign(draft, updates);
        });
    }
}

export interface TabItemProps {
    saved: boolean;
    savedState: SavedTabState | null;
    open: boolean;
    openState: OpenTabState | null;
}

// props for uniquely identifying a TabItem in a TabWindow
export interface TabItemId {
    open: boolean;
    saved: boolean;
    openTabId?: number;
    bookmarkId?: string;
}

let tabItemKeyCounter = 500;
const genTabItemKey = () => '_tabItem-' + tabItemKeyCounter++;

export class TabItem {
    [immerable] = true;

    saved: boolean = false;
    savedState: SavedTabState | null = null;
    open: boolean = false;
    openState: OpenTabState | null = null;
    key: string = '';

    private constructor() {}

    static create(props: Partial<TabItemProps> = {}): TabItem {
        return produce(new TabItem(), (draft: Draft<TabItem>) => {
            Object.assign(draft, props);
            /* This is gross -- we should have two distinct entry points -- one for deserialization
             * where we expect keys, and one for fresh creation where we generate keys.
             */
            if (!draft.key) {
                draft.key = genTabItemKey();
                /*
                log.debug(
                    'TabItem.create: no key passed in create props, generated new key: ',
                    draft.key,
                    props,
                );
                */
            }
            if (props.savedState) {
                draft.savedState = SavedTabState.create(props.savedState);
            }
            if (props.openState) {
                draft.openState = OpenTabState.create(props.openState);
            }
        });
    }

    static update(tabItem: TabItem, updates: Partial<TabItemProps>): TabItem {
        return produce(tabItem, (draft: Draft<TabItem>) => {
            Object.assign(draft, updates);
            if (updates.savedState) {
                draft.savedState = SavedTabState.create(updates.savedState);
            }
            if (updates.openState) {
                draft.openState = OpenTabState.create(updates.openState);
            }
        });
    }

    get title(): string {
        return this.open && this.openState
            ? this.openState.title
            : this.savedState
              ? this.savedState.title
              : '';
    }

    get url(): string {
        return this.open && this.openState
            ? this.openState.url
            : this.savedState
              ? this.savedState.url
              : '';
    }

    get pinned(): boolean {
        return this.open && this.openState ? this.openState.pinned : false;
    }

    get active(): boolean {
        return this.open && this.openState ? this.openState.active : false;
    }

    get safeSavedState(): SavedTabState {
        if (this.saved && this.savedState) {
            return this.savedState;
        }
        throw new Error('Unexpected access of savedState on unsaved tab');
    }

    get safeOpenState(): OpenTabState {
        if (this.open && this.openState) {
            return this.openState;
        }
        throw new Error('Unexpected access of openState on non-open tab');
    }

    get tabItemId(): TabItemId {
        let tabIdProps: TabItemId = { open: this.open, saved: this.saved };
        if (this.open && this.openState) {
            tabIdProps.openTabId = this.openState.openTabId;
        }
        if (this.saved && this.savedState) {
            tabIdProps.bookmarkId = this.savedState.bookmarkId;
        }
        return tabIdProps;
    }

    // helper for migration from immutable:
    toJS() {
        return this;
    }
}

export interface TabWindowProps {
    saved: boolean;
    savedTitle: string;
    savedFolderId: string;
    open: boolean;
    openWindowId: number;
    windowType: string;
    width: number;
    height: number;
    tabItems: TabItem[];
    snapshot: boolean;
    chromeSessionId: string | null;
    expanded: boolean | null;
}

export class TabWindow {
    [immerable] = true;

    saved: boolean = false;
    savedTitle: string = '';
    savedFolderId: string = '';
    open: boolean = false;
    openWindowId: number = -1;
    windowType: string = '';
    width: number = 0;
    height: number = 0;
    tabItems: TabItem[] = [];
    snapshot: boolean = false;
    chromeSessionId: string | null = null;
    expanded: boolean | null = null;

    private constructor() {}

    static create(props: Partial<TabWindowProps> = {}): TabWindow {
        return produce(new TabWindow(), (draft: Draft<TabWindow>) => {
            Object.assign(draft, props);
            /* voluminous:
            log.debug(
                'TabWindow.create: ',
                props.open,
                props.openWindowId,
                props.tabItems,
            );
            */
            draft.tabItems = (props.tabItems || []).map(TabItem.create);
        });
    }

    static update(
        tabWindow: TabWindow,
        updates: Partial<TabWindowProps>,
    ): TabWindow {
        return produce(tabWindow, (draft: Draft<TabWindow>) => {
            Object.assign(draft, updates);
            if (updates.tabItems) {
                draft.tabItems = updates.tabItems.map(TabItem.create);
            }
        });
    }

    get key(): string {
        if (this.saved) {
            return '_saved' + this.savedFolderId;
        } else {
            return '_open' + this.openWindowId;
        }
    }
    updateSavedTitle(title: string): TabWindow {
        return TabWindow.update(this, { savedTitle: title });
    }

    get title(): string {
        if (this.saved) {
            return this.savedTitle;
        }

        const activeTab = this.tabItems.find(
            (t) => t.open && t.openState && t.openState.active,
        );

        if (!activeTab) {
            // If no active tab is found, fall back to the first open tab
            const openTabItem = this.tabItems.find((t) => t.open);
            return openTabItem ? openTabItem.title : '';
        }

        return activeTab.title;
    }

    get openTabCount(): number {
        return this.tabItems.filter((ti) => ti.open).length;
    }

    addTabItem(tabItem: TabItem): TabWindow {
        return produce(this, (draft: Draft<TabWindow>) => {
            draft.tabItems.push(TabItem.create(tabItem));
        });
    }

    removeTabItem(index: number): TabWindow {
        return produce(this, (draft: Draft<TabWindow>) => {
            draft.tabItems.splice(index, 1);
        });
    }

    updateTabItemInWindow(
        index: number,
        updates: Partial<TabItemProps>,
    ): TabWindow {
        return produce(this, (draft: Draft<TabWindow>) => {
            draft.tabItems[index] = TabItem.update(
                draft.tabItems[index],
                updates,
            );
        });
    }

    setTabItems(tabItems: TabItem[]): TabWindow {
        return produce(this, (draft: Draft<TabWindow>) => {
            draft.tabItems = tabItems.map(TabItem.create);
        });
    }

    getActiveTabId(): number | null {
        const activeTab = this.tabItems.find(
            (t) => t.open && t.openState && t.openState.active,
        );
        return activeTab && activeTab.openState
            ? activeTab.openState.openTabId
            : null;
    }

    findChromeTabId(tabId: number): [number, TabItem] | null {
        const index = this.tabItems.findIndex(
            (ti) => ti.open && ti.openState && ti.openState.openTabId === tabId,
        );
        return index !== -1 ? [index, this.tabItems[index]] : null;
    }

    findChromeBookmarkId(bookmarkId: string): [number, TabItem] | null {
        const index = this.tabItems.findIndex(
            (ti) =>
                ti.saved &&
                ti.savedState &&
                ti.savedState.bookmarkId === bookmarkId,
        );
        return index !== -1 ? [index, this.tabItems[index]] : null;
    }

    findTabByKey(key: string): [number, TabItem] | null {
        const index = this.tabItems.findIndex((ti) => ti.key === key);
        return index !== -1 ? [index, this.tabItems[index]] : null;
    }

    findTabByTabItemId(tabItemId: TabItemId): [number, TabItem] | null {
        // predicate comparison function for findIndex:
        const isTarget = (ti: TabItem): boolean => {
            /* Note that fallthrough is intentional here: we try to match the openTabId
             * first, then the bookmarkId if that fails.
             */
            if (tabItemId.open && ti.open && ti.openState) {
                if (ti.openState.openTabId === tabItemId.openTabId) {
                    return true;
                }
            }
            if (tabItemId.saved && ti.saved && ti.savedState) {
                if (ti.savedState.bookmarkId === tabItemId.bookmarkId)
                    return true;
            }
            return false;
        };
        const index = this.tabItems.findIndex(isTarget);
        return index !== -1 ? [index, this.tabItems[index]] : null;
    }

    isExpanded(expandAll: boolean): boolean {
        if (this.expanded === null) {
            return expandAll && this.open;
        }
        return this.expanded;
    }

    exportStr(): string {
        const fmtTabItem = (ti: TabItem) => {
            const urls = ti.url;
            const title = ti.title.replace(/\|/g, '-');
            return `${title} | ${urls}\n`;
        };
        const titleStr = '### ' + this.title;
        const headerStr = `
Title                                  | URL
---------------------------------------|-----------
`;
        const s0 = titleStr + '\n' + headerStr;
        return this.tabItems.reduce((rs, ti) => rs + fmtTabItem(ti), s0);
    }

    clearExpanded(): TabWindow {
        return produce(this, (draft: Draft<TabWindow>) => {
            draft.expanded = null;
        });
    }

    clearChromeSessionId(): TabWindow {
        return produce(this, (draft: Draft<TabWindow>) => {
            draft.chromeSessionId = null;
        });
    }

    static fromJS(js: any): TabWindow {
        return TabWindow.create({
            ...js,
            tabItems: js.tabItems.map(TabItem.create),
        });
    }

    // helper for migration from immutable
    toJS() {
        return this;
    }
}
