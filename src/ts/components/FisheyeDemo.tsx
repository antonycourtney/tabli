/*
 * Demo showing how to use FisheyeTabItemList as a drop-in replacement for TabItemList
 * 
 * To enable the fisheye effect in FilteredTabWindowUI, simply replace:
 * 
 *   import TabItemList from './TabItemList';
 * 
 * with:
 * 
 *   import TabItemList from './FisheyeTabItemList';
 * 
 * The component has an identical API and will provide the same functionality
 * with the added fisheye magnification effect on mouse hover.
 */

import FisheyeTabItemList from './FisheyeTabItemList';

// The FisheyeTabItemList can be used exactly like TabItemList:
/*
const tabItems = (
    <FisheyeTabItemList
        stateRef={stateRef}
        tabWindow={tabWindow}
        tabs={tabItemsToRender}
        selectedTabIndex={selectedTabIndex}
        expanded={expanded}
        onItemSelected={onItemSelected}
    />
);
*/

export default FisheyeTabItemList;