'use client'

export type Mode = 'static' | 'scene'

export const OVERRIDE_KEY = 'office:mode'

/**
 * Runs as a blocking script in <head>, before anything paints.
 *
 * Both versions of the landing page are in the exported HTML — the plain one
 * so that crawlers, screen readers and no-JS visitors get real content, and
 * the scene for everyone else. This picks which one is visible by stamping
 * `data-mode` on <html>; globals.css does the rest.
 *
 * Deciding it here rather than in a React effect is the whole point: an effect
 * runs after first paint, so the visitor sees the plain page appear and then
 * get replaced. With no JavaScript at all, no attribute is set and the plain
 * version is what shows — which is the correct default, not a failure.
 */
export const MODE_SCRIPT = `(function(){try{
var m=localStorage.getItem('${OVERRIDE_KEY}');
if(m!=='scene'&&m!=='static'){
var n=navigator,
 reduce=matchMedia('(prefers-reduced-motion: reduce)').matches,
 save=n.connection&&n.connection.saveData,
 mem=typeof n.deviceMemory==='number'&&n.deviceMemory<4,
 cpu=typeof n.hardwareConcurrency==='number'&&n.hardwareConcurrency<4;
m=(reduce||save||mem||cpu)?'static':'scene';
}
document.documentElement.dataset.mode=m;
}catch(e){document.documentElement.dataset.mode='static';}})();`

/** Flip the visible version and remember the choice. */
export function setMode(mode: Mode): void {
  document.documentElement.dataset.mode = mode
  try {
    window.localStorage.setItem(OVERRIDE_KEY, mode)
  } catch {
    /* private window, blocked storage — the choice just won't persist */
  }
}
