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

```
  RevertModal.js:32 Uncaught TypeError: Cannot read property 'favIconUrl' of null

  2ReactCompositeComponent.js:559 Uncaught TypeError: Cannot read property '_currentElement' of null
```

X Need to clear search field after opening a window or tab.  Current cleared on <Enter> key, but not on mouse click.

- If we switch tabs when a search is active, the window / tab may not be displayed. We'll record that we've scrolled to that window and tab when in fact we haven't.  We should probably force an updateScrollPos() in SelectablePopup when the selection is cleared.

- Text in search box input no longer starts at top of open windows. (? artifact of starting from current open window?)

- * Exception when re-starting Chrome because no current window. Test this.

- * Reverting when we have non-open saved tabs fails in RevertModal.renderItem() because tabItem.openState is null.  Need to check for tabItem.open.

- Opening link from email or external app results in scrolling to wrong window.

- * BUG: When opening a PDF, window has no title.  Revert to URL if possible.
  ( Not reproducible -- have opened some PDFs w/o issue)

- Refactor: CloseButton should probably be its own component, but need to think carefully about how to deal with <container>:hover

- If a Saved Tab is opened twice (duplicate) and one of those tabs is closed, it will stick around in the grayed out / closed state

X Checkbox on closed, saved tabs should be gray

======
TODO before 0.9beta:

X Need to persist whether popout is open or closed and use it on a restart.

- Add release notes inline

- Add command to manifest to open popout

- Need to avoid race condition and not persist anything for close event during reload.
What we have is something like:
   action a = a -> ((St -> St) -> ()) -> ()

What we need is:
   Promise a
   ST s a = s -> (s,a)
   PST s a = Promise (ST s a)
   APST a = PST AppState a
In pst:
   PACT a b = a -> APST b
   someAction a b :: a -> APST b

We should be able compose these serially / sequentially:
  ser :: Pact a b -> Pact b c -> Pact a c

Let's not bother with a return type in the state transformer:
   Promise a
   ST s = s -> s
   PST s = Promise (ST s)
   APST = PST AppState
In pst:
   PACT a = a -> APST
   someAction a b :: a -> APST


X Need to deal better with not having a current window (esp. on startup).  Should
 (Seems to be better about using sensible default value for sizes now...)
  - pick 0th window (if there is one)
  - use "sensible" window width / height if no current window available
  Easy repro: Reload in popout window. (Note: If we have a previously saved "current" window,
  use that instead of updating current)

=======
*** Critical issue, 2May16:

( Update, 3May16: Conjecture is that this was due to laziness of Immutable.Seq, now replaced by Immutable.List ). We'll see if issue recurs.

Seeing regular performance degradation correlated with an exception with a bunch of calls to Iterator.next() on the stack.

Last call we can *see* in the stack is:
actions.js:28, which is in actions.syncChromeWindows:
    cb((state) => state.syncWindowList(windowList));

This is called from SafeCallbackApply, and other stack trace indicates that this is called from renderPopup() in renderCommon.js.

It's worth noting that those lines calls syncStore.setCurrentWindow(currentChromeWindow) and
then do a storeRef.setValue(nextStore); with the result....

Hmmmm.....could we be getting an infinite cascade here?
Or...could we be getting bit by the laziness of Seq?

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
===========

Revisiting Tabli, 8/13/17

Attempting to implement URL de-dup'ing, I've again hit a case where we want to compose multiple independent actions that may update app state in response to a single external event.
(This isn't the first time -- the entire sequence of actions in main() in bgHelper had
 this issue at some point.)

I will probably kludge this for now because the surgery involved would be just too costly.
But my inclination about the right solution is something along the lines of a state monad
and / or Redux Saga.

What we want:
    - Composition of state updates: If we have two independents actions that update the global
      application state, we need to ensure that both state updates are applied (i.e. that
      neither update gets lost).
    - Asynchronous state handling:  We will often need to update state after an asynchronous
      action has been performed.  If the update depends on the current state (which it often
      will), we want to ensure that the state is read *after* the asynchronous action has
      been performed.

How things work now:

From OneRef, we get our hands on an explicit State Updater:

```
  refUpdater: (ref: Ref<A>) => (uf: (A) => A) => A
```

We pass this as an extra argument to all of our actions, for example:

```
  <input ... onChange={() => actions.updateText(item, text, stateRefUpdater)}
```

and then in `actions`, each action explicitly calls stateRefUpdater, like so:

