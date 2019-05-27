# Manual Testing Notes

This is a script of actions to perform manually in the absence of fully automated UI tests.

- [ ] Switch to an already open window
- [ ] Open a closed, saved window. Verify that window renders as an Open, Saved window (and removed from Closed, Saved list)
- [ ] Close an unsaved window
- [ ] Close a saved window. Verify it returns to Closed, Saved windows.
- [ ] Close a tab
- [ ] Switch to a specific tab in another open window
- [ ] Switch to a specific open tab in current window
- [ ] Navigate away from a saved tab. Verify saved tab appears in "closed" state in window summary.
- [ ] Restore a closed, saved tab.
- [ ] Open new tabs in an Open, Saved window.  Revert to saved state.
- [ ] Save an open, unsaved window with a few tabs. Verify change to saved state in visual summary. Then close and re-open.
- [ ] Save a tab in an existing open, saved window.  Closed and re-open saved window to verify tab was saved.
- [ ] Unsave a tab in an existing, open saved window
- [ ] Unsave a saved window
- [ ] drag and drop to move tabs between windows
