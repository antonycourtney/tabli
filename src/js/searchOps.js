// @flow
/**
 * Search and filter operations on TabWindows
 */
import map from 'lodash/map'
import filter from 'lodash/filter'
import * as Immutable from 'immutable'
import * as TW from './tabWindow'

const _ = { map, filter }

type SearchSpec = string | RegExp
/*
 * note that matchURL and matchTitle are effectively OR'ed -- if matchURL and
 * matchTitle are both true, a tab will match if either the url or title
 * matches.
 */
type SearchOpts = {
  matchUrl: boolean,
  matchTitle: boolean,
  openOnly: boolean // return only open tabs
}
const defaultSearchOpts : SearchOpts = {
  matchUrl: true,
  matchTitle: true,
  openOnly: false
}

/**
 * A TabItem augmented with search results
 */
const FilteredTabItem = Immutable.Record({
  tabItem: new TW.TabItem(),

  urlMatches: null,
  titleMatches: null
})

/**
 * Use a RegExp to match a particular TabItem
 *
 * @return {FilteredTabItem} filtered item (or null if no match)
 */
export function matchTabItem (tabItem: TW.TabItem,
  searchExp: SearchSpec, options: SearchOpts): ?FilteredTabItem {
  let urlMatches = null
  if (options.openOnly && tabItem.open === false) {
    return null
  }
  if (options.matchUrl) {
    urlMatches = tabItem.url.match(searchExp)
  }
  let titleMatches = null
  if (options.matchTitle) {
    titleMatches = tabItem.title.match(searchExp)
  }

  if (urlMatches === null && titleMatches === null) {
    return null
  }
  // console.log('matchTabItem: ', urlMatches, titleMatches)
  return new FilteredTabItem({ tabItem, urlMatches, titleMatches })
}

/**
 * A TabWindow augmented with search results
 */
const FilteredTabWindow = Immutable.Record({
  tabWindow: new TW.TabWindow(),
  titleMatches: [],
  itemMatches: Immutable.Seq() // matching tab items
})

/**
 * Match a TabWindow using a Regexp
 *
 */
export function matchTabWindow (tabWindow: TW.TabWindow,
  searchExp: SearchSpec,
  options: SearchOpts): ?FilteredTabWindow {
  const itemMatches =
    tabWindow.tabItems.map((ti) =>
      matchTabItem(ti, searchExp, options)).filter((fti) => fti !== null)
  let titleMatches = null
  if (options.matchTitle) {
    titleMatches = tabWindow.title.match(searchExp)
  }

  if (titleMatches === null && itemMatches.count() === 0) {
    return null
  }

  return FilteredTabWindow({ tabWindow, titleMatches, itemMatches })
}

/**
 * filter an array of TabWindows using a searchRE to obtain
 * an array of FilteredTabWindow
 */
export function filterTabWindows (tabWindows: Array<TW.TabWindow>,
  searchExp: SearchSpec,
  options: SearchOpts = defaultSearchOpts): Array<FilteredTabWindow> {
  var res
  if (searchExp === null) {
    res = _.map(tabWindows, (tw) => new FilteredTabWindow({ tabWindow: tw }))
  } else {
    const mappedWindows = _.map(tabWindows, (tw) => matchTabWindow(tw, searchExp, options))
    res = _.filter(mappedWindows, (fw) => fw !== null)
  }

  // And restrict to windows with "normal" windowType:
  res = _.filter(res, (fw) => fw && fw.tabWindow && (!fw.tabWindow.open || fw.tabWindow.windowType === 'normal'))

  return res
}
