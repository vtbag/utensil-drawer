import { ensureDrawer } from './drawer';

export function mayStartViewTransition(param: StartViewTransitionParameter, breakExisting = false) {
	const drawer = ensureDrawer();
	if (!document.startViewTransition || (drawer.viewTransition && !breakExisting)) {
		return param?.update?.();
	} else {
		drawer.viewTransition = document.startViewTransition(drawer.level === 2 ? param : param.update);
	}
}

export function skipCurrentViewTransition() {
	top!.__vtbag.utensilDrawer?.viewTransition?.skipTransition();
}
