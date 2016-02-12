'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _constants = require('./constants');

var Constants = _interopRequireWildcard(_constants);

var _browserConstants = require('./browserConstants');

var BC = _interopRequireWildcard(_browserConstants);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var mkUrl = function mkUrl(relPath) {
  return 'url("' + BC.BROWSER_PATH_PREFIX + relPath + '")';
};

var styles = {
  noWrap: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  // This is the container for a single tabWindow, consisting of its
  // header and tabs:
  tabWindow: {
    border: '1px solid #bababa',
    borderRadius: 3,
    marginBottom: 8,
    maxWidth: 345,
    display: 'flex',
    flexDirection: 'column'
  },
  tabWindowTile: {
    width: 270,
    maxWidth: 270,
    height: 180,
    maxHeight: 180,
    margin: 10
  },
  tabWindowSelected: {
    boxShadow: '0px 0px 5px 2px #7472ff'
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
  tabItemHover: {
    // backgroundColor: '#dadada'
    borderTop: '1px solid #cacaca',
    borderBottom: '1px solid #cacaca'
  },
  text: {
    fontSize: 12,
    marginTop: 'auto',
    marginBottom: 'auto',
    marginLeft: 3
  },
  tabTitle: {
    width: 275,
    maxWidth: 275
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
  windowExpand: {
    WebkitMaskImage: mkUrl('images/triangle-small-4-01.png'),
    backgroundColor: '#606060'
  },
  windowCollapse: {
    WebkitMaskImage: mkUrl('images/triangle-small-1-01.png'),
    backgroundColor: '#606060'
  },

  // Hmmm, we use this as a common base for both
  //
  headerButton: {
    outline: 'none',
    border: 'none',
    backgroundColor: 'transparent',
    backgroundRepeat: 'no-repeat',
    width: 16,
    height: 16,
    marginLeft: 1,
    marginRight: 1
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
  spacer: {
    // backgroundColor: 'red', // for debugging
    // height: 8, // for debugging
    flex: 1
  },
  favIcon: {
    width: 16,
    height: 16,
    marginRight: 3
  },
  hidden: {
    visibility: 'hidden'
  },
  visible: {
    visibility: 'visible'
  },
  open: {},
  closed: {
    color: '#979ca0'
  },
  tabManagedButton: {
    WebkitMaskImage: mkUrl('images/status-9.png'),
    backgroundColor: '#7472ff'
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
    width: 13,
    height: 13,
    margin: '3px 3px 3px 3px'
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
  closeButton: {
    WebkitMaskImage: mkUrl('images/interface-77.png'),
    backgroundColor: '#888888'
  },
  closeButtonHover: {
    WebkitMaskImage: mkUrl('images/interface-74.png'),
    backgroundColor: '#000000'
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
    width: 243,
    maxWidth: 243
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
    display: 'flex'
  },
  modalContainer: {
    width: 300,
    position: 'relative',
    zIndex: 10,
    borderRadius: 3,
    background: '#fff',
    margin: 'auto',
    border: '1px solid #bababa',
    display: 'flex',
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
  modalBodyContainer: {
    display: 'flex',
    minHeight: 50,
    flexDirection: 'column'
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
    marginBottom: 10
  },
  windowListSection: {
    borderBottom: '1px solid #bababa',
    paddingLeft: 10,
    paddingRight: 16,
    paddingTop: 10,
    paddingBottom: 4
  },
  windowListSectionHeader: {
    fontWeight: 'bold',
    marginBottom: 5
  },
  popupHeader: {
    width: 350,
    maxWidth: 350,
    height: Constants.POPUP_HEADER_HEIGHT,
    position: 'absolute', // let's try instead of fixed to see if it becomes rel to container
    top: 0,
    background: '#ffffff',
    zIndex: 1,
    borderBottom: '1px solid #bababa',
    paddingLeft: 10,
    paddingRight: 16,
    paddingTop: 4,
    paddingBottom: 4
  },
  popupContainer: {
    // We use absolute positioning at (0,0) so that header/footer will be relative to this
    position: 'absolute',
    top: 0,
    left: 0,
    width: 352,
    maxWidth: 352,
    maxHeight: Constants.POPUP_BODY_HEIGHT + Constants.POPUP_HEADER_HEIGHT + Constants.POPUP_FOOTER_HEIGHT
    /* adding this border is useful for debugging styling issues:
    /* border: '1px solid #bababa' */
  },
  headerContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 5
  },
  popupBody: {
    marginTop: Constants.POPUP_HEADER_HEIGHT,
    marginBottom: Constants.POPUP_FOOTER_HEIGHT,
    maxHeight: Constants.POPUP_BODY_HEIGHT,
    overflow: 'auto'
  },
  popupFooter: {
    width: 350,
    maxWidth: 350,
    height: Constants.POPUP_FOOTER_HEIGHT,
    position: 'absolute',
    bottom: 0,
    background: '#ffffff',
    zIndex: 1,
    borderTop: '1px solid #bababa',
    paddingLeft: 10,
    paddingRight: 16,
    paddingTop: 4,
    paddingBottom: 4,
    fontSize: 11,
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 5
  },
  searchInput: {
    width: 285,
    maxWidth: 285
  },
  summarySpan: {
    marginRight: 5
  },
  alignRight: {
    display: 'flex',
    justifyContent: 'flex-end'
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
};

exports.default = styles;