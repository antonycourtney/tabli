import * as Constants from './constants'
import { mkUrl } from './util'

const selectedBorder = '2px solid #a0a0a0'

const styles = {
  noWrap: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  windowHeader: {
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
  },
  // This is the container for a single tabWindow, consisting of its
  // header and tabs:
  tabWindow: {
    border: '1px solid #bababa',
    borderRadius: 3,
    marginBottom: 8,
    minWidth: Constants.WINDOW_MIN_WIDTH,
    maxWidth: Constants.WINDOW_MAX_WIDTH,
    display: 'flex',
    flexDirection: 'column'
  },
  messageCard: {
    padding: 0
  },
  card: {
    paddingLeft: 16,
    paddingRight: 16,
    paddingBottom: 8
  },
  cardBody: {
    paddingLeft: 16,
    paddingRight: 16
  },
  cardActions: {
    display: 'inline-flex',
    flexDirection: 'row-reverse',
    paddingRight: 16,
    paddingBottom: 16,
    position: 'relative'
  },
  flatButton: {
    border: '0px',
    display: 'inline-block',
    backgroundColor: 'rgba(0,0,0,0)',
    fontFamily: 'Roboto, sans-serif',
    fontSize: 14,
    color: '#4285f4'
  },
  tabWindowTile: {
    width: 270,
    maxWidth: 270,
    height: 180,
    maxHeight: 180,
    margin: 10
  },
  tabWindowSelected: {
    border: selectedBorder
  },
  tabWindowFocused: {
    boxShadow: '0px 0px 5px 2px #7472ff'
  },
  tabItem: {
    height: 20,
    maxHeight: 20,
    paddingLeft: 3,
    paddingRight: 3,
    display: 'flex',
    alignItems: 'center'
  },
  tabItemSelected: {
    backgroundColor: '#dadada'
  },
  tabItemDropOver: {
    borderBottom: '2px solid #333333'
  },
  text: {
    fontSize: 12,
    marginTop: 'auto',
    marginBottom: 'auto',
    marginLeft: 3
  },
  tabTitle: {
    minWidth: Constants.TAB_TITLE_MIN_WIDTH,
    flexGrow: 1
  },
  // for use in revert modal:
  simpleTabTitle: {
    width: Constants.SIMPLE_TAB_TITLE_WIDTH
  },
  expandablePanel: {
    width: '100%',
    position: 'relative',
    minHeight: Constants.WINDOW_HEADER_HEIGHT,
    overflow: 'hidden'
  },
  expandablePanelContentClosed: {
    marginTop: '-999px'
  },
  expandablePanelContentOpen: {
    marginTop: 0
  },
  // Hmmm, we use this as a common base for both
  //
  headerButton: {
    outline: 'none',
    border: 'none',
    backgroundRepeat: 'no-repeat',
    width: 16,
    height: 16,
    marginLeft: 1,
    marginRight: 1,
    flex: 'none'
  },
  dialogButton: {
    outline: 'none',
    border: 'none',
    marginLeft: 4,
    marginRight: 4,
    marginTop: 4,
    marginBottom: 8,
    paddingTop: 6,
    paddingBottom: 6,
    paddingLeft: 12,
    paddingRight: 12,
    borderRadius: 3,
    verticalAlign: 'center',
    display: 'flex',
    fontWeight: 600,
    fontSize: 12,
    textAlign: 'center',
    backgroundColor: '#e0e1e2',
    color: 'rgba(0,0,0,.6)'
  },
  primaryButton: {
    backgroundColor: '#1678c2',
    color: '#fff'
  },
  dialogButtonRow: {
    flexShrink: 0,
    marginRight: 22
  },
  spacer: {
    // backgroundColor: 'red', // for debugging
    // height: 8, // for debugging
    flex: 1
  },
  favIcon: {
    width: 16,
    height: 16,
    marginRight: 3,
    flex: 'none'
  },
  favIconClosed: {
    WebkitFilter: 'grayscale(1)'
  },
  hidden: {
    visibility: 'hidden'
  },
  visible: {
    visibility: 'visible'
  },
  open: {
  },
  closed: {
    color: '#979ca0'
  },
  tabManagedButton: {
    WebkitMaskImage: mkUrl('images/Status-9.png'),
    backgroundColor: '#7472ff',
    paddingLeft: '0px',
    paddingRight: '0px',
    width: '16px',
    marginLeft: '0px',
    marginRight: '0px',
    flex: 'none'
  },
  imageButtonClosed: {
    backgroundColor: '#979ca0'
  },
  logoImage: {
    width: 24,
    height: 24,
    backgroundImage: mkUrl('images/logoImage.png'),
    /* backgroundColor: '#358194', */
    marginRight: 8
  },
  audibleIcon: {
    WebkitMaskImage: mkUrl('images/Multimedia-64.png'),
    backgroundColor: '#505050'
  },
  emptyFavIcon: {
    width: 18,
    marginRight: 3,
    WebkitMaskImage: mkUrl('images/Files-26.png'),
    backgroundColor: '#969696'
  },
  /* checkboxes seems to obey width and height, but ignore padding
   * so we'll hack margin instead.
   */
  tabCheckItem: {
    width: 10,
    height: 13,
    margin: '3px 3px 3px 3px',
    flex: 'none'
  },
  windowManagedButton: {
    WebkitMaskImage: mkUrl('images/Status-9.png'),
    backgroundColor: '#7472ff'
  },
  revertButton: {
    WebkitMaskImage: mkUrl('images/chevron-double-mix-1-01.png'),
    backgroundColor: '#7472ff',
    marginRight: '20px'
  },
  helpButton: {
    color: '#7472ff'
  },
  tabList: {
    marginLeft: 0
  },
  tileTabContainer: {
    overflow: 'auto'
  },
  spanClosed: {
    color: '#979ca0'
  },
  activeSpan: {
    fontWeight: 'bold'
  },
  windowTitle: {
    fontWeight: 'bold',
    minWidth: Constants.WINDOW_TITLE_MIN_WIDTH,
    /* NOPE -- let flexbox do it: maxWidth: Constants.WINDOW_TITLE_MAX_WIDTH, */
    flexGrow: 1
  },
  windowTitleInput: {
    fontWeight: 'bold',
    minWidth: Constants.WINDOW_TITLE_MIN_WIDTH,
    flexGrow: 1
  },
  modalTitle: {
    fontWeight: 'bold',
    paddingLeft: 7,
    maxWidth: 243
  },
  headerCheckBox: {
    width: 13,
    height: 13
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    background: 'rgba(0,0,0,0.6)',
    zIndex: 5,
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'column'
  },
  modalContainer: {
    minWidth: 300,
    maxWidth: 480,
    maxHeight: '80%',
    position: 'relative',
    zIndex: 10,
    borderRadius: 3,
    background: '#fff',
    margin: 'auto',
    border: selectedBorder,
    flexGrow: 0,
    display: 'flex',
    flexDirection: 'column'
  },
  modalBodyContainer: {
    display: 'flex',
    minHeight: 50,
    maxHeight: Constants.MODAL_BODY_MAX_HEIGHT,
    overflow: 'auto',
    flexDirection: 'column'
  },
  simpleTabContainer: {
    width: 250,
    marginLeft: 8,
    marginRight: 8,
    paddingLeft: 4,
    paddingRight: 4,
    paddingTop: 4,
    paddingBottom: 4,
    border: '1px solid #bababa',
    borderRadius: 3
  },
  centerContents: {
    margin: 'auto'
  },
  dialogInfo: {
    borderBottom: '1px solid #bababa',
    paddingLeft: 3
  },
  dialogInfoContents: {
    marginLeft: 10,
    marginTop: 4,
    marginBottom: 0
  },
  windowListSection: {
    borderBottom: '1px solid #bababa',
    paddingLeft: 12,
    paddingRight: 24,
    paddingTop: 10,
    paddingBottom: 4,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch'
  },
  windowListSectionHeader: {
    minWidth: Constants.WINDOW_MIN_WIDTH,
    maxWidth: Constants.WINDOW_MAX_WIDTH,
    fontWeight: 'bold',
    marginBottom: 5
  },
  // entire popup window container, including modals:
  popupOuter: {
    minWidth: 352,
    width: '100%',
    height: '100%'
  /* adding this border is useful for debugging styling issues: */
    // border: '1px solid #bababa'
  },
  // inner popup container, consisting of just header,body and footer:
  popupInner: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    flexWrap: 'nowrap'
  },
  popupHeader: {
    minWidth: 350,
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    height: Constants.POPUP_HEADER_HEIGHT,
    background: '#ffffff',
    borderBottom: '1px solid #bababa',
    padding: 0,
    flex: '0 0 auto'
  },
  popupBody: {
    minHeight: Constants.POPUP_BODY_HEIGHT,
    position: 'relative',
    overflow: 'auto',
    flex: '1 1 auto'
  },
  popupFooter: {
    minWidth: 350,
    height: Constants.POPUP_FOOTER_HEIGHT,
    background: '#ffffff',
    borderTop: '1px solid #bababa',
    paddingLeft: 10,
    paddingRight: 16,
    paddingTop: 4,
    paddingBottom: 4,
    fontSize: 11,
    flex: '0 0 auto',
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    margin: 0
  },
  summarySpan: {
    marginRight: 5
  },
  alignRight: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center'
  },
  tabTileContainer: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  renderTestContainer: {
    position: 'absolute',
    top: 50,
    left: 200,
    width: 400,
    height: 700,
    border: '1px solid #ff0000'
  }
}

export default styles
