/**
 * Search and filter operations on TabWindows
 */
'use strict';

import * as _ from 'lodash';
import * as Immutable from 'immutable';
import * as TabWindow from './tabWindow';

/**
 * A TabItem augmented with search results
 */
const FilteredTabItem = Immutable.Record({
  tabItem: new TabWindow.TabItem(),

  urlMatches: null,
  titleMatches: null,
});

/**
 * Use a RegExp to match a particular TabItem
 *
 * @return {FilteredTabItem} filtered item (or null if no match)
 */
export function matchTabItem(tabItem, searchExp) {
  var urlMatches = tabItem.url.match(searchExp);
  var titleMatches = tabItem.title.match(searchExp);

  if (urlMatches === null && titleMatches === null)
    return null;

  return new FilteredTabItem({ tabItem, urlMatches, titleMatches });
}

/**
 * A TabWindow augmented with search results
 */
const FilteredTabWindow = Immutable.Record({
  tabWindow: new TabWindow.TabWindow(),
  titleMatches: [],
  itemMatches: Immutable.Seq(),   // matching tab items
});

/**
 * Match a TabWindow using a Regexp
 *
 */
export function matchTabWindow(tabWindow, searchExp) {
  const itemMatches = tabWindow.tabItems.map((ti) => matchTabItem(ti, searchExp)).filter((fti) => fti !== null);
  const titleMatches = tabWindow.title.match(searchExp);

  if (titleMatches === null && itemMatches.count() === 0)
    return null;

  return FilteredTabWindow({ tabWindow, titleMatches, itemMatches });
}

/**
 * filter an array of TabWindows using a searchRE to obtain
 * an array of FilteredTabWindow
 */
export function filterTabWindows(tabWindows, searchExp) {
  var res;
  if (searchExp === null) {
    res = _.map(tabWindows, (tw) => new FilteredTabWindow({ tabWindow: tw }));
  } else {
    const mappedWindows = _.map(tabWindows, (tw) => matchTabWindow(tw, searchExp));
    res = _.filter(mappedWindows, (fw) => fw !== null);
  }

  return res;
}
