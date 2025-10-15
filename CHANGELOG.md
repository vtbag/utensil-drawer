# @vtbag/utensil-drawer

## 1.2.13

### Patch Changes

- e2cf3c6: mayStartViewTransitions can now also handle scoped view transitions

## 1.2.12

### Patch Changes

- 20154f1: The `declarative-names` script can now skip elements that are outside the viewport!

  Use the new `:in-viewport` pseudo-class to target only element that have an overlap with the current viewport. For example `":is(h2,h3):in-viewport = heading-"`

## 1.2.11

### Patch Changes

- abf1012: Adds a **polyfill for view tranition types** to mayStartViewTransition(). In combination with the postcss-active-view-transition-type PostCSS plugin enjoy view transition types even in browsers that do not yet support them natively.

## 1.2.10 - 2025-07-14

### Patch Changes

- bc81039: Improves implementation of mayStartViewTransiion
- 66ad07f: Fixes a bug where `setVectors()` didn't set `--vtbag-vector-${group}-*-height`
- bc81039: Adds the useTypesPolyfill option to mayStartViewTransition to replace view transition types with CSS classes on the :root element.

## 1.2.9 - 2025-07-09

### Patch Changes

- c0be1c7: This release features a major rewrite of mayStartViewTransition. No intended functional changes but cleaner structure.
- 9afddb9: adds "chaining-only" collision behavior.
- 28c9db4: Improves parameter checking and error handling.

## 1.2.8 - 2025-05-30

### Patch Changes

- c64c2ef: Fixes a bug that surfaced with Firefox Nightly.
- 3ce9a61: Fixes a bug where errors had not been passed to reject callbacks.
- fee8cf4: Adds a "never" option to mayStartViewTransition()'s collisionBehavior to switch off animation (e.g. for debugging)

## 1.2.7 - 2025-05-18

### Patch Changes

- 8b4716c: may-start-view-transition now also exports getCurrentViewTransition() to access the global view transition object
- 0284511: Prevents an incompatibility between Chromium and Safari when setVector is called twice inside the same view transition, which led Safari to find no verctors at all.

## 1.2.6 - 2025-05-13

### Patch Changes

- 1c14481: You can now configure the maxUpdateDuration that limits the size of update batches in chaining mode.
- 1c14481: Adds "skipNew" as a new collisionBahavior.

## 1.2.5 - 2025-05-07

### Patch Changes

- 15b263d: Fixes an issue with undefined animation-names
- bd66236: Changed options for experimental mayStartViewTransition

## 1.2.4 - 2025-04-12

### Patch Changes

- ab4be5b: Makes StartViewTransitionExtension fields optional and let you control respect for reduced motion.

## 1.2.3 - 2025-04-06

### Patch Changes

- 9237268: Extended parameters of experimental mayStartViewTransition

## 1.2.2 - 2025-04-04

### Patch Changes

- acb3747: mayStartViewTransition() got support for automatic chaining of view transitions to prevent killing of the current transition when a new one is started
- e37dd13: The vectors-script got even better: parameters allow for optimizing the size of the generated CSS for peudo-properties.

## 1.2.1 - 2025-04-03

### Patch Changes

- 9e7051b: Adds experimental setVectors() function that makes parameters of morph animations accessible in CSS rules.

## 1.2.0 - 2025-02-12

### Minor Changes

- 4119550: Breaking: renamed escapeCustomIdent to escapeViewTransitionName. On client-side, CSS.escape is recommended instead.

### Patch Changes

- 9f1d32e: [Declarative Names]: Improves error handling when an illegal CSS selector is used to automatically set view-transition-names.

## 1.1.0 - 2025-02-12

### Minor Changes

- fa8bd91: Adds a reusable function to escape view transition names that have characters beyond A-Za-z0-9-\_

## 1.0.1 - 2025-02-11

### Patch Changes

- ef4110e: Fixes a bug where assigning "" with declarative-names led to incorrect view-transition-names

## 1.0.0 - 2025-02-10

### Major Changes

- b561687: The declarative-names script left experimental state, justifying the first major release of the Drawer!

### Patch Changes

- 1e8e650: adds may-start-view-transition as a common wrapper for browsers with and without native view transition support

## 0.0.4 - 2025-01-25

### Patch Changes

- 8b2d2f5: Still not officially supported. Code refactorings and renames. Breaking: vtn -> declarative-names.

## 0.0.3 -2024-12-12

### Patch Changes

- 3f7f2a6: Also sets names on page load

## 0.0.2 - 2024-11-25

### Patch Changes

- 27cbbc9: The best function can't help it it isn't called

## 0.0.1 - 2024-11-25

### Patch Changes

- 3a4055b: Initial release
