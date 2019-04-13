import * as RenderCommon from './renderCommon';

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
    window.onload = () => RenderCommon.getFocusedAndRender(true);
    window.onfocus = e => {
        document.getElementById('searchBox')!.focus();
    };
}

main();
