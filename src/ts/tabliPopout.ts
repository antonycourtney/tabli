import { log } from './globals';
import * as RenderCommon from './renderCommon';

/*
 * We *used* to perform our React rendering *after* the load event for the popup
 * by doing
 *   window.onload = () => RenderCommon.getFocusedAndRender(false, false)
 * (rather than the more traditional ondocumentready event)
 * because we observe that Chrome's http cache will not attempt to
 * re-validate cached resources accessed after the load event, and this
 * is essential for reasonable performance when loading favicons.
 *
 * See https://code.google.com/p/chromium/issues/detail?id=511699
 *
 */
function main() {
    try {
        window.onfocus = (e: any) => {
            const elem = document.getElementById('searchBox');
            if (elem) {
                elem.focus();
            }
        };
        RenderCommon.getFocusedAndRender(true, true);
    } catch (e) {
        log.error('tabliPopout: caught exception invoking function: ', e);
        log.error((e as Error).stack);
        throw e;
    }
}

main();
