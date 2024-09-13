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
    const popoutWindowId = await getPopoutWindowId();
    log.debug('renderPopup: popoutWindowId: ', popoutWindowId);
    if (popoutWindowId !== chrome.windows.WINDOW_ID_NONE) {
        log.debug('popout window found, closing popup');
        window.close();
        chrome.windows.update(popoutWindowId, { focused: true });
    }

    RenderCommon.getFocusedAndRender(false, true);
}

main();
