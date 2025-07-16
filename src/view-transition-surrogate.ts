export function createViewTransitionSurrogate(update: () => Promise<void>): ViewTransition {
	let res: () => void;
	let rej: (reason?: any) => void;
	let readyReject: (reason?: any) => void;

	const updateCallbackDone = new Promise<void>((resolve, reject) => {
		res = resolve;
		rej = reject;
	});
	let updateFailure: any = undefined;
	requestAnimationFrame(async () => {
		try {
			await update();
			res();
		} catch (e) {
			updateFailure = e;
			rej(e);
		}
	});
	const ready = new Promise<void>((res, rej) => {
		readyReject = rej;
		updateCallbackDone.then(
			() => res(), //rej('Browser does not support View Transition API'),
			(_) => res() //rej(err)
		);
	});
	const done = (res: () => void, rej: (reason?: any) => void) =>
		updateFailure ? rej(updateFailure) : res();
	const finished = new Promise<void>((res, rej) =>
		updateCallbackDone.finally(() =>
			ready.then(
				() => done(res, rej),
				(e) => done(res, rej)
			)
		)
	);
	return {
		updateCallbackDone,
		ready,
		finished,
		skipTransition: () => {},
		types: new Set<string>(),
	} as ViewTransition;
}
