import { log } from './globals';
import * as RenderCommon from './renderCommon';

/*
 *
 * (rather than the more traditional ondocumentready event)
 * because we observe that Chrome's http cache will not attempt to
 * re-validate cached resources accessed after the load event, and this
 * is essential for reasonable performance when loading favicons.
 *
 * See https://code.google.com/p/chromium/issues/detail?id=511699
 *
 */

async function getPopoutWindowId(): Promise<number> {
    const response = await chrome.runtime.sendMessage({
        action: 'getPopoutWindowId',
    });
    log.debug('getPopoutWindowId: got response: ', response);
    return response.windowId;
}

async function main() {
    /*
    const popoutWindowId = await getPopoutWindowId();
    log.debug('renderPopup: popoutWindowId: ', popoutWindowId);
    if (popoutWindowId !== chrome.windows.WINDOW_ID_NONE) {
        log.debug('popout window found, closing popup');
        window.close();
        chrome.windows.update(popoutWindowId, { focused: true });
    }

    RenderCommon.getFocusedAndRender(false, true);
    */
    /*
     * 14Sep24: Admission of defeat. Popout windows can be closed at any time, and
     * many of Tabli's actions, such as opening saved windows, require a sequence of
     * async actions that won't complete before the popout window is closed by Chrome.
     * The only viable path to addressing this would be to handle all state management
     * in the service worker, and have every UI action result in an asynchronous message
     * to the service worker. This is a huge amount of work, and would require a complete
     * re-architecture of Tabli.
     */
    chrome.runtime.sendMessage({ action: 'showPopout' });
    window.close();
}

main();
