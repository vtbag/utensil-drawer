import { setSelectedViewTransitionNames } from '../set-view-transition-names';

/* This scripts must be loaded inside the `<head>` of a page.

The function sets up eventListeners that look for script elements with a `data-vtbag-decl` attribute and uses its value to set view transition names. The value is interpreted as a semicolon separated list of `<selector> '=' <prefix>` pairs. Those pairs are then used to set view transition names.

See setSelectedViewTransitionNames() for additional information. When `~=` is used instead of `=`, setSelectedViewTransitionNames() is called with `weak = true`.

Do not use '=' or ';' in <selector> or <prefix> values

While the `data-vtbag-decl` attribute is interpreted for the old and for the new page, the `data-vtbag-decl-new` and `data-vtbag-decl-old` attributes are only interpreted when the page is entered and left, respectively. This allows for different view transition names to be set for defining different enter and exit animations when the page is the source or the target page of a navigation.

The elements are also labeled after the DOM is initially loaded but will be updated (extended) on pageswap.

This behavior enables you to access the view transition names before the swap event, e.g. in a click handler, even after a full page reload.
 */
export function setViewTransitionNamesFromScripts() {
	addEventListener('DOMContentLoaded', set('old'));
	addEventListener('pagereveal', set('new'));
	addEventListener('pageswap', set('old'));
}
function set(what: 'new' | 'old') {
	return () => {
		document.querySelectorAll('script').forEach((script) => {
			const spec =
				(script.getAttribute('data-vtbag-decl') ?? '') +
				';' +
				(script.getAttribute(`data-vtbag-decl-${what}`) ?? '');
			spec.split(/\s*;\s*/).forEach((cmd) => {
				let [selector, prefix] = cmd.split(/=/, 2);
				if (prefix !== undefined) {
					const weak = selector.endsWith('~');
					weak && (selector = selector.slice(0, -1));
					setSelectedViewTransitionNames(selector.trim(), prefix.trim(), !weak);
				}
			});
		});
	};
}
setViewTransitionNamesFromScripts();
