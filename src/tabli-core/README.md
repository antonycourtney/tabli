# Tabli-core - Browser-independent core of Tabli Tab Manager

[Tabli](http://www.gettabli.com) is a simple, powerful tab manager for Google Chrome.

![Screenshot of Tabli Popup](http://www.gettabli.com/images/tab-manager.png "Tabli screenshot")

The popup can be used to quickly scroll through all open windows and tabs and switch to or close any open window or tab with a single click.  Tabli also supports saving and restoring sets of tabs.

This is the browser-independent core of Tabli. This directory can be published to npm independently of the
Chrome-specific parts of Tabli.

However, we store this in the main Tabli repository (instead of its own repository) to allow easy use
of `webpack --watch` when building the Chrome extension (our main target) without needing a
full `npm install` step on every source change.

You can learn more about Tabli by reading the [Tabli Intro](http://antonycourtney.github.io/tabli/) or [Usage Guide](http://antonycourtney.github.io/tabli/tabli-usage.html).

# License

This code is distributed under the MIT license, see the LICENSE file for complete information.
