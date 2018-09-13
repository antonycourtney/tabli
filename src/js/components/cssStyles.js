/**
 * Wrappers around styles with explicit calls to css()
 * for easier use and re-use with emotion and cx().
 *
 * Eventually want to migrate all shared style defs
 * to here
 */
import OldStyles from './oldStyles'

import { css, cx } from 'emotion'

export const headerButton = css(OldStyles.headerButton)
export const headerCheckBox = css(OldStyles.headerCheckBox)
export const noWrap = css(OldStyles.noWrap)
export const windowHeader = css(OldStyles.windowHeader)
export const windowManagedButton = css(OldStyles.windowManagedButton)
export const open = css(OldStyles.open)
export const closed = css(OldStyles.closed)
export const text = css(OldStyles.text)
export const windowTitle = css(OldStyles.windowTitle)
export const windowTitleInput = css(OldStyles.windowTitleInput)
export const spacer = css(OldStyles.spacer)

// Note explicit global css class name windowHeaderHoverContainer here
// Due to limitation of nested class selectors with composition;
// see https://emotion.sh/docs/nested for more info.
export const headerHoverVisible = css`
  visibility: hidden;
  .windowHeaderHoverContainer:hover & {
    visibility: visible;
  }
`

const closeButtonBaseStyle = css`
  -webkit-mask-image: url('../images/Interface-77.png');
  background-color: #888888;
  &:hover {
    -webkit-mask-image: url('../images/Interface-74.png');
    background-color: #000000;
  }
`
export const headerCloseButton = cx(headerButton, headerHoverVisible, closeButtonBaseStyle)

const titleBaseStyle = cx(text, noWrap, windowTitle)
export const titleOpen = cx(titleBaseStyle, open)
export const titleClosed = cx(titleBaseStyle, closed)
