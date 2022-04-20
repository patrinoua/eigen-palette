## react-native-image-crop-picker getRootVC patch

#### When can we remove this:

Remove when we stop swizzling UIWindow via ARWindow or react-native-image-crop-picker provides a more robust way of finding the viewController to present on.

#### Explanation/Context:

https://github.com/ivpusic/react-native-image-crop-picker/pull/1354

We do some swizzling in our AppDelegate that causes [[UIApplication sharedApplication] delegate] window] to return nil, this is used by image-crop-picker to find the currently presented viewController to present the picker onto. This patch looks for our custom window subclass (ARWindow) instead and uses that to find the presented viewController. Note we cannot reliably use the lastWindow rather than checking for our custom subclass because in some circumstances this is not our window but an apple window for example UIInputWindow used for managing the keyboard.

## react-native patch-package (stacktrace-parser part only).

#### When can we remove this:

When this is merged: https://github.com/facebook/react-native/pull/30345.

#### Explanation/Context:

For some reason CircleCI kept giving an error when running tests `TypeError: stacktraceParser.parse is not a function`. Once I moved the require higher up, things started working again.

## Delay modal display after LoadingModal is dismissed

#### When can we remove this:

Doesn't really need to be removed but can be if view hierarchy issue is fixed in RN or our LoadingModal see PR for more details: https://github.com/artsy/eigen/pull/4283

#### Explanation/Context:

We have a modal for showing a loading state and a onDismiss call that optionally displays an alert message, on iOS 14 we came across an issue where the alert was not displaying because when onDismiss was called the LoadingModal was still in the view heirarchy. The delay is a workaround.

## react-native-credit-card-input

#### When can we remove this:

We can remove these hacks once we switch to Stripe's forthcoming official react-native library.

#### Explanation/Context:

These are fairly superficial styling hacks for

- focused/error border states
- shrinking the icon size to work nicely with our inputs
- aligning inner inputs nicely
- icon animation to work properly on android
- palette v3 colors

# android Input placeholder measuring hack

#### When can we remove this:

Once https://github.com/facebook/react-native/pull/29664 is merged or https://github.com/facebook/react-native/issues/29663 solved.

#### Explanation/Context:

As you can see in the PR and issue, android doesn't use ellipsis on the placeholder of a TextInput. That makes for a funky cut-off.

We added a workaround on Input, to accept an array of placeholders, from longest to shortest, so that android can measure which one fits in the TextInput as placeholder, and it uses that. When android can handle a long placeholder and use ellipsis or if we don't use long placeholders anymore, this can go.

# `react-native-screens` fragment crash on open from background on Android

#### When can we remove this:

Once https://github.com/software-mansion/react-native-screens/issues/17 is solved or we use another library for screen management.

#### Explanation/Context:

There is a known issue in react-native-screens that causes the app to crash on restoring from background. The react-native-screens team recommends the following workaround to be
added to the MainActivity class on Android https://github.com/software-mansion/react-native-screens/issues/17#issuecomment-424704067.

This has the UX downside of not allowing state restore from background but this is an unsolved problem for RN apps.

## typings/styled-components.native.d.ts

#### When can we remove this:

When we upgrade styled-components to a version with types that don't complain when we run `yarn type-check`.

#### Explanation/Context:

I wasn't the one to add this file, so I don't have all the context, but I do know that styled-component types are missing and/or causing problems when we don't have that file.

The latest change I did was add the `ThemeContext` in there, because the version of styled-components we use has that, but the types are not exposing that, so I had to manually add it there.

# `react-native-push-notification` Requiring unknown module on ios

#### When can we remove this:

Once we want to use react-native-push-notification on iOS

#### Explanation/Context:

This is happening because react-native-push-notification requires @react-native-community/push-notification-ios. We are not
adding this dependency at this time because it is unnecessary and we do not use react-native-push-notification on iOS. Also,
we do not want unnecessary conflicts between our native push notification implementation and @react-native-community/push-notification-ios's.

## `@storybook/client-api` patch-package

#### When can we remove this:

Once storybook is upgraded to a version that does not use the removed `Cancellable` from `lodash` in that file.

#### Explanation/Context:

We get an error like here, and that is the solution. https://github.com/DefinitelyTyped/DefinitelyTyped/issues/47166#issuecomment-685738545

# `PropsStore` pass functions as props inside navigate() on iOS

#### When can we remove this:

Once we no longer use our native implementation of pushView on iOS

#### Explanation/Context:

We cannot pass functions as props because `navigate.ts` on ios uses the native obj-c definition of pushView in `ARScreenPresenterModule.m`.
React native is not able to convert js functions so this is passed as null to the underlying native method
See what can be converted: https://github.com/facebook/react-native/blob/main/React/Base/RCTConvert.h

PropsStore allows us to temporarily hold on the props and reinject them back into the destination view or module.

# `Map` manual prop update in `PageWrapper`

#### When can we remove this:

We should see if it is still necessary when we remove the old native navigation on iOS. To check: go into City Guide, leave, enter again and then try to change the city. If it works without this code it can be removed.
If it is still an issue with old native navigation gone this can either be removed when we remove or rebuild City Guide or if we change how props are saved in PageWrapper.

#### Explanation/Context:

City Guide is a mixture of native components and react components, prop updates from the native side are not updating the component on the react native side without this manual check and update. See the PR here for the change in the AppRegistry:
https://github.com/artsy/eigen/pull/6348

## @react-native-async-storage/async-storage patch

#### When can we remove this:

When https://github.com/react-native-async-storage/async-storage/issues/746 is solved.

#### Explanation/Context:

The types in this package are not correct, and there is a type error that comes up when we try to use it.
It's a type error on the mock declaration, so we don't really care for it, so we just add a ts-ignore instruction to that declaration.

## @wojtekmaj/enzyme-adapter-react-17 patch

#### When can we remove this:

When we remove enzyme from eigen.

#### Explanation/Context:

Enzyme is missing types and this package is importing enzyme, so typescript is sad.
We ignore enzyme types in our tests in eigen too. Once we remove enzyme, we can get rid of this and everything connected to enzyme.

## rn-async-storage-flipper patch

#### When can we remove this:

Unsure.

#### Explanation/Context:

The types in this package are not correct, and there is a type error that comes up when we try to use it.
It is a helper package only used for developing, so we are not afraid of wrong types causing issues to users.

## ParentAwareScrollView

#### When can we remove this:

To remove this, we need to change our InfiniteScrollArtworksGrid to use a FlatList or any VirtualizedList. We haven't done that yet, because we need the masonry layout.
We either need to find a library that gives us masonry layout using a VirtualizedList, or we need to make our own version of this.

#### Explanation/Context:

Currently our masonry layout (in InfiniteScrollArtworksGrid `render()`) is using a ScrollView, which is not a VirtualizedList.
Also, currently, the parent that is the FlatList, comes from StickyTabPageFlatList.

## react-native-scrollable-tab-view pointing to a commit hash

#### When we can remove this:

When the fix is in a release in the library or when we stop using this library.

#### Explanation/Context

With updated react native version (66) this library causes an error calling the now non-existent getNode() function, it is fixed on the main branch in the library but has not yet been released on npm.
