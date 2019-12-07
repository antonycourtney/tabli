import * as React from 'react';
import { refContainer, StateRef } from 'oneref';
import { PopupBaseProps, Popup } from './components/Popup';
import * as log from 'loglevel';
import { resetServerContext } from 'react-beautiful-dnd';
import { CacheProvider } from '@emotion/core';
import { renderToString } from 'react-dom/server';
import createEmotionServer from 'create-emotion-server';
import { renderStylesToString } from 'emotion-server';
import createCache from '@emotion/cache';
import TabManagerState from './tabManagerState';

const cache = createCache();
const { extractCritical } = createEmotionServer(cache);

export const ssrRender = (stateRef: StateRef<TabManagerState>): string => {
    console.log('in ssr_render');

    const [App, listenerId] = refContainer<TabManagerState, PopupBaseProps>(
        stateRef,
        Popup
    );
    log.debug('refContainer listener id: ', listenerId);

    // setup react-beautiful-dnd for SSR:
    resetServerContext();

    let element = (
        <CacheProvider value={cache}>
            <App isPopout={true} noListener={true} />
        </CacheProvider>
    );

    // do the SSR:
    // const popupHTML = renderStylesToString(renderToString(element));
    let { html, css, ids } = extractCritical(renderToString(element));

    // TODO: de-register listener...
    console.log('SSR: popupHTML: ', { html, css, ids });

    return html;
};
