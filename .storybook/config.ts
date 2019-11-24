/*
 * Note: Intent of including Bootstrap was just to pull in some
 * text formatting styles for Release Notes.
 * But it turns out there is a global setting that overrides
 * user agent styling for margin on checkbox input selectors, and it
 * turns out we depend on that...should fix.
 */
import '../build/css/bootstrap.min.css';
import '../build/css/tabli.css';
import { configure } from '@storybook/react';

// automatically import all files ending in *.stories.js
const req = require.context('../stories', true, /\.stories\.tsx$/);
function loadStories() {
    req.keys().forEach(filename => req(filename));
}

configure(loadStories, module);
