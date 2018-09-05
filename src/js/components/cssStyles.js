/**
 * Wrappers around styles with explicit calls to css()
 * for easier use and re-use with emotion and cx().
 *
 * Eventually want to migrate all shared style defs
 * to here
 */
import OldStyles from './oldStyles'

import { css } from 'emotion'

export const headerButton = css(OldStyles.headerButton)
export const headerCheckBox = css(OldStyles.headerCheckBox)
export const noWrap = css(OldStyles.noWrap)
export const windowHeader = css(OldStyles.windowHeader)
export const windowManagedButton = css(OldStyles.windowManagedButton)
export const open = css(OldStyles.open)
export const closed = css(OldStyles.closed)
export const text = css(OldStyles.text)
export const windowTitle = css(OldStyles.windowTitle)

// Note explicit global css class name windowHeaderHoverContainer here
// Due to limitation of nested class selectors with composition;
// see https://emotion.sh/docs/nested for more info.
export const headerHoverVisible = css`
  visibility: hidden;
  .windowHeaderHoverContainer:hover & {
    visibility: visible;
  }
`