```
export function updateText(item, text, updater) {
  const updatedItem = item.set('text',text)
  updater((state) => state.addItem(updatedItem))
}
```

What I think we want instead is something like a State Monad (SM) for OneRef.
Like a monad, actions would no longer perform the actions directly but instead
return a data structure or thunk that denotes a description of the interleaved
state updates and asynchronous actions to perform.
At the top level of a React event callback we would have a run() method to
execute an action.

So we'd get something like this:

```
  <input ... onChange={() => runAction(actions.updateText(item, text)) }
```
where `runAction` is passed down prop that is `oneref.run` partially applied to
the state ref.

Instead of returning `void`, each action would now have to return a
`state -> state` update function.

Questions:
   - Should wrapped type be: state => state, or (state => (state,a)) ?
   - How does 'async' (or possibly generator functions) fit here?
     It seems somewhat tempting to have an action be an async function that
     returns a State Transformer (state -> state function), but how will
     that work with sequences of async calls in the body of the async
     functions?
     Can actions, which return State Transformers, directly call other actions?
     How do we ensure that we are always operating on the latest state
     after an async call to either a platform API or another action?

------
9/27/17 -- rethinking merging of tabs in the presence of recently closed tabs:

If we support presenting recently closed tabs, we now have all four states:

(open,saved)   -- A tab open to a URL that is saved.
(open,!saved)  -- A tab open to a URL that is not saved.
(!open, saved) -- A bookmark'ed URL in current window that is not currently open.
(!open,!saved) -- A recently closed tab, for an un-saved URL.

Only those in the (!open,!saved) state are candidates to be removed from the tab list.

Tabli currently "merges" open and saved tab items, but the current model is a
bit broken when the same saved tab is open more than once in a window and is
then subsequently closed -- this will result in duplicate entries for the
same URL in the (!open,saved) state.

The right definition of the merge process:
  - We start with:
     - open tabs (from Chrome Window)
     - saved tabs (from Bookmark)
  - We can determine two sets:
     - the set of currently open URLs
     - the set of saved (bookmarked) URLs.
  - Start with all open tabs, and the set of saved URLs for the window.
    Partition into: (open,saved) tabs and (open,!saved)
    These all go in to result set.
  - Now determine:
     - The set of saved URLs that are not currently open:
        savedNotOpenURLs := SavedURLs - OpenURLs
    These go in result set.
  - Finally:
      ClosedUnsavedURLs := RecentlyClosedURLs - SavedURLs     
    These go in result set.
======
Now let's consider the set of events we might have to deal with for a TabWindow, and
  - Close a tab (URL)
  - Open a tab at a specific URL   
  - Un-save a saved tab
  - Save an unsaved tab

Merging tabs is a little tricky because we must:
   - Take all open tabs and join with the saved URLs to determine which tabs are saved.
   - For closed tabs, ensure that we join with saved URLs

...and, although we don't support it today, we should really consider adding
support for events on the bookmark folders.

-----
And then we need to think about ordering of TabItems:

Let's keep it simple:
open tabs before !open tabs
  then: open tabs in tab order
  !open tabs:
    saved before !saved
       saved tabs in bookmark order
       !saved tabs in LRU order

--------
Reflections from awkward implementation challenges, Oct. 5, 2017:

Trying to add suppot for "recently closed" tabs to Tabli raised all sorts of surprisingly thorny implementation questions. Notably:
Where do we put the "last known" favIconUrl?  Or last access time?  
Should this live per-saved-tab, per-window, or global (browser level) keyed by URL?

Much of this leads me to want to store state globally, keyed by URL.
But thinking more about that makes me want to just kill the hierarchy and make a tag-based bookmark system.

Also:  Let's just build a different extension:  Bunnytab.

Bunnytab should be an extension that takes over the New Tab and offers unified search across:
    - Open Tabs
    - Bookmarks
    - History
    - External bookmark sources (like Bunny)
    - Google

------
Notes / TODO porting to emotion.js:

TabItem:
   X Need to recover top/bottom border on hover
   X Audible icon no longer appearing
   X Current does prod behavior for:
      X color of checkbox? (gray)
      X hover color of title text of closed tabs? (gray)
   X Checkbox only on hover on TabItem


TODO:
   - Might be nice to apply a lighten filter on black and white FavIcons for closed tabs
     (github, which is mostly black)
   - Move edit pencil next to title!
