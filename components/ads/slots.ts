/**
 * All AdSense slot IDs in one place.
 * Import the slot you need; never hardcode slot IDs in page files.
 *
 * TODO: replace AD_CLIENT and every slot ID below with your own, once you
 * have your own AdSense account approved. These are placeholders only —
 * the previous values here belonged to a different site's AdSense account
 * and would not work (and should never be reused).
 */

export const AD_CLIENT = 'ca-pub-XXXXXXXXXXXXXXXX'

export const AD_SLOTS = {
  /** Auto-responsive — top of tool/category pages */
  DISPLAY_TOP:     'REPLACE_ME',

  /** In-article fluid — first mid-content placement */
  IN_ARTICLE_1:    'REPLACE_ME',

  /** In-article fluid — second mid-content placement */
  IN_ARTICLE_2:    'REPLACE_ME',

  /** Auto-responsive — bottom of all pages */
  DISPLAY_BOTTOM:  'REPLACE_ME',

  /** In-feed fluid — blog index between article cards */
  IN_FEED:         'REPLACE_ME',

  /** Auto-responsive — homepage / category mid-section */
  MIDDLE_DISPLAY:  'REPLACE_ME',

  /** Autorelaxed banner — sidebar / wide placements */
  BANNER:          'REPLACE_ME',

  /** Multiplex / related content grid */
  MULTIPLEX:       'REPLACE_ME',

  /** Tool details banner — above tool widget */
  TOOL_BANNER_1:   'REPLACE_ME',

  /** Tool details banner 2 — below tool result */
  TOOL_BANNER_2:   'REPLACE_ME',
} as const

export type AdSlotKey = keyof typeof AD_SLOTS
