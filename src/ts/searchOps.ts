import { log } from './globals';
import { produce, immerable } from 'immer';
import { TabWindow, TabItem } from './tabWindow';

export type SearchSpec = string | RegExp | null;

export interface SearchOpts {
    matchUrl: boolean;
    matchTitle: boolean;
    openOnly: boolean;
}

const defaultSearchOpts: SearchOpts = {
    matchUrl: true,
    matchTitle: true,
    openOnly: false,
};

export interface FilteredTabItemProps {
    tabItem: TabItem;
    urlMatches: RegExpMatchArray | null;
    titleMatches: RegExpMatchArray | null;
}

export class FilteredTabItem {
    [immerable] = true;

    tabItem: TabItem;
    urlMatches: RegExpMatchArray | null;
    titleMatches: RegExpMatchArray | null;

    private constructor() {
        this.tabItem = TabItem.create();
        this.urlMatches = null;
        this.titleMatches = null;
    }

    static create(props: Partial<FilteredTabItemProps> = {}): FilteredTabItem {
        return produce(new FilteredTabItem(), (draft) => {
            Object.assign(draft, props);
        });
    }
}

export function matchTabItem(
    tabItem: TabItem,
    searchExp: SearchSpec,
    options: SearchOpts,
): FilteredTabItem | null {
    if (options.openOnly && !tabItem.open) {
        return null;
    }
    if (searchExp === null) {
        return null;
    }
    let urlMatches = null;
    let titleMatches = null;

    if (options.matchUrl) {
        urlMatches = tabItem.url.match(searchExp);
    }
    if (options.matchTitle) {
        titleMatches = tabItem.title.match(searchExp);
    }

    if (urlMatches === null && titleMatches === null) {
        return null;
    }

    return FilteredTabItem.create({ tabItem, urlMatches, titleMatches });
}

export interface FilteredTabWindowProps {
    tabWindow: TabWindow;
    titleMatches: RegExpMatchArray | null;
    itemMatches: FilteredTabItem[];
}

export class FilteredTabWindow {
    [immerable] = true;

    tabWindow: TabWindow;
    titleMatches: RegExpMatchArray | null;
    itemMatches: FilteredTabItem[];

    private constructor() {
        this.tabWindow = TabWindow.create();
        this.titleMatches = null;
        this.itemMatches = [];
    }

    static create(
        props: Partial<FilteredTabWindowProps> = {},
    ): FilteredTabWindow {
        return produce(new FilteredTabWindow(), (draft) => {
            Object.assign(draft, props);
        });
    }
}

export function matchTabWindow(
    tabWindow: TabWindow,
    searchExp: SearchSpec,
    options: SearchOpts = defaultSearchOpts,
): FilteredTabWindow | null {
    if (searchExp === null) {
        return null;
    }

    const itemMatches = tabWindow.tabItems
        .map((ti) => matchTabItem(ti, searchExp, options))
        .filter((fti): fti is FilteredTabItem => fti !== null);

    let titleMatches = null;
    if (options.matchTitle) {
        titleMatches = tabWindow.title.match(searchExp);
    }

    if (titleMatches === null && itemMatches.length === 0) {
        return null;
    }

    return FilteredTabWindow.create({ tabWindow, titleMatches, itemMatches });
}

export function filterTabWindows(
    tabWindows: TabWindow[],
    searchExp: SearchSpec,
    options: SearchOpts = defaultSearchOpts,
): FilteredTabWindow[] {
    let filteredWindows: FilteredTabWindow[];

    if (searchExp === null) {
        filteredWindows = tabWindows.map((tw) =>
            FilteredTabWindow.create({ tabWindow: tw }),
        );
    } else {
        filteredWindows = tabWindows
            .map((tw) => matchTabWindow(tw, searchExp, options))
            .filter((fw): fw is FilteredTabWindow => fw !== null);
    }

    return filteredWindows.filter(
        (fw) => !fw.tabWindow.open || fw.tabWindow.windowType === 'normal',
    );
}
