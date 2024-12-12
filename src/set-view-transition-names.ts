export function setViewTransitionNames(selector: string, prefix: any) {
	const elements = document.querySelectorAll<HTMLElement>(selector);
	elements.forEach((element, idx, array) => {
		element.style.viewTransitionName = `${prefix}${array.length > 1 ? idx : ''}`;
	});
}

export function setOldPageViewTransitionNames(selector: string, prefix: any) {
	addEventListener('pageswap', () => setViewTransitionNames(selector, prefix));
}

// The pagereveal event fires very early. Thus scripts using this code should load inside the <head>
export function setNewPageViewTransitionNames(selector: string, prefix: any) {
	addEventListener('pagereveal', () => setViewTransitionNames(selector, prefix));
}
