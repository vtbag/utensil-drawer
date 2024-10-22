declare global {
	interface PageSwapEvent extends Event {
		viewTransition: ViewTransition;
		activation: NavigationActivation;
	}

	type UpdateCallback = undefined | (() => void | Promise<void>);
	type StartViewTransitionParameter
		= UpdateCallback | { types?: string[]; update: UpdateCallback };

	interface Document {
    startViewTransition(param: StartViewTransitionParameter): ViewTransition;
	}
	interface PageRevealEvent extends Event {
		viewTransition: ViewTransition;
	}

	interface WindowEventMap {
		pageswap: PageSwapEvent;
		pagereveal: PageRevealEvent;
	}

	interface NavigationActivation {
		entry: NavigationEntry;
		from: NavigationEntry;
		navigationType: string;
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
	interface Navigation {
		activation: NavigationActivation;
	}
}
export {};
