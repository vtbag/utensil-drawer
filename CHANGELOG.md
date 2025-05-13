# @vtbag/utensil-drawer

## 1.2.6

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
