# TODO

X Modal confirmation dialog before reverting a saved window

- Need a way to close a tab from the keyboard  (DEL?  Shift-Del? Ctrl-Del? )

- Need a button on top to link to help (usage manual)

========= After 0.8.2:

- Some other key sequence (Ctrl-/ maybe? ctrl-o ?) should toggle expand on closed, saved windows

- Try to cache FavIcons of windows when opened and use them for closed tabs

- Try to set overflow:'hidden' on body when displaying modal to prevent scrolling

- Carol feature req:  Status bar showing numbers of Open Windows and Tabs (and maybe Saved winbows?)

- KM req: Audible indicator! See "audible" in Tabs API

- Don't show close button for closed windows

- Need a tabWindow test for what happens when we duplicate a tab with the same URL

----- done:

X Need a basic quick reference Help page with keyboard shortcuts

X Need an Introduction / Quick Start page

X PgDn (Ctrl-Down, Ctrl-Up) should move to next/prev window

X Arrow keys should move a whole window when window not expanded

X Check out what's going on with Medium.com favicon -- seems to be smaller than 16x16; make sure we had to fixed size. Tabs from Medium appear to be misaligned

X More layout jank: We seem to have different sizes for the checkbox input and the checkbox icon for bookmarked tabs. Not enough paddingRight on checkbox input -- runs in to favIcon

X - Add event handler for check box for bookmarking / un-bookmarking a tab

X - Need to adjust scroll position when using arrow keys

X - Should be able to open a saved window from keyboard

X Modal dialog for saving a tab window

X Fix tab window sort order: Focused Window, Open Windows (alphabetical by title), Saved (closed) Windows

Performance:
X  - Using react Perf tools we seem to be spending considerable time in HeaderButton.  Let's get a consistent, reproducible performance test
     to verify this by taking a snapshot of winStore    

X - restoring a closed saved tab not working

X PERFORMANCE:  It turns out that TabWindow.get title() is getting called quite a lot...why??  Is it during sorting during render?  That would make sense.  Can we somehow calculate this field lazily so that we won't have to recalc it?

X review actions.js with tabWindowStore.js.  Make sure every action has the right corresponding entry points in TabWindowStore, with correct change notifications.

X Mark all the handleChromeXXX methods in TabWindowStore as deprecated (or just remove)

X Try to determine if the calls to TabWindow.getTabItems are expensive and figure out if there's a way we can lazily cache them. Don't want to be doing sort() operations on mouse motion.

X Finish moving to inline styles -- delete most / all of tabman.css !

X Instead of single listener reg, using port/disconnected technique to GC popup view listener:
  http://stackoverflow.com/questions/15798516/is-there-an-event-for-when-a-chrome-extension-popup-is-closed

X BUG: Revert causes window to temporarily disappear from window list  


=======
- Re-run manual test of saving windows (changes around focused handling)

- Issue with selected tab and keyboard navigation: No longer starts with tab in "Current Window" or able to select Current Window tabs via up / down keys

- Need to transfer focus to Search... box on click in popout

- Need a way to cancel search (essential for popout)

- window.onRemoved or tabs.onRemoved handler behaving incorrectly on saved tabs -- re-opening a saved window after tabs are closed only shown New Tab.

- Something going very wrong with focus indication -- seeing multiple tabs indicated as having focus.
(...clue: I def see this happening when opening links from TweetDeck.)
hypothesis: updateTabItem() getting called to set active to true, without calling setActiveTab().
Potential easy fix: call setActiveTab() if tab to be updated is active.

- Should change TabItem.url into a property accessor

- on windowFocus change should set selectedWindow to focused window and selected tab to active tab

- Should change scroll behavior to only adjust scroll position if body not 100% visible

- FavIcons now missing in revert modal.

- Getting error with bad argument when performing revert

- Improve tab sorting: Use tab index

- When opening windows from popout, need to use size of last normal window
  X grab width and height in TabWindow
  X pass last focused window to actions.activateTab and actions.openWindow
  - If there is no current window for pulling width and height, should use open window 0

- Searching for "fac" in popout seems to skip Facebook saved window when using arrow keys to navigate...

X FavIcon / title alignment looks off in Revert Dialog

X Keep track of popup window so we can close it on restart

X Reset search field on Enter or ESC

- Format source using 'standard' 
https://www.npmjs.com/package/standard

X  Right now we transfer selection to the active window and active tab when we get a window focus change event.  For consistency we should also transfer when we get an active tab change event.

X BUG: New Tab doesn't seem to change title / URL. Repro: click on new tab on tab bar, type any URL.
Conjecture:  Need to handle 'tab replaced' event

X(?) Getting exceptions in revert modal:
  RevertModal.js:32 Uncaught TypeError: Cannot read property 'favIconUrl' of null
  
  2ReactCompositeComponent.js:559 Uncaught TypeError: Cannot read property '_currentElement' of null

- Need to clear search field after opening a window or tab

- If we switch tabs when a search is active, the window / tab may not be displayed. We'll record that we've scrolled to that window and tab when in fact we haven't.  We should probably force an updateScrollPos() in SelectablePopup when the selection is cleared.

- Text in search box input no longer starts at top of open windows. (? artifact of starting from current open window?)

- * Exception when re-starting Chrome because no current window. Test this.

- * Reverting when we have non-open saved tabs fails in RevertModal.renderItem() because tabItem.openState is null.  Need to check for tabItem.open.

- Opening link from email or external app results in scrolling to wrong window.



========
Attempt to debug leakTest with babel-node and node-inspector:

*** THIS DID NOT WORK:
1. Start node process with --debug:
# Note that for ordinary node, we'd do:
# node --debug-brk=8010 test.js
$ babel-node --debug-brk=8010 --presets es2015,react ./test/leakTest.js

2. Start node-inspector:
$ node-inspector --web-host 0.0.0.0

3. visit URL from step 2:
http://127.0.0.1:8080/?ws=127.0.0.1:8080&port=8010

What worked (kind of) was running node directly via tests/leakTestWrap.

