import { setViewTransitionNames } from '../set-view-transition-names';

/* The pagereveal event fires very early. Thus this scripts should load inside the `<head>`

The function sets up eventListeners that look for script elements with a `data-spec` attribute and uses its value to set view transition names. The value is interpreted as a semicolon separated list of `<selector>:<prefix>` pairs. Those pairs are then used to set view transition names by calling setViewTransitionNames().

While the `data-spec` attribute is interpreted on both, when the page is entered and when it is left, the `data-spec-in` and `data-spec-out` attributes are only interpreted when the page is entered and left, respectively. This allows for different view transition names to be set when the page is entered and left thus defining enter and exit animations.
 */
export function setViewTransitionNamesFromScripts() {
	addEventListener('pagereveal', () => {
		document.querySelectorAll('script').forEach((script) => {
			const spec =
				(script.getAttribute('data-spec') ?? '') +
				';' +
				(script.getAttribute('data-spec-in') ?? '');
			spec.split(/\s*;\s*/).forEach((cmd) => {
				const [selector, prefix] = cmd.split(/\s*:\s*/, 2);
				if (prefix !== undefined) setViewTransitionNames(selector, prefix.trim());
			});
		});
	});
	addEventListener('pageswap', () => {
		document.querySelectorAll('script').forEach((script) => {
			const spec =
				(script.getAttribute('data-spec') ?? '') +
				';' +
				(script.getAttribute('data-spec-out') ?? '');
			spec.split(/\s*;\s*/).forEach((cmd) => {
				const [selector, prefix] = cmd.split(/\s*:\s*/, 2);
				if (prefix !== undefined) setViewTransitionNames(selector, prefix.trim());
			});
		});
	});
}
setViewTransitionNamesFromScripts()