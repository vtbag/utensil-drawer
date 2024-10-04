declare global {
	interface PageSwapEvent extends Event {
		viewTransition: ViewTransition;
	}

	interface PageRevealEvent extends Event {
		viewTransition: ViewTransition;
	}

	interface WindowEventMap {
		pageswap: PageSwapEvent;
		pagereveal: PageRevealEvent;
	}

	interface AnimationEffect {
		target: HTMLElement;
		pseudoElement?: string;
		getKeyframes: () => Keyframe[];
	}

	interface ViewTransition {
		types: Set<string>;
	}
	interface Window {
		navigation: Navigation;
	}
}
export {};
