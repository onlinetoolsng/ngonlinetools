/**
 * All AdSense slot IDs in one place.
 * Import the slot you need; never hardcode slot IDs in page files.
 *
 * Publisher ID: ca-pub-1119289641389825
 */

export const AD_CLIENT = 'ca-pub-1119289641389825'

export const AD_SLOTS = {
  /** Auto-responsive — top of tool/category/location pages */
  DISPLAY_TOP:     '4198231153',

  /** In-article fluid — first mid-content placement */
  IN_ARTICLE_1:    '4690286797',

  /** In-article fluid — second mid-content placement */
  IN_ARTICLE_2:    '8181708196',

  /** Auto-responsive — bottom of all pages */
  DISPLAY_BOTTOM:  '9751041788',

  /** In-feed fluid — blog index between article cards */
  IN_FEED:         '9025117620',

  /** Auto-responsive — homepage / category mid-section */
  MIDDLE_DISPLAY:  '9010641928',

  /** Autorelaxed banner — sidebar / wide placements */
  BANNER:          '1143238075',

  /** Multiplex / related content grid */
  MULTIPLEX:       '8344942808',

  /** Job/tool details banner — above tool widget */
  TOOL_BANNER_1:   '7253585934',

  /** Job/tool details banner 2 — below tool result */
  TOOL_BANNER_2:   '5940504265',
} as const

export type AdSlotKey = keyof typeof AD_SLOTS
