# TODO

- Modal confirmation dialog before reverting a saved window

- Need a way to close a tab from the keyboard  (DEL?  Shift-Del? Ctrl-Del? )

- Need a button on top to link to help

- Need a basic quick reference Help page with keyboard shortcuts

- Need an Introduction / Quick Start page

========= After 0.8.2:

- Some other key sequence (Ctrl-/ maybe? ctrl-o ?) should toggle expand on closed, saved windows

- Try to cache FavIcons of windows when opened and use them for closed tabs

- Try to set overflow:'hidden' on body when displaying modal to prevent scrolling

- Carol feature req:  Status bar showing numbers of Open Windows and Tabs (and maybe Saved winbows?)

- KM req: Audible indicator! See "audible" in Tabs API

- Don't show close button for closed windows

- Need a tabWindow test for what happens when we duplicate a tab with the same URL

----- done:

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
