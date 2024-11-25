import { ensureDrawer, ensurePatchedStartViewTransition } from './drawer';
import { Interceptor } from './types';

export function beforeAndAfter(interceptor: { before: Interceptor; after: Interceptor }) {
	ensurePatchedStartViewTransition();
	const drawer = ensureDrawer();
	interceptor.before && drawer.before.push(interceptor.before);
	interceptor.after && drawer.after.unshift(interceptor.after);
}
