# TODO

X Modal dialog for saving a tab window

- Fix tab window sort order: Focused Window, Open Windows (alphabetical by title), Saved (closed) Windows

- review actions.js with tabWindowStore.js.  Make sure every action has the right corresponding entry points in TabWindowStore, with correct change notifications.

- Mark all the handleChromeXXX methods in TabWindowStore as deprecated (or just remove)

- Try to determine if the calls to TabWindow.getTabItems are expensive and figure out if there's a way we can
  lazily cache them

- Finish moving to inline styles -- delete most / all of tabman.css !

- Try to set overflow:'hidden' on body when displaying modal to prevent scrolling

- Instead of single listener reg, using port/disconnected technique to GC popup view listener:
  http://stackoverflow.com/questions/15798516/is-there-an-event-for-when-a-chrome-extension-popup-is-closed

- BUG: Revert causes window to temporarily disappear from window list  