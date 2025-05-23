/*
 * Demo documentation for the new TabPreview functionality
 * 
 * Features implemented:
 * 
 * 1. Properly sized chevron button (20x20px) appears to the left of FavIcon when hovering on TabItem
 * 2. Clicking the icon toggles between expanded/collapsed states
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
 * - Button size matches other icon buttons (bookmark, close)
 * - No extra spacing when preview is collapsed
 * - Font sizes increased for better readability:
 *   - Main font: 0.85rem
 *   - Description: 0.8rem  
 *   - Meta info: 0.75rem
 * - Padding and margins only applied when expanded
 * 
 * Mock API provides sample data for common domains:
 * - github.com, stackoverflow.com, youtube.com, reddit.com, twitter.com, etc.
 * - Falls back to placeholder for unknown domains
 * - Simulates API delay (300-800ms) for realistic UX
 * 
 * Usage:
 * The feature is automatically available in all TabItemUI components.
 * When hovering over a tab item, you'll see a chevron button appear
 * between the bookmark icon and the favicon. Click it to expand/collapse
 * the preview.
 * 
 * Implementation files:
 * - TabPreview.tsx: The compact preview component
 * - mockPreviewAPI.ts: Mock API with sample data
 * - TabItemUI.tsx: Modified to include expand/collapse functionality
 * 
 * To replace with real API:
 * Replace the fetchPreviewData function in mockPreviewAPI.ts with your
 * actual OpenGraph API implementation.
 */

export default null; // This is just documentation