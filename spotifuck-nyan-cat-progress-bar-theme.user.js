// ==UserScript==
// @name         Spotifuck - Nyan Cat Progress Bar (Adapted from Spicetify)
// @icon         https://i.ibb.co/YF1nLPfK/2eca7229-ca6a-4ad6-8653-b80a6a0f8586.png
// @namespace    https://github.com/kitbodega/Nyan-Cat-Progress-Bar-Port
// @version      1.0.0.fork
// @description  Nyan Cat Progress Bar Theme for Spotify
// @author       kitbodega, Myst1cX (fork)
// @match        https://open.spotify.com/*
// @grant        GM_addStyle
// @run-at       document-start
// @homepageURL  https://github.com/Myst1cX/Nyan-Cat-Progress-Bar-Port
// @supportURL   https://github.com/Myst1cX/Nyan-Cat-Progress-Bar-Port/issues
// @updateURL    https://raw.githubusercontent.com/Myst1cX/Nyan-Cat-Progress-Bar-Port/main/spotifuck-nyan-cat-progress-bar-theme.user.js
// @downloadURL  https://raw.githubusercontent.com/Myst1cX/Nyan-Cat-Progress-Bar-Port/main/spotifuck-nyan-cat-progress-bar-theme.user.js
// ==/UserScript==

// COMPATIBILITY WITH LYRICS+ SCRIPT:
// a) Lyrics+ popup seekbar support (pairs with Lyrics+ v17.51's rebuilt,
// native-style progress bar - see that script's RESOLVED (17.51) entry). Lyrics+
// used to have a flat, always-green seekbar; 17.51 replaced it with one that mimics
// Spotify's own bar (white/green/gray three-state coloring, hover reveal, seek-
// preview tooltip, thumb hidden until interaction). That element
// (#lyrics-plus-progress) sits completely outside this script's normal reach: it
// isn't a [data-testid="progress-bar-background"] div stack like the native/volume
// bars, it's a single native <input type="range"> that Lyrics+ repaints every frame
// via inline style.background - a gradient with hard color-stop pairs. Any CSS
// written for it has to win against that inline style on every repaint, and any
// "trail" effect needs its own percent tracking, since there's no separate div for
// Spotify (or Lyrics+) to resize the way applyRainbowToFill() relies on for the
// native/volume bars.
// b) Fix: added a #lyrics-plus-progress rule block using !important throughout - the
// only way to beat a same-property inline style short of Lyrics+ itself using
// !important, which it doesn't - built as a two-layer background-image: RAINBOW on
// top, sized to a --nyan-fill custom property and left-anchored/no-repeat so it
// only paints the played portion, with BG_PATTERN underneath tiling across the full
// width so the unplayed remainder still shows stars - the same trail-plus-stars
// look as the native bar. Since Lyrics+ sets .value via JS property assignment (not
// setAttribute), the existing fillObserver MutationObserver never sees playback
// advance on this element, so a dedicated setInterval(applyNyanToLyricsPlus, 200)
// reads value/max directly off the input and republishes --nyan-fill, independent
// of the observer entirely. Also mirrored the native bar's --progress-bar-height
// thicken-on-hover behavior (8px -> 12px on :hover/:focus) since Lyrics+'s track is
// otherwise a fixed 4px, with the thumb's margin-top recalculated for both heights
// (-6.5px resting, -4.5px hovered) so the cat stays centered through the
// transition. The thumb itself was swapped to the same SLIDER_IMG cat gif via
// ::-webkit-slider-thumb/::-moz-range-thumb and forced to opacity:1 (Lyrics+ hides
// its thumb until hover by default), so the cat is always visible like on the
// native bar. Entirely additive and self-gating: if Lyrics+ isn't installed or its
// seekbar isn't open, #lyrics-plus-progress doesn't exist and every rule/poll here
// is a no-op.

// VOLUME BAR FIX ON TOP OF ORIGINAL SCRIPT:
// Song progress bar worked fine. Volume slider showed the cat + stars (right
// side) correctly because those come from static CSS on [data-testid="progress-bar-
// background"], which matches EVERY bar on the page. But the rainbow fill (left of
// cat) is set by JS in applyRainbowToFill(), which used document.querySelector(...)
// — singular, so it only ever grabbed the FIRST matching element in the DOM (the
// song bar) and tagged its inner div data-nyancat="1" for the rainbow rule. The
// volume bar's inner div never got that attribute, so it kept Spotify's default
// green/white fill. Changed querySelector -> querySelectorAll + forEach so every
// bar gets tagged, and added a static CSS rule under [data-testid="volume-bar"] as
// a backup in case the DOM structure changes again.

(function() {
    'use strict';

    if (location.hostname !== 'open.spotify.com') return;

    const BG_PATTERN = "url('data:image/gif;base64,R0lGODlhMAAMAIAAAAxBd////yH/C05FVFNDQVBFMi4wAwEAAAAh+QQECgAAACwAAAAAMAAMAAACJYSPqcvtD6MKstpLr24Z9A2GYvJ544mhXQmxoesElIyCcB3dRgEAIfkEBAoAAAAsAQACAC0ACgAAAiGEj6nLHG0enNQdWbPefOHYhSLydVhJoSYXPO04qrAmJwUAIfkEBAoAAAAsBQABACkACwAAAiGEj6nLwQ8jcC5ViW3evHt1GaE0flxpphn6BNTEqvI8dQUAIfkEBAoAAAAsAQABACoACwAAAiGEj6nLwQ+jcU5VidPNvPtvad0GfmSJeicUUECbxnK0RgUAIfkEBAoAAAAsAAAAACcADAAAAiCEj6mbwQ+ji5QGd6t+c/v2hZzYiVpXmuoKIikLm6hXAAAh+QQECgAAACwAAAAALQAMAAACI4SPqQvBD6NysloTXL480g4uX0iW1Wg21oem7ismLUy/LFwAACH5BAQKAAAALAkAAAAkAAwAAAIghI8Joe0Po0yBWTaz3g/z7UXhMX7kYmplmo0rC8cyUgAAIfkEBAoAAAAsBQAAACUACgAAAh2Ejwmh7Q+jbIFZNrPeEXPudU74IVa5kSiYqOtRAAAh+QQECgAAACwEAAAAIgAKAAACHISPELfpD6OcqTGKs4bWRp+B36YFi0mGaVmtWQEAIfkEBAoAAAAsAAAAACMACgAAAh2EjxC36Q+jnK8xirOW1kavgd+2BYtJhmnpiGtUAAAh+QQECgAAACwAAAAALgALAAACIYSPqcvtD+MKicqLn82c7e6BIhZQ5jem6oVKbfdqQLzKBQAh+QQECgAAACwCAAIALAAJAAACHQx+hsvtD2OStDplKc68r2CEm0eW5uSN6aqe1lgAADs=')";
    const SLIDER_IMG = "url('data:image/gif;base64,R0lGODlhIgAVAKIHAL3/9/+Zmf8zmf/MmZmZmf+Z/wAAAAAAACH/C05FVFNDQVBFMi4wAwEAAAAh/wtYTVAgRGF0YVhNUDw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDpDMkJBNjY5RTU1NEJFMzExOUM4QUM2MDAwNDQzRERBQyIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDpCREIzOEIzMzRCN0IxMUUzODhEQjgwOTYzMTgyNTE0QiIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDpCREIzOEIzMjRCN0IxMUUzODhEQjgwOTYzMTgyNTE0QiIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ1M2IChXaW5kb3dzKSI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOkM1QkE2NjlFNTU0QkUzMTE5QzhBQzYwMDA0NDNEREFDIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOkMyQkE2NjlFNTU0QkUzMTE5QzhBQzYwMDA0NDNEREFDIi8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8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')";
    const RAINBOW = "linear-gradient(to bottom, #ff0000 0%, #ff0000 16.5%, #ff9900 16.5%, #ff9900 33%, #ffff00 33%, #ffff00 50%, #33ff00 50%, #33ff00 66%, #0099ff 66%, #0099ff 83.5%, #6633ff 83.5%, #6633ff 100%)";

    function injectBaseCSS() {
        const style = document.createElement('style');
        style.id = 'nyancat-progress';
        style.textContent = `
            [data-testid="progress-bar-background"],
            [data-testid="progress-bar"] > [data-testid="progress-bar-background"] {
                background: ${BG_PATTERN} !important;
            }

            [data-testid="progress-bar-handle"] {
                background: ${SLIDER_IMG} !important;
                width: 34px !important;
                height: 21px !important;
                border: none !important;
                margin-left: -18px !important;
                margin-top: 0px !important;
                visibility: visible !important;
                display: block !important;
                transform: translateY(-50%) scale(0.8);
                border-radius: 0 !important;
                box-shadow: none !important;
                transition: transform 0.1s cubic-bezier(0, 0, 0.2, 1) !important;
                image-rendering: pixelated !important;
                opacity: 1 !important;
            }
            [data-testid="progress-bar-handle"]::after {
                display: none !important;
            }

            [data-testid="progress-bar"] {
                --progress-bar-height: 8px !important;
            }
            [data-testid="progress-bar"]:hover,
            [data-testid="progress-bar"]:focus-within {
                --progress-bar-height: 12px !important;
            }

            [data-testid="progress-bar-background"] {
                transition: height 0.1s cubic-bezier(0, 0, 0.2, 1) !important;
            }

            /* Volume bar fill: static fallback in case JS detection misses it */
            [data-testid="volume-bar"] [data-testid="progress-bar-background"] > div > div {
                background: ${RAINBOW} !important;
                background-size: 100% 100% !important;
            }
            [data-testid="volume-bar"] [data-testid="progress-bar-background"] {
                background-color: rgba(255, 255, 255, 0.1) !important;
            }

            /* Lyrics+ popup seekbar (a native <input type="range">, not a div stack).
               Only matches if the Lyrics+ userscript is installed and its seekbar is
               present, so this is a no-op otherwise. --nyan-fill (the played %) is
               kept in sync by applyNyanToLyricsPlus() below. Rainbow trail layered
               on top of the star pattern, sized to the played portion only, so the
               unplayed remainder still shows stars. !important is required to win
               over Lyrics+'s own inline "background" it sets via JS. */
            #lyrics-plus-progress {
                --nyan-fill: 0%;
                background-image: ${RAINBOW}, ${BG_PATTERN} !important;
                background-size: var(--nyan-fill) 100%, auto 100% !important;
                background-repeat: no-repeat, repeat-x !important;
                background-position: left center, right center !important;
                border-radius: 0 !important;
                height: 8px !important;
                transition: height 0.1s cubic-bezier(0, 0, 0.2, 1) !important;
            }
            #lyrics-plus-progress:hover,
            #lyrics-plus-progress:focus {
                height: 12px !important;
            }
            #lyrics-plus-progress::-webkit-slider-thumb {
                background: ${SLIDER_IMG} !important;
                background-size: contain !important;
                width: 34px !important;
                height: 21px !important;
                margin-top: -6.5px !important;
                border: none !important;
                border-radius: 0 !important;
                box-shadow: none !important;
                opacity: 1 !important;
                image-rendering: pixelated !important;
                transform: scale(0.8) !important;
                transition: margin-top 0.1s cubic-bezier(0, 0, 0.2, 1) !important;
            }
            #lyrics-plus-progress:hover::-webkit-slider-thumb,
            #lyrics-plus-progress:focus::-webkit-slider-thumb {
                margin-top: -4.5px !important;
            }
            #lyrics-plus-progress::-moz-range-thumb {
                background: ${SLIDER_IMG} !important;
                background-size: contain !important;
                width: 34px !important;
                height: 21px !important;
                border: none !important;
                border-radius: 0 !important;
                box-shadow: none !important;
                opacity: 1 !important;
                image-rendering: pixelated !important;
                transform: scale(0.8) !important;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * applyNyanToLyricsPlus()
     * Keeps --nyan-fill (the rainbow trail's width) in sync with the Lyrics+
     * seekbar's own playback position. No-ops if the Lyrics+ popup/seekbar isn't
     * open - that's what makes this "only if enabled".
     */
    function applyNyanToLyricsPlus() {
        const bar = document.getElementById('lyrics-plus-progress');
        if (!bar) return;
        const max = Number(bar.max) || 1;
        const val = Number(bar.value) || 0;
        const pct = Math.max(0, Math.min(100, (val / max) * 100));
        bar.style.setProperty('--nyan-fill', pct + '%');
    }

    const fillRule = document.createElement('style');
    fillRule.id = 'nyancat-fill';

    function applyRainbowToFill() {
        if (!fillRule.sheet) return;
        const bars = document.querySelectorAll('[data-testid="progress-bar-background"]');
        if (!bars.length) return;

        bars.forEach((bg) => {
            const children = bg.children;
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                if (child.dataset.testid === 'progress-bar-handle') continue;
                if (child.style && (child.style.left || child.style.anchorName)) continue;

                const inner = child.querySelector('div');
                if (inner && !inner.dataset.nyancat) {
                    inner.dataset.nyancat = '1';
                    fillRule.sheet.insertRule(
                        `[data-nyancat="1"] { background: ${RAINBOW} !important; }`,
                        fillRule.sheet.cssRules.length
                    );
                }
            }
        });
    }

    function injectAllStyles() {
        if (document.head && !fillRule.parentNode) {
            document.head.appendChild(fillRule);
            applyRainbowToFill();
        }
    }

    if (document.head) {
        injectBaseCSS();
        injectAllStyles();
    } else {
        const obs = new MutationObserver(() => {
            if (document.head) {
                obs.disconnect();
                injectBaseCSS();
                injectAllStyles();
            }
        });
        obs.observe(document.documentElement, { childList: true, subtree: true });
    }

    const fillObserver = new MutationObserver(applyRainbowToFill);
    fillObserver.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(applyRainbowToFill, 2000);
    setTimeout(applyRainbowToFill, 5000);
    setTimeout(applyRainbowToFill, 10000);

    // Lyrics+ sets .value via JS property assignment (not setAttribute), so it
    // never fires a MutationObserver attribute/childList event - poll instead,
    // same cadence as Lyrics+'s own playback sync.
    setInterval(applyNyanToLyricsPlus, 200);
})();
