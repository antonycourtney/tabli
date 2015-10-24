# Tabli - A Chrome Tab Manager

![Screenshot of Tabli Popup](http://antonycourtney.github.io/tabli/screenshots/tabli-screenshot.png "Tabli screenshot")

**Tabli** is a tab manager for Google Chrome that provides fast switching between browser windows and tabs even when you have dozens of windows and tabs open, and the ability to save and restore windows.

The core functionality of Tabli is a popup window that shows a searchable, scrollable view of the browser windows and tabs you currently have open. You can navigate this view using the keyboard or mouse and switch to or close any window or tab with a mouse click or keypress. 

Tabli also supports saving and restoring sets of tabs as saved windows. This is useful for organizing and navigating reference documentation and other web sites you visit frequently.

Tabli has extensive [keyboard shortcuts](http://antonycourtney.github.io/tabli/tabli-usage.html#keyboard-navigation), enabling you to quickly and efficiently navigate through your tabs in a few keystrokes without your fingers ever leaving the keyboard.

### How to Get It

Tabli is currently available as a pre-release to help me get feedback and identify bugs before
I do a broader public release.  *Please do not publicly post links or Tweets to this page or
the (unlisted) Chrome web store page for Tabli during this pre-release testing period.*

Because this is still a pre-release I'd like to keep track of who is helping me test so that I can let you know of any critical bug fixes or new releases.  If you want access to this pre-release all I ask is that you join the tabli-users mailing list. This will be an extremely low-volume list that I will use strictly for Tabli-related announcements. **I promise I will not use this list for any third party advertising and will not sell, share or disclose your email address to anyone.**

**[Click here to subscribe to the tabli-users mailing list.](http://eepurl.com/bACAK1)**

You will receive a link to the (unlisted) Tabli install page on the Google Chrome Web Store immediately after your list subscription completes.

### How to Use Tabli

#### The Absolute Basics

- Click on the Tabli icon or use the keyboard shortcut (`Ctrl-.` by default) in any Chrome window to activate the popup.
- You can interactively search for a tab or window by typing a few characters (the Search box should have the default focus).
- You can use the up and down arrow keys (`↓` and `↑`) to navigate through the set of tabs or windows. Hold down `Ctrl` (`Ctrl-↓` and `Ctrl-↑`) to move by whole windows.
- Switch to a specific window or tab either by hitting `Enter` on a window or tab selected with the keyboard, or by clicking on any window or tab with the mouse.

For more advanced usage, see the [Usage Guide](http://antonycourtney.github.io/tabli/tabli-usage.html).

### How Much Will It Cost?

Tabli is free to install and use and the [source code is available](https://github.com/antonycourtney/tabli) under a permissive (MIT) license.  

### Privacy Concerns

When installing Tabli, you will see a somewhat scary looking confirmation dialog:

![Screenshot of Tabli permissions](http://antonycourtney.github.io/tabli/screenshots/tabli-permissions.png "Tabli permissions")

I take your privacy very seriously. Tabli uses the above permissions to construct the tab switching dialog and enable you to save and restore tabs. **Tabli runs entirely as an extension in your browser. Tabli does not make any outbound data connections and does not send any data whatsoever to any external application, extension or cloud service.**

### Related Work

There are certainly other tab manager Chrome extensions out there (and certainly many more now than since I first started this side project in early 2014). I wrote Tabli firstly out of frustration with the difficulty of finding a specific tab when I had too many tabs open.  While I've tried several other tab managers, so far none of them really fit the way I wanted to use Chrome.

Tabli was inspired in part by [Project Tab Manager](https://chrome.google.com/webstore/detail/project-tab-manager/iapdnheekciiecjijobcglkcgeckpoia?hl=en), and the design grew out of my experiences using it. The main difference between Tabli and Project Tab Manager is that Tabli provides features for browsing and managing *all* open windows and tabs ( not just saved ones ), and provides a way to quickly revert a saved window to its original state.

### How is it implemented?

Tabli has also proven to be a useful test project for me to learn about and experiment
with a variety of libraries, tools and techniques for front-end web development.  
Tabli has been rewritten almost in its entirety several times to adapt to new tools and 
techniques and as experience has accumulated; I hope to eventually write a blog post or two on these experiences and some of my implementation choices. 

Tabli is implemented as a [Google Chrome Extension](https://developer.chrome.com/extensions) using [React](http://facebook.github.io/react/index.html), [CSS in JS](https://speakerdeck.com/vjeux/react-css-in-js), [Immutable.js](https://facebook.github.io/immutable-js/), [Babel](https://babeljs.io/) and [webpack](https://webpack.github.io/). Somewhat notably, Tabli used the [Flux](http://facebook.github.io/flux/) architecture at one point, but I replaced it with something considerably simpler. 

### Who made Tabli?

Tabli was developed by me, Antony Courtney, as a side project. I'm an independent Computer Scientist and Software Developer based in San Francisco.  You can find me on the web at [antonycourtney.com](http://www.antonycourtney.com) or on Twitter as [@antonycourtney](https://twitter.com/@antonycourtney).

### Keeping in Touch

I welcome your feedback on Tabli!  Please send feedback, questions and bug reports
to `<projectName>-feedback@antonycourtney.com`, where `<projectName>` is `tabli`.  You'll also receive this email address in the confirmation mail when you sign up for the mailing list. 

If you are a developer, please feel free to also [browse the source and follow the project on github](https://github.com/antonycourtney/tabli). I welcome feedback, suggestions and questions on the implementation.