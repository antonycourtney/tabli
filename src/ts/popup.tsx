'use strict';

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import TabliPopup from './components/TabliPopup';

function doRender() {
  const parentNode = document.getElementById('windowList-region');
  const appElement = <TabliPopup message="Tabli" />;
  const appComponent = ReactDOM.render( appElement, parentNode );   
}

function main() {
  window.onload = doRender;
}

main();