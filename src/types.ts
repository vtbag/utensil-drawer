export type Interceptor = (viewTransition: ViewTransition) => void;
export type Update = (viewTransition?: ViewTransition) => Promise<void> | void;
export type UtensilDrawer = {
	level?: number; // level of the ViewTransition API supported by the browser
	viewTransition?: ViewTransition; // the current view transition
	replacementStartViewTransition?: typeof Document.prototype.startViewTransition;
	before: Interceptor[];
	after: Interceptor[];
};

declare global {
	interface Window {
		__vtbag: {
			utensilDrawer?: UtensilDrawer;
		};
	}
}
