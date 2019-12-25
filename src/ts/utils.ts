import * as Immutable from 'immutable';
import * as log from 'loglevel';
import * as BC from './browserConstants';
import { TabWindow } from './tabWindow';
export const mkUrl = (relPath: string) =>
    'url("' + BC.BROWSER_PATH_PREFIX + relPath + '")';
/**
 * Object merge operator from the original css-in-js presentation
 */

export function merge() {
    var res = {};

    for (var i = 0; i < arguments.length; i++) {
        if (arguments[i]) {
            Object.assign(res, arguments[i]);
        } else {
            if (typeof arguments[i] === 'undefined') {
                throw new Error('m(): argument ' + i + ' undefined');
            }
        }
    }

    return res;
}
/*
 * sort criteria for window list:
 *   open windows first, then alpha by title
 */

export function windowCmp(currentWindowId: number) {
    const cf = (tabWindowA: TabWindow, tabWindowB: TabWindow) => {
        // current window always very first:
        if (tabWindowA.open && tabWindowA.openWindowId === currentWindowId) {
            return -1;
        }

        if (tabWindowB.open && tabWindowB.openWindowId === currentWindowId) {
            return 1;
        } // open windows first:

        if (tabWindowA.open !== tabWindowB.open) {
            if (tabWindowA.open) {
                return -1;
            }

            return 1;
        }

        var tA = tabWindowA.title;
        var tB = tabWindowB.title;
        const ret = tA.localeCompare(tB, navigator.language, {
            sensitivity: 'base'
        });
        return ret;
    };

    return cf;
}
export var isNode = false;

if (typeof process === 'object') {
    if (typeof process.versions === 'object') {
        if (typeof process.versions.node !== 'undefined') {
            isNode = true;
        }
    }
}

// This function creates a new anchor element and uses location
// properties (inherent) to get the desired URL data. Some String
// operations are used (to normalize results across browsers).
// From http://james.padolsey.com/javascript/parsing-urls-with-the-dom/

type ParamsMap = { [key: string]: string };

interface ParsedURL {
    source: string;
    protocol: string;
    host: string;
    port: string;
    query: string;
    params: ParamsMap;
    file: string | null;
    hash: string;
    path: string;
    relative: string | null;
    segments: string[];
}

export function parseURL(url: string): ParsedURL {
    var a = document.createElement('a');
    a.href = url;
    return {
        source: url,
        protocol: a.protocol.replace(':', ''),
        host: a.hostname,
        port: a.port,
        query: a.search,
        params: (() => {
            var ret: ParamsMap = {};
            var seg = a.search.replace(/^\?/, '').split('&');
            var len = seg.length;
            var i = 0;
            var s;

            for (; i < len; i++) {
                if (!seg[i]) {
                    continue;
                }

                s = seg[i].split('=');
                ret[s[0]] = s[1];
            }

            return ret;
        })(),
        file: (a.pathname.match(/\/([^\/?#]+)$/i) || [null, ''])[1],
        // eslint-disable-line
        hash: a.hash.replace('#', ''),
        path: a.pathname.replace(/^([^\/])/, '/$1'),
        // eslint-disable-line
        relative: (a.href.match(/tps?:\/\/[^\/]+(.+)/) || [null, ''])[1],
        // eslint-disable-line
        segments: a.pathname.replace(/^\//, '').split('/') // eslint-disable-line
    };
}

/**
 * drop parameters from an url 
 */
export function baseURL(url: string): string {
    const idx = url.indexOf('?');
    const ret = (idx >= 0) ? url.slice(0, idx) : url;
    return ret;
}

/**
 * chain a sequence of asynchronous actions
 * TODO: Investigate if this can go away with latest iteration of
 * oneRef with awaitableUpdate
 */
export function seqActions(actions: any, seed: any, onCompleted: any) {
    var index = 0;

    function invokeNext(v: any) {
        var action = actions[index];
        action(v, (res: any) => {
            index = index + 1;

            if (index < actions.length) {
                invokeNext(res);
            } else {
                onCompleted(res);
            }
        });
    }

    invokeNext(seed);
}
/**
 * Given an Immutable.Map<K,Num> of candidate matches over a space of key values K,
 * return the unambiguous best match (if any) otherwise null
 *
 */

export function bestMatch<K>(matchMap: Immutable.Map<K, number>): K | null {
    if (matchMap.size === 0) {
        return null;
    }

    const matchSeq = matchMap
        .entrySeq()
        .sortBy(([k, count]) => count)
        .cacheResult();

    const seqCount = matchSeq.count();

    if (seqCount === 1) {
        return matchSeq.get(0)![0];
    }

    const topMatch = matchSeq.get(seqCount - 1);
    const runnerUp = matchSeq.get(seqCount - 2);

    if (topMatch && runnerUp && topMatch[1] > runnerUp[1]) {
        return topMatch[0];
    }

    return null;
}
/*
var CONTEXT_MENU_ID = 99;
var contextMenuCreated = false;

function initContextMenu() {
  var sendToMenuItem = { type: "normal",
                     id: CONTEXT_MENU_ID,
                     title: "Open Link in Existing Window",
                     contexts: [ "link" ]
                    };
  chrome.contextMenus.create( sendToMenuItem, function() {
    contextMenuCreated = true;
  });
}
*/

/*
 * escape table cell for use in Github-Flavored Markdown
 * Since just used on a page title, just rewrite pipes to -s; GFM actually
 * buggy here: https://github.com/gitlabhq/gitlabhq/issues/1238
 */
export function escapeTableCell(s: string | null): string {
    if (s && s.indexOf('|') >= 0) {
        return s.replace(/\|/g, '-');
    }
    if (s != null) {
        return s;
    }
    return '';
}

export function areEqualShallow(a: any, b: any, debug = false): boolean {
    for (let key in a) {
        if (!(key in b) || a[key] !== b[key]) {
            if (debug) {
                log.debug('objects differ at key ', key);
            }
            return false;
        }
    }
    for (let key in b) {
        if (!(key in a)) {
            return false;
        }
    }
    return true;
}

// Set log level based on whether dev or prod:
export function setLogLevel(log: any) {
    const nodeEnv = process.env.NODE_ENV;

    if (nodeEnv === 'development') {
        // more detail, generally:
        log.setLevel('debug');
    } else {
        log.setLevel('info');
    }
}

let cachedIsExtension: boolean | undefined = undefined;

export const inExtension = (): boolean => {
    if (cachedIsExtension === undefined) {
        const app = (chrome as any).app;
        if (app === undefined) {
            return false; // should only happen when testing under jest
        }
        const details = app.getDetails();
        cachedIsExtension = details !== null;
    }
    return cachedIsExtension;
};
