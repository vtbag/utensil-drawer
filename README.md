[⭐️Please star to support this work⭐️](https://github.com/vtbag/turn-signal)

# 🔙 The Turn Signal

Turn-Signal: Directional view transitions for intuitive navigation.

![Build Status](https://github.com/vtbag/turn-signal/actions/workflows/run-build.yml/badge.svg)
[![npm version](https://img.shields.io/npm/v/@vtbag/turn-signal/latest)](https://www.npmjs.com/package/@vtbag/turn-signal)
![minzip](https://badgen.net/bundlephobia/minzip/@vtbag/turn-signal)
[![NPM Downloads](https://img.shields.io/npm/dw/@vtbag/turn-signal)](https://www.npmjs.com/package/@vtbag/turn-signal)

The @vtbag website can be found at https://vtbag.pages.dev/

## !!! News !!!

Never trust a *.0 version ;-) Sorry for the inconvenience!

For details see the [CHANGELOG](https://github.com/vtbag/turn-signal/blob/main/CHANGELOG.md)


## What is it?

Turn-Signal is a lightweight script that enhances cross-document view transitions by detecting the direction of browser navigation. It enables developers to create smooth, responsive transitions that adjust based on forward or backward navigation, delivering a more intuitive user experience.

When your pages slide to the left on forward navigation, let them slide to the right when the users goes back in the browser's history.

The script automatically detects the traversal direction and sets `backward`, `neither` or `forward` view transition types accordingly. You can also instruct the script to set data attributes on the `<html>` element.

If your site has the concept of a _previous_ and _next_ page, the Turn-Signal can automatically generate directional transitions for you.

[See the Turn Signal in action](https://vtbag.pages.dev/signal-demo/bag/) and [see how it can be customized](https://vtbag.pages.dev/tools/turn-signal/).