import { log } from './globals';

import * as RenderCommon from './renderCommon';
import { TabWindow, TabItem, OpenTabState } from './tabWindow';
import TabManagerState from './tabManagerState';
import rawDomains from '../../test-data/top500Domains.json';
import { mkRef, utils as oneRefUtils, StateRef, update } from 'oneref';
import { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } from 'constants';

const domains = rawDomains.domains as Array<string>;

let tabIdCounter = 400;

function makeTabItem(active: boolean) {
    const idx = Math.floor(Math.random() * domains.length);
    const domain = domains[idx];

    const url = 'https://' + domain;

    const title = domain;

    const openTabId = tabIdCounter++;

    const openState = OpenTabState.create({ url, title, openTabId, active });

    const item = TabItem.create({ open: true, openState });

    return item;
}

let windowIdCounter = 9000;
const TABS_PER_WINDOW = 10;

function makeTabWindow() {
    let tabItems: TabItem[] = [];
    for (let i = 0; i < TABS_PER_WINDOW; i++) {
        tabItems.push(makeTabItem(i == 0));
    }
    const openWindowId = windowIdCounter++;

    const tabWindow = TabWindow.create({
        open: true,
        windowType: 'normal',
        openWindowId,
        tabItems,
    });
    return tabWindow;
}

const TAB_WINDOWS = 100;

function makeTabWindows() {
    let tabWindows = [];
    for (let i = 0; i < TAB_WINDOWS; i++) {
        tabWindows.push(makeTabWindow());
    }
    return tabWindows;
}

function renderPage() {
    const tabWindows = makeTabWindows();

    const tPreSync = performance.now();

    // log.info('renderPage: testData: ', testData)

    const emptyWinStore = TabManagerState.create();
    const mockWinStore = emptyWinStore
        .registerTabWindows(tabWindows)
        .set('showRelNotes', false);

    const tPostSync = performance.now();

    log.info('syncing window state took ', tPostSync - tPreSync, ' ms');

    log.info('Created mockWinStore and registered test windows');
    log.info('mock winStore: ', mockWinStore.toJS());
    const storeRef = mkRef(mockWinStore);

    var tPreRender = performance.now();

    // N.B. false last arg to prevent sync'ing current chrome windows
    RenderCommon.renderPopup(storeRef, false, true);

    var tPostRender = performance.now();
    log.info(
        'initial render complete. render time: (',
        tPostRender - tPreRender,
        ' ms)',
    );
}

/**
 * Main entry point to rendering the popup window
 */
function renderTest() {
    // loadTestData(renderPage)
    const nodeEnv = process.env.NODE_ENV;
    if (nodeEnv === 'development') {
        // more detail, generally:
        log.setLevel('debug'); // Enable to see every Chrome event:
    } else {
        log.setLevel('info');
    }
    console.log('log level: ', log.getLevel());
    renderPage();
}

/*
 * Perform our React rendering *after* the load event for the popup
 * (rather than the more traditional ondocumentready event)
 * because we observe that Chrome's http cache will not attempt to
 * re-validate cached resources accessed after the load event, and this
 * is essential for reasonable performance when loading favicons.
 *
 * See https://code.google.com/p/chromium/issues/detail?id=511699
 *
 */
function main() {
    log.info('render test, environment: ', process.env.NODE_ENV);
    // window.onload = renderTest;
    renderTest();
}

main();
