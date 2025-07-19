import { getTypeAttributes, polyfilledTypes } from './polyfilled-types.js';
import {
	createViewTransitionProxy,
	SwitchableViewTransition,
} from './switchable-view-transition.js';
import { createViewTransitionSurrogate } from './view-transition-surrogate.js';

export interface StartViewTransitionExtensions {
	respectReducedMotion?: boolean; // default is true
	collisionBehavior?: 'skipOld' | 'chaining' | 'chaining-only' | 'skipNew' | 'never'; // default is "skipOld"
	speedUpWhenChained?: number; // default is 1.0
	useTypesPolyfill?: 'never' | 'auto' | 'always'; // defaults to 'never';
}
const collisionBehaviors = ['skipOld', 'chaining', 'chaining-only', 'skipNew', 'never'];
let nativeSupport = 'none';
if (document.startViewTransition) {
	try {
		document.startViewTransition({ update: () => {}, types: [] }).skipTransition();
		nativeSupport = 'full';
	} catch (e) {
		nativeSupport = 'partial';
	}
	// @ts-expect-error
	if (Element.prototype.startViewTransition) {
		nativeSupport = 'scoped';
	}
}

export function nativeViewTransitionSupport() {
	return nativeSupport;
}

let currentViewTransition: ViewTransition | undefined;
export function getCurrentViewTransition() {
	return currentViewTransition;
}

let open: number | undefined = undefined;
let keepLast: boolean = false;

const close = () => {
	cancelAnimationFrame(open!);
	open = undefined;
};
const chained: ViewTransitionRequest[] = [];
const updates: UpdateCallback[] = [];
let typeAttributes: Set<string>;
interface ViewTransitionRequest {
	update: UpdateCallback;
	extensions: StartViewTransitionExtensions;
	proxy: SwitchableViewTransition;
}

/*
	One version of startViewTransition() for all browsers with or without native support.
	Without native support or with "respectReducedMotion" and reduced motion the function  behaves as if every transition were skipped.

	Collision behavior:
	By default ("skipOld") behaves like the API function where new invocations skip active ones.
	This can be set to "skipNew", where new invocations are skipped if another one is still active.
	'never' will behave as if view transitions are not supported at all.
	With "chaining" the update functions of concurrent calls will be combined to one view transition (all calls that arrive before the old state is captured) or in followup transitions for all new calls arriving later.
	You can suppress combining calls that arrive before the old state is captured by setting "collisionBehavior" to "chaining-only".

	You can crank up the speed of running animations by setting "speedUpWhenChained" to > 1.
*/
export function mayStartViewTransition(
	param?: StartViewTransitionParameter | UpdateCallback,
	ext: StartViewTransitionExtensions = {}
): ViewTransition {
	let {
		collisionBehavior = 'skipOld',
		speedUpWhenChained = 1,
		respectReducedMotion = true,
		useTypesPolyfill = 'never',
	} = ext;

	collisionBehaviors.includes(collisionBehavior) ||
		(console.warn(
			`Invalid collisionBehavior "${collisionBehavior}" specified, using "skipOld" instead`
		),
		(collisionBehavior = 'skipOld'));

	const extensions = {
		collisionBehavior,
		speedUpWhenChained,
		respectReducedMotion,
		useTypesPolyfill,
	};

	const update = (param instanceof Function ? param : param?.update) ?? (() => {});
	const types = new Set(param instanceof Function ? [] : (param?.types ?? []));
	const reduceMotion =
		respectReducedMotion && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	let surrogate = false;
	if (
		(collisionBehavior === 'skipNew' && currentViewTransition) ||
		collisionBehavior === 'never' ||
		nativeSupport === 'none' ||
		reduceMotion
	) {
		surrogate = true;
	}

	if (!currentViewTransition || collisionBehavior === 'skipOld') {
		keepLast = !!currentViewTransition && !!open;
		open = requestAnimationFrame(close);
		currentViewTransition = polyfilledTypes(
			surrogate
				? createViewTransitionSurrogate(unchainUpdates)
				: document.startViewTransition!(unchainUpdates),
			useTypesPolyfill === 'always' || (useTypesPolyfill !== 'never' && nativeSupport === 'partial')
		);
		currentViewTransition.finished.finally(() => {
			getTypeAttributes()?.forEach((t) => document.documentElement.classList.remove(t));
			currentViewTransition = undefined;
			chained.splice(0, chained.length).forEach(({ update, extensions, proxy }) => {
				mayStartViewTransition({ update, types: proxy.types }, extensions);
				proxy.switch();
			});
		});
	}
	if (open && (collisionBehavior !== 'chaining-only' || updates.length === 0)) {
		types.forEach((t) => currentViewTransition!.types?.add(t));
		updates.push(update);
		return currentViewTransition;
	}
	const proxy = createViewTransitionProxy(types);
	chained.push({ update, extensions, proxy });
	if (extensions.speedUpWhenChained !== 1) {
		document.getAnimations().forEach((a) => {
			a.effect?.pseudoElement?.startsWith('::view-transition') &&
				(a.playbackRate *= extensions.speedUpWhenChained!);
		});
	}
	return proxy;
}

async function unchainUpdates() {
	const current = updates.splice(0, updates.length - (keepLast ? 1 : 0));
	keepLast = false;
	const rejected = (await Promise.allSettled(current.map((u) => u!()))).find(
		(r) => r.status === 'rejected'
	) as PromiseRejectedResult;
	if (rejected) throw new Error(rejected.reason);
}
