/*
 * Demo documentation for the new TabPreview functionality
 * 
 * Features implemented:
 * 
 * 1. ExpanderButton component appears to the left of FavIcon when hovering on TabItem
 * 2. Clicking the button toggles between expanded/collapsed states  
 * 3. TabPreview component shows below the TabItem when expanded
 * 4. Smooth animation for expand/collapse transition (0.25s cubic-bezier)
 * 5. Compact spacing - no extra space between items when collapsed
 * 6. Readable font sizes - just slightly smaller than tab title
 * 7. Compact preview showing:
 *    - Preview image (60x45px)
 *    - Description (2 lines max, ellipsis overflow)
 *    - Domain name
 *    - Last access time (formatted as "2m ago", "5h ago", etc.)
 * 
 * UI Improvements:
 * - Uses same ExpanderButton as WindowHeader for visual consistency
 * - No extra spacing when preview is collapsed
 * - Font sizes increased for better readability:
 *   - Main font: 0.85rem
 *   - Description: 0.8rem  
 *   - Meta info: 0.75rem
 * - Padding and margins only applied when expanded
 * 
 * Backend Integration:
 * - Real OpenGraph backend (og-backend/) fetches metadata
 * - Dual-layer caching (server + client) for performance
 * - Graceful fallbacks when backend unavailable
 * - Development server on localhost:3001
 * 
 * Usage:
 * The feature is automatically available in all TabItemUI components.
 * When hovering over a tab item, you'll see an expand/collapse button appear
 * between the bookmark icon and the favicon. Click it to expand/collapse
 * the preview.
 * 
 * Implementation files:
 * - TabPreview.tsx: The compact preview component
 * - ogClient.ts: OpenGraph client with caching
 * - og-backend/: Express.js backend server
 * - TabItemUI.tsx: Modified to include expand/collapse functionality
 * 
 * Development setup:
 * 1. Start backend: cd og-backend && ./start-dev.sh
 * 2. Build extension: npm run build-dev
 * 3. Load extension and enjoy real previews!
 */

export default null; // This is just documentation