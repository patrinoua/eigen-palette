import { FairTestsQuery } from "__generated__/FairTestsQuery.graphql"
import { extractText } from "app/tests/extractText"
import { renderWithWrappers } from "app/tests/renderWithWrappers"
import { NavigationalTabs, Tab } from "palette/elements/Tabs"
import { TabV3 } from "palette/elements/Tabs/Tab"
import React from "react"
import { graphql, QueryRenderer } from "react-relay"
import { act } from "react-test-renderer"
import { useTracking } from "react-tracking"
import { createMockEnvironment, MockPayloadGenerator } from "relay-test-utils"
import { FairArtworksFragmentContainer } from "./Components/FairArtworks"
import { FairCollectionsFragmentContainer } from "./Components/FairCollections"
import { FairEditorialFragmentContainer } from "./Components/FairEditorial"
import { FairExhibitorsFragmentContainer } from "./Components/FairExhibitors"
import { FairFollowedArtistsRailFragmentContainer } from "./Components/FairFollowedArtistsRail"
import { FairHeaderFragmentContainer } from "./Components/FairHeader"
import { Fair, FairFragmentContainer } from "./Fair"

jest.unmock("react-relay")

describe("Fair", () => {
  const trackEvent = useTracking().trackEvent
  let env: ReturnType<typeof createMockEnvironment>

  beforeEach(() => {
    env = createMockEnvironment()
  })

  const TestRenderer = () => (
    <QueryRenderer<FairTestsQuery>
      environment={env}
      query={graphql`
        query FairTestsQuery($fairID: String!) @relay_test_operation {
          fair(id: $fairID) {
            ...Fair_fair
          }
        }
      `}
      variables={{ fairID: "art-basel-hong-kong-2020" }}
      render={({ props, error }) => {
        if (props?.fair) {
          return <FairFragmentContainer fair={props.fair} />
        } else if (error) {
          console.log(error)
        }
      }}
    />
  )

  const getWrapper = (mockResolvers = {}) => {
    const tree = renderWithWrappers(<TestRenderer />)
    act(() => {
      env.mock.resolveMostRecentOperation((operation) =>
        MockPayloadGenerator.generate(operation, mockResolvers)
      )
    })
    return tree
  }

  it("renders without throwing an error", () => {
    const wrapper = getWrapper()
    expect(wrapper.root.findAllByType(Fair)).toHaveLength(1)
  })

  it("renders the necessary components when fair is active", () => {
    const wrapper = getWrapper({
      Fair: () => ({
        isActive: true,
        counts: {
          artworks: 42,
          partnerShows: 42,
        },
      }),
    })

    expect(wrapper.root.findAllByType(FairHeaderFragmentContainer)).toHaveLength(1)
    expect(wrapper.root.findAllByType(FairEditorialFragmentContainer)).toHaveLength(1)
    expect(wrapper.root.findAllByType(FairCollectionsFragmentContainer)).toHaveLength(1)
    expect(wrapper.root.findAllByType(NavigationalTabs)).toHaveLength(1)
    expect(wrapper.root.findAllByType(FairExhibitorsFragmentContainer)).toHaveLength(1)
    expect(wrapper.root.findAllByType(FairFollowedArtistsRailFragmentContainer)).toHaveLength(1)
  })

  it("renders fewer components when fair is inactive", () => {
    const wrapper = getWrapper({
      Fair: () => ({
        isActive: false,
      }),
    })

    expect(wrapper.root.findAllByType(FairHeaderFragmentContainer)).toHaveLength(1)
    expect(wrapper.root.findAllByType(FairEditorialFragmentContainer)).toHaveLength(1)
    expect(extractText(wrapper.root)).toMatch("This fair is currently unavailable.")

    expect(wrapper.root.findAllByType(FairCollectionsFragmentContainer)).toHaveLength(0)
    expect(wrapper.root.findAllByType(NavigationalTabs)).toHaveLength(0)
    expect(wrapper.root.findAllByType(FairExhibitorsFragmentContainer)).toHaveLength(0)
    expect(wrapper.root.findAllByType(FairFollowedArtistsRailFragmentContainer)).toHaveLength(0)
  })

  it("does not render components when there is no data for them", () => {
    const wrapper = getWrapper({
      Fair: () => ({
        articles: {
          edges: [],
        },
        marketingCollections: [],
        counts: {
          artworks: 0,
          partnerShows: 0,
        },
      }),
    })
    expect(wrapper.root.findAllByType(FairHeaderFragmentContainer)).toHaveLength(1)
    expect(wrapper.root.findAllByType(FairEditorialFragmentContainer)).toHaveLength(0)
    expect(wrapper.root.findAllByType(FairCollectionsFragmentContainer)).toHaveLength(0)
    expect(wrapper.root.findAllByType(NavigationalTabs)).toHaveLength(0)
    expect(wrapper.root.findAllByType(FairExhibitorsFragmentContainer)).toHaveLength(0)
    expect(wrapper.root.findAllByType(FairArtworksFragmentContainer)).toHaveLength(0)
  })

  it("renders the collections component if there are collections", () => {
    const wrapper = getWrapper({
      Fair: () => ({
        isActive: true,
        marketingCollections: [
          {
            slug: "great-collection",
          },
        ],
      }),
    })
    expect(wrapper.root.findAllByType(FairCollectionsFragmentContainer)).toHaveLength(1)
  })

  it("renders the editorial component if there are articles", () => {
    const wrapper = getWrapper({
      Fair: () => ({
        isActive: true,
        articles: {
          edges: [
            {
              __typename: "Article",
              node: {
                slug: "great-article",
              },
            },
          ],
        },
      }),
    })
    expect(wrapper.root.findAllByType(FairEditorialFragmentContainer)).toHaveLength(1)
  })

  it("renders the artists you follow rail if there are any artworks", () => {
    let wrapper = getWrapper({
      Fair: () => ({
        isActive: true,
        filterArtworksConnection: {
          edges: [],
        },
      }),
    })

    expect(wrapper.root.findAllByType(FairFollowedArtistsRailFragmentContainer)).toHaveLength(0)

    wrapper = getWrapper({
      Fair: () => ({
        isActive: true,
        followedArtistArtworks: {
          edges: [
            {
              __typename: "FilterArtworkEdge",
              artwork: {
                slug: "an-artwork",
              },
            },
          ],
        },
      }),
    })

    expect(wrapper.root.findAllByType(FairFollowedArtistsRailFragmentContainer)).toHaveLength(1)
  })

  it("renders the artworks/exhibitors component and tabs if there are artworks and exhibitors", () => {
    const wrapper = getWrapper({
      Fair: () => ({
        isActive: true,
        counts: {
          artworks: 100,
          partnerShows: 20,
        },
      }),
    })
    expect(wrapper.root.findAllByType(Tab)).toHaveLength(2)
    expect(wrapper.root.findAllByType(FairExhibitorsFragmentContainer)).toHaveLength(1)
    expect(wrapper.root.findAllByType(FairArtworksFragmentContainer)).toHaveLength(0)
  })

  describe("tracks taps navigating between the artworks tab and exhibitors tab", () => {
    it("When Using Palette V3", () => {
      const wrapper = getWrapper({
        Fair: () => ({
          isActive: true,
          slug: "art-basel-hong-kong-2020",
          internalID: "fair1244",
          counts: {
            artworks: 100,
            partnerShows: 20,
          },
        }),
      })
      const tabs = wrapper.root.findAllByType(TabV3)
      const exhibitorsTab = tabs[0]
      const artworksTab = tabs[1]

      act(() => artworksTab.props.onPress())
      expect(trackEvent).toHaveBeenCalledWith({
        action: "tappedNavigationTab",
        context_module: "exhibitorsTab",
        context_screen_owner_type: "fair",
        context_screen_owner_slug: "art-basel-hong-kong-2020",
        context_screen_owner_id: "fair1244",
        subject: "Artworks",
      })

      act(() => exhibitorsTab.props.onPress())
      expect(trackEvent).toHaveBeenCalledWith({
        action: "tappedNavigationTab",
        context_module: "artworksTab",
        context_screen_owner_type: "fair",
        context_screen_owner_slug: "art-basel-hong-kong-2020",
        context_screen_owner_id: "fair1244",
        subject: "Exhibitors",
      })
    })
  })
})
