import { configure } from '@storybook/react';

function loadStories() {
  require('../src/js/stories');
}

configure(loadStories, module);
