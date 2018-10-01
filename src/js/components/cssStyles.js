// @flow
import * as Constants from './constants'
import * as colors from './colors'
import { mkUrl } from './util'
/**
 * Wrappers around styles with explicit calls to css()
 * for easier use and re-use with emotion and cx().
 *
 * Eventually want to migrate all shared style defs
 * to here
 */
import { css, cx } from 'emotion'

export const rowItemsFixedWidth = css`
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto
`

export const activeSpan = css({
  fontWeight: 'bold'
})
export const tabTitle = css({
  minWidth: Constants.TAB_TITLE_MIN_WIDTH,
  color: 'black',
  textDecoration: 'none',
  flexGrow: 1,
  '&:hover': {
    color: 'black',
    textDecoration: 'none'
  }
})
export const tabItemSelected = css({
  backgroundColor: '#dadada'
})
export const audibleIcon = css({
  WebkitMaskImage: mkUrl('images/Multimedia-64.png'),
  backgroundColor: '#505050'
})
export const tabItem = css({
  height: 20,
  maxHeight: 20,
  paddingLeft: 3,
  paddingRight: 3,
  display: 'flex',
  alignItems: 'center',
  '&:hover': {
    borderTop: '1px solid #cacaca',
    borderBottom: '1px solid #cacaca'
  }
})
export const headerButton = css({
  outline: 'none',
  border: 'none',
  backgroundRepeat: 'no-repeat',
  width: 16,
  height: 16,
  marginLeft: 1,
  marginRight: 1,
  flex: 'none'
})
export const noWrap = css({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap'
})
export const windowHeader = css({
  backgroundColor: '#ebe9eb',
  borderBottom: '1px solid #bababa',
  height: Constants.WINDOW_HEADER_HEIGHT,
  maxHeight: Constants.WINDOW_HEADER_HEIGHT,
  paddingLeft: 3,
  paddingRight: 3,

  // marginBottom: 3,
  display: 'inline-flex',

  // justifyContent: 'space-between',
  alignItems: 'center'
})
export const windowManagedButton = css({
  WebkitMaskImage: mkUrl('images/Status-9.png'),
  backgroundColor: '#7472ff'
})
export const open = css({})
export const closed = css({
  color: colors.closedGray
})
export const text = css({
  fontSize: 12,
  marginTop: 'auto',
  marginBottom: 'auto',
  marginLeft: 3
})
export const windowTitle = css({
  fontWeight: 'bold',
  minWidth: Constants.WINDOW_TITLE_MIN_WIDTH,
  /* NOPE -- let flexbox do it: maxWidth: Constants.WINDOW_TITLE_MAX_WIDTH, */
  flexGrow: 1
})
export const windowTitleInput = css({
  fontWeight: 'bold',
  minWidth: Constants.WINDOW_TITLE_MIN_WIDTH,
  flexGrow: 1
})
export const spacer = css({
  // backgroundColor: 'red', // for debugging
  // height: 8, // for debugging
  flex: 1
})
export const favIcon = css({
  width: 16,
  height: 16,
  marginRight: 3,
  flex: 'none'
})
export const favIconClosed = css({
  WebkitFilter: 'grayscale(1)'
})
export const imageButtonClosed = css({
  backgroundColor: colors.closedGray
})
export const tabList = css({
  marginLeft: 0
})
export const simpleTabContainer = css({
  width: 250,
  marginLeft: 8,
  marginRight: 8,
  paddingLeft: 4,
  paddingRight: 4,
  paddingTop: 4,
  paddingBottom: 4,
  border: '1px solid #bababa',
  borderRadius: 3
})
export const tabWindowFocused = css({
  boxShadow: '0px 0px 5px 2px #7472ff'
})
export const tabWindow = css({
  border: '1px solid #bababa',
  borderRadius: 3,
  marginBottom: 8,
  minWidth: Constants.WINDOW_MIN_WIDTH,
  maxWidth: Constants.WINDOW_MAX_WIDTH,
  display: 'flex',
  flexDirection: 'column'
})
export const expandablePanel = css({
  width: '100%',
  position: 'relative',
  minHeight: Constants.WINDOW_HEADER_HEIGHT,
  overflow: 'hidden'
})
export const dialogInfoContents = css({
  marginLeft: 10,
  marginTop: 4,
  marginBottom: 0
})

export const headerCheckboxInput = css({})
export const dialogButtonRow = css({
  display: 'flex',
  alignItems: 'center',
  flexShrink: 0,
  marginRight: 22
})
export const centerContents = css({
  margin: 'auto'
})

// Note explicit global css class name windowHeaderHoverContainer there
// Due to limitation of nested class selectors with composition;
// see https://emotion.sh/docs/nested for more info.
export const headerHoverVisible = css`
  visibility: hidden;
  .windowHeaderHoverContainer:hover & {
    visibility: visible;
  }
`

export const closeButtonBaseStyle = css`
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
