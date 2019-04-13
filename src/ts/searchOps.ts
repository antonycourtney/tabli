/**
 * Search and filter operations on TabWindows
 */
import log from 'loglevel';
import map from 'lodash/map';
import filter from 'lodash/filter';
import * as Immutable from 'immutable';
import * as TW from './tabWindow';

const _ = { map, filter };

type SearchSpec = string | RegExp | null;
/*
 * note that matchURL and matchTitle are effectively OR'ed -- if matchURL and
 * matchTitle are both true, a tab will match if either the url or title
 * matches.
 */
type SearchOpts = {
    matchUrl: boolean;
    matchTitle: boolean;
    openOnly: boolean; // return only open tabs
};
const defaultSearchOpts: SearchOpts = {
    matchUrl: true,
    matchTitle: true,
    openOnly: false
};

interface FilteredTabItemProps {
    tabItem: TW.TabItem;
    urlMatches: RegExpMatchArray | null;
    titleMatches: RegExpMatchArray | null;
}

const defaultFilteredTabItemProps: FilteredTabItemProps = {
    tabItem: new TW.TabItem(),
    urlMatches: null,
    titleMatches: null
};

/**
 * A TabItem augmented with search results
 */
class FilteredTabItem extends Immutable.Record(defaultFilteredTabItemProps) {}

/**
 * Use a RegExp to match a particular TabItem
 *
 * @return {FilteredTabItem} filtered item (or null if no match)
 */
export function matchTabItem(
    tabItem: TW.TabItem,
    searchExp: SearchSpec,
    options: SearchOpts
): FilteredTabItem | null {
    let urlMatches = null;
    if (options.openOnly && tabItem.open === false) {
        return null;
    }
    if (searchExp === null) {
        return null;
    }
    if (options.matchUrl) {
        urlMatches = tabItem.url.match(searchExp);
    }
    let titleMatches = null;
    if (options.matchTitle) {
        titleMatches = tabItem.title.match(searchExp);
    }

    if (urlMatches === null && titleMatches === null) {
        return null;
    }
    // log.log('matchTabItem: ', urlMatches, titleMatches)
    return new FilteredTabItem({ tabItem, urlMatches, titleMatches });
}

interface FilteredTabWindowProps {
    tabWindow: TW.TabWindow;
    titleMatches: RegExpMatchArray | null;
    itemMatches: Immutable.List<FilteredTabItem>;
}

const defaultFilteredTabWindowProps: FilteredTabWindowProps = {
    tabWindow: new TW.TabWindow(),
    titleMatches: [],
    itemMatches: Immutable.List<FilteredTabItem>() // matching tab items
};

/**
 * A TabWindow augmented with search results
 */
export class FilteredTabWindow extends Immutable.Record(
    defaultFilteredTabWindowProps
) {}

/**
 * Match a TabWindow using a Regexp
 *
 */
export function matchTabWindow(
    tabWindow: TW.TabWindow,
    searchExp: SearchSpec,
    options: SearchOpts
): FilteredTabWindow | null {
    if (searchExp === null) {
        return null;
    }
    const itemMatches = tabWindow.tabItems
        .map(ti => matchTabItem(ti, searchExp, options))
        .filter(fti => fti !== null) as Immutable.List<FilteredTabItem>;
    let titleMatches = null;
    if (options.matchTitle) {
        titleMatches = tabWindow.title.match(searchExp);
    }

    if (titleMatches === null && itemMatches.count() === 0) {
        return null;
    }

    return new FilteredTabWindow({ tabWindow, titleMatches, itemMatches });
}

/**
 * filter an array of TabWindows using a searchRE to obtain
 * an array of FilteredTabWindow
 */
export function filterTabWindows(
    tabWindows: Array<TW.TabWindow>,
    searchExp: SearchSpec,
    options: SearchOpts = defaultSearchOpts
): FilteredTabWindow[] {
    var res: (FilteredTabWindow | null)[];
    if (searchExp === null) {
        res = _.map(tabWindows, tw => new FilteredTabWindow({ tabWindow: tw }));
    } else {
        const mappedWindows = _.map(tabWindows, tw =>
            matchTabWindow(tw, searchExp, options)
        );
        res = _.filter(mappedWindows, fw => fw !== null);
    }

    // And restrict to windows with "normal" windowType:
    res = _.filter(
        res,
        fw =>
            fw !== null &&
            fw.tabWindow !== null &&
            (!fw.tabWindow.open || fw.tabWindow.windowType === 'normal')
    );

    return res as FilteredTabWindow[];
}
