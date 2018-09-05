/**
 * Wrappers around styles with explicit calls to css()
 * for easier use and re-use with emotion and cx().
 *
 * Eventually want to migrate all shared style defs
 * to here
 */
import Styles from './oldStyles'

import { css } from 'emotion'

export const headerButton = css(Styles.headerButton)
export const headerCheckBox = css(Styles.headerCheckBox)
export const noWrap = css(Styles.noWrap)
export const windowHeader = css(Styles.windowHeader)
export const windowManagedButton = css(Styles.windowManagedButton)
export const open = css(Styles.open)
export const closed = css(Styles.closed)
export const text = css(Styles.text)
export const windowTitle = css(Styles.windowTitle)

// Note explicit global css class name windowHeaderHoverContainer here
// Due to limitation of nested class selectors with composition;
// see https://emotion.sh/docs/nested for more info.
export const headerHoverVisible = css`
  visibility: hidden;
  .windowHeaderHoverContainer:hover & {
    visibility: visible;
  }
`
