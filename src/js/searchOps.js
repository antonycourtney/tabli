// @flow
/**
 * Search and filter operations on TabWindows
 */
import * as _ from 'lodash'
import * as Immutable from 'immutable'
import * as TW from './tabWindow'

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
export function matchTabItem (tabItem: TW.TabItem, searchExp: string) {
  var urlMatches = tabItem.url.match(searchExp)
  var titleMatches = tabItem.title.match(searchExp)

  if (urlMatches === null && titleMatches === null) {
    return null
  }

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
export function matchTabWindow (tabWindow: TW.TabWindow, searchExp: string) {
  const itemMatches = tabWindow.tabItems.map((ti) => matchTabItem(ti, searchExp)).filter((fti) => fti !== null)
  const titleMatches = tabWindow.title.match(searchExp)

  if (titleMatches === null && itemMatches.count() === 0) {
    return null
  }

  return FilteredTabWindow({ tabWindow, titleMatches, itemMatches })
}

/**
 * filter an array of TabWindows using a searchRE to obtain
 * an array of FilteredTabWindow
 */
export function filterTabWindows (tabWindows: Array<TW.TabWindow>, searchExp: string): Array<FilteredTabWindow> {
  var res
  if (searchExp === null) {
    res = _.map(tabWindows, (tw) => new FilteredTabWindow({ tabWindow: tw }))
  } else {
    const mappedWindows = _.map(tabWindows, (tw) => matchTabWindow(tw, searchExp))
    res = _.filter(mappedWindows, (fw) => fw !== null)
  }

  // And restrict to windows with "normal" windowType:
  res = _.filter(res, (fw) => fw && fw.tabWindow && (!fw.tabWindow.open || fw.tabWindow.windowType === 'normal'))

  return res
}
