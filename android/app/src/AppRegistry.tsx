// keep this import of storybook first, otherwise it might produce errors when debugging
// import { StorybookUIRoot } from "../storybook/storybook-ui"

import { GoogleSignin } from "@react-native-google-signin/google-signin"
import { SafeAreaInsets } from "app/types/SafeAreaInsets"
import React, { useEffect } from "react"
import { AppRegistry, LogBox, Platform, View } from "react-native"
import { GraphQLTaggedNode } from "relay-runtime"
import { AppProviders } from "./AppProviders"
import { ArtsyKeyboardAvoidingViewContext } from "./Components/ArtsyKeyboardAvoidingView"
import { FadeIn } from "./Components/FadeIn"

import { InquiryQueryRenderer } from "./Containers/Inquiry"

import { ArtworkQueryRenderer, ArtworkScreenQuery } from "./Scenes/Artwork/Artwork"

import { BottomTabOption, BottomTabType } from "./Scenes/BottomTabs/BottomTabType"
import { ConversationNavigator } from "./Scenes/Inbox/ConversationNavigator"

import { PartnerLocationsQueryRenderer } from "./Scenes/Partner/Screens/PartnerLocations"

import { GlobalStore, useSelectedTab } from "./store/GlobalStore"
import { propsStore } from "./store/PropsStore"
import { addTrackingProvider, Schema, screenTrack } from "./utils/track"
import { ConsoleTrackingProvider } from "./utils/track/ConsoleTrackingProvider"
import {
  SEGMENT_TRACKING_PROVIDER,
  SegmentTrackingProvider,
} from "./utils/track/SegmentTrackingProvider"

import { useScreenDimensions } from "./utils/useScreenDimensions"

LogBox.ignoreLogs([
  "Non-serializable values were found in the navigation state",

  "Require cycle:",

  ".removeListener(", // this is coming from https://github.com/facebook/react-native/blob/v0.68.0-rc.2/Libraries/AppState/AppState.js and other libs.
])

addTrackingProvider(SEGMENT_TRACKING_PROVIDER, SegmentTrackingProvider)
addTrackingProvider("console", ConsoleTrackingProvider)

interface ArtworkProps {
  artworkID: string
  isVisible: boolean
}

const Artwork = (props: ArtworkProps) => <ArtworkQueryRenderer {...props} />

interface PartnerLocationsProps {
  partnerID: string
  safeAreaInsets: SafeAreaInsets
  isVisible: boolean
}
const PartnerLocations = (props: PartnerLocationsProps) => (
  <PartnerLocationsQueryRenderer {...props} />
)

interface InquiryProps {
  artworkID: string
}
const Inquiry: React.FC<InquiryProps> = screenTrack<InquiryProps>((props) => {
  return {
    context_screen: Schema.PageNames.InquiryPage,
    context_screen_owner_slug: props.artworkID,
    context_screen_owner_type: Schema.OwnerEntityTypes.Artwork,
  }
})((props) => <InquiryQueryRenderer {...props} />)

interface ConversationProps {
  conversationID: string
}
const Conversation: React.FC<ConversationProps> = screenTrack<ConversationProps>((props) => {
  return {
    context_screen: Schema.PageNames.ConversationPage,
    context_screen_owner_id: props.conversationID,
    context_screen_owner_type: Schema.OwnerEntityTypes.Conversation,
  }
})(ConversationNavigator)

interface PageWrapperProps {
  fullBleed?: boolean
  isMainView?: boolean
  ViewComponent: React.ComponentType<any>
  viewProps: any
  moduleName: string
}

function InnerPageWrapper({ fullBleed, isMainView, ViewComponent, viewProps }: PageWrapperProps) {
  const safeAreaInsets = useScreenDimensions().safeAreaInsets
  const paddingTop = fullBleed ? 0 : safeAreaInsets.top
  const paddingBottom = isMainView ? 0 : safeAreaInsets.bottom
  const isHydrated = GlobalStore.useAppState((state) => state.sessionState.isHydrated)
  // if we're in a modal, just pass isVisible through
  const currentTab = useSelectedTab()
  let isVisible = viewProps.isVisible
  if (BottomTabOption[viewProps.navStackID as BottomTabType]) {
    // otherwise, make sure it respects the current tab
    isVisible = isVisible && currentTab === viewProps.navStackID
  }
  const isPresentedModally = viewProps.isPresentedModally
  return (
    <ArtsyKeyboardAvoidingViewContext.Provider
      value={{ isVisible, isPresentedModally, bottomOffset: paddingBottom }}
    >
      <View style={{ flex: 1, paddingTop, paddingBottom }}>
        {isHydrated ? (
          <FadeIn style={{ flex: 1 }} slide={false}>
            <ViewComponent {...{ ...viewProps, isVisible }} />
          </FadeIn>
        ) : null}
      </View>
    </ArtsyKeyboardAvoidingViewContext.Provider>
  )
}

class PageWrapper extends React.Component<PageWrapperProps> {
  pageProps: PageWrapperProps

  constructor(props: PageWrapperProps) {
    super(props)
    this.pageProps = this.savePageProps()
  }

  componentDidUpdate() {
    if (this.props.moduleName === "Map") {
      // workaround for City Guide. DO NOT USE FOR OTHER THINGS!
      // basically, only for the city guide component, we recreate the pageprops fresh.
      // thats because of the funky way the native and RN components in city guide are set up.
      // if we dont refresh them, then the city guide does not change cities from the dropdown.
      this.pageProps = this.savePageProps()
    }
  }

  savePageProps() {
    return {
      ...this.props,
      viewProps: {
        ...this.props.viewProps,
        ...propsStore.getPropsForModule(this.props.moduleName),
      },
    }
  }

  render() {
    return (
      <AppProviders>
        <InnerPageWrapper {...this.pageProps} />
      </AppProviders>
    )
  }
}

function register(
  screenName: string,
  Component: React.ComponentType<any>,
  options?: Omit<PageWrapperProps, "ViewComponent" | "viewProps">
) {
  const WrappedComponent = (props: any) => (
    <PageWrapper {...options} moduleName={screenName} ViewComponent={Component} viewProps={props} />
  )
  AppRegistry.registerComponent(screenName, () => WrappedComponent)
}

export interface ViewOptions {
  modalPresentationStyle?: "fullScreen" | "pageSheet" | "formSheet"
  hasOwnModalCloseButton?: boolean
  alwaysPresentModally?: boolean
  hidesBackButton?: boolean
  fullBleed?: boolean
  // If this module is the root view of a particular tab, name it here
  isRootViewForTabName?: BottomTabType
  // If this module should only be shown in one particular tab, name it here
  onlyShowInTabName?: BottomTabType
}

type ModuleDescriptor =
  | {
      type: "react"
      Component: React.ComponentType<any>
      Queries?: GraphQLTaggedNode[]
      options: ViewOptions
    }
  | {
      type: "native"
      options: ViewOptions
    }

function reactModule(
  Component: React.ComponentType<any>,
  options: ViewOptions = {},
  Queries?: GraphQLTaggedNode[]
): ModuleDescriptor {
  return { type: "react", options, Component, Queries }
}

function nativeModule(options: ViewOptions = {}): ModuleDescriptor {
  return { type: "native", options }
}

// little helper function to make sure we get both intellisense and good type information on the result
function defineModules<T extends string>(obj: Record<T, ModuleDescriptor>) {
  return obj
}

export type AppModule = keyof typeof modules

export const modules = defineModules({})
