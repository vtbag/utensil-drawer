/* One version of startViewTransition() for all browsers.
   Without native view transition support just calls the update function and returns a view transition object with promises. */
export function mayStartViewTransition(
  param?: StartViewTransitionParameter | UpdateCallback,
  scope = document
): ViewTransition {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (param === undefined || param instanceof Function) {
    if (scope.startViewTransition && !reducedMotion) return scope.startViewTransition(param);
    return fallback(param, []);
  }
  if (scope.startViewTransition && !reducedMotion)
    try {
      return scope.startViewTransition(param);
    } catch (e) {
      return scope.startViewTransition(param.update);
    }
  return fallback(param && typeof param === 'object' ? param.update : param, param.types ?? []);
}

function fallback(
  update: UpdateCallback = () => { },
  types: string[] | Set<string>
): ViewTransition {
  const updateCallbackDone = Promise.resolve(update());
  const ready = Promise.resolve(updateCallbackDone);
  const finished = Promise.resolve(ready);

  return {
    updateCallbackDone,
    ready,
    finished,
    skipTransition: () => { },
    types: new Set(types),
  } as ViewTransition;
}
