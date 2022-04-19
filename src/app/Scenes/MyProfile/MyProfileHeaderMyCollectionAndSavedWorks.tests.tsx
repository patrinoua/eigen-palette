import { MyProfileHeaderMyCollectionAndSavedWorksTestsQuery } from "__generated__/MyProfileHeaderMyCollectionAndSavedWorksTestsQuery.graphql"
import { FancyModalHeader } from "app/Components/FancyModal/FancyModalHeader"
import { StickyTabPage } from "app/Components/StickyTabPage/StickyTabPage"
import { navigate } from "app/navigation/navigate"
import { __globalStoreTestUtils__ } from "app/store/GlobalStore"
import { flushPromiseQueue } from "app/tests/flushPromiseQueue"
import { mockEnvironmentPayload } from "app/tests/mockEnvironmentPayload"
import { renderWithWrappersTL } from "app/tests/renderWithWrappers"
import { LocalImage, storeLocalImages } from "app/utils/LocalImageStore"
import { Avatar } from "palette"
import React from "react"
import { graphql, QueryRenderer } from "react-relay"
import { act } from "react-test-renderer"
import { createMockEnvironment } from "relay-test-utils"
import { FavoriteArtworksQueryRenderer } from "../Favorites/FavoriteArtworks"
import { MyCollectionQueryRenderer } from "../MyCollection/MyCollection"
import {
  LOCAL_PROFILE_ICON_PATH_KEY,
  MyProfileHeaderMyCollectionAndSavedWorksFragmentContainer,
} from "./MyProfileHeaderMyCollectionAndSavedWorks"

jest.mock("./LoggedInUserInfo")
jest.unmock("react-relay")
jest.mock("@react-navigation/native", () => {
  const actualNav = jest.requireActual("@react-navigation/native")
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
    }),
  }
})

describe("MyProfileHeaderMyCollectionAndSavedWorks", () => {
  let mockEnvironment: ReturnType<typeof createMockEnvironment>
  const TestRenderer = () => (
    <QueryRenderer<MyProfileHeaderMyCollectionAndSavedWorksTestsQuery>
      environment={mockEnvironment}
      query={graphql`
        query MyProfileHeaderMyCollectionAndSavedWorksTestsQuery @relay_test_operation {
          me @optionalField {
            ...MyProfileHeaderMyCollectionAndSavedWorks_me
          }
        }
      `}
      render={({ props, error }) => {
        if (props?.me) {
          return <MyProfileHeaderMyCollectionAndSavedWorksFragmentContainer me={props?.me} />
        } else if (error) {
          console.log(error)
        }
      }}
      variables={{}}
    />
  )

  const getWrapper = (mockResolvers = {}) => {
    const tree = renderWithWrappersTL(<TestRenderer />)
    mockEnvironmentPayload(mockEnvironment, mockResolvers)
    return tree
  }

  beforeEach(() => {
    mockEnvironment = createMockEnvironment()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe("Components of MyProfileHeaderMyCollectionAndSavedWorks ", () => {
    it("renders the right tabs", () => {
      const { container } = getWrapper()
      expect(container.findByType(StickyTabPage)).toBeDefined()
      expect(container.findByType(MyCollectionQueryRenderer)).toBeDefined()
      expect(container.findByType(FavoriteArtworksQueryRenderer)).toBeDefined()
    })

    // Header tests
    it("Header Settings onPress navigates to MyProfileSettings", () => {
      const { container } = getWrapper()
      container.findByType(FancyModalHeader).props.onRightButtonPress()
      expect(navigate).toHaveBeenCalledTimes(1)
      expect(navigate).toHaveBeenCalledWith("/my-profile/settings")
    })

    it("Header shows the right text", async () => {
      const { findByText } = getWrapper({
        Me: () => ({
          name: "My Name",
          createdAt: new Date().toISOString(),
          bio: "My Bio",
          icon: {
            url: "https://someurll.jpg",
          },
        }),
      })

      const year = new Date().getFullYear()
      expect(await findByText("My Name")).toBeTruthy()
      expect(await findByText(`Member since ${year}`)).toBeTruthy()
      expect(await findByText("My Bio")).toBeTruthy()
    })

    it("Renders Icon", async () => {
      const localImage: LocalImage = {
        path: "some/my/profile/path",
        width: 10,
        height: 10,
      }
      await act(async () => {
        await storeLocalImages([localImage], LOCAL_PROFILE_ICON_PATH_KEY)
      })

      const { container } = getWrapper({
        Me: () => ({
          name: "My Name",
          createdAt: new Date().toISOString(),
          bio: "My Bio",
          icon: {
            url: "https://someurll.jpg",
          },
        }),
      })

      await flushPromiseQueue()
      expect(container.findAllByType(Avatar)).toBeDefined()
      // expect only one avatar
      expect(container.findAllByType(Avatar).length).toEqual(1)
    })

    describe("With Collector Profile feature flag OFF", () => {
      beforeEach(() => {
        __globalStoreTestUtils__?.injectFeatureFlags({ AREnableCollectorProfile: false })
      })

      it("should not render Collector Profile info", async () => {
        const { findByText, queryByText } = getWrapper({
          Me: () => ({
            name: "Princess",
            createdAt: new Date("12/12/12").toISOString(),
            bio: "Richest Collector! 💰",
            location: {
              display: "Atlantis",
            },
            profession: "Guardian of the Galaxy",
            otherRelevantPositions: "Marvel Universe",
          }),
        })

        expect(await findByText("Princess")).toBeTruthy()
        expect(await findByText("Member since 2012")).toBeTruthy()
        expect(await findByText("Richest Collector! 💰")).toBeTruthy()
        expect(queryByText("Guardian of the Galaxy")).toBeFalsy()
        expect(queryByText("Atlantis")).toBeFalsy()
        expect(queryByText("Marvel Universe")).toBeFalsy()
      })
    })

    describe("With Collector Profile feature flag ON", () => {
      beforeEach(() => {
        __globalStoreTestUtils__?.injectFeatureFlags({ AREnableCollectorProfile: true })
      })

      it("should render Collector Profile info", async () => {
        const { findByText } = getWrapper({
          Me: () => ({
            name: "Princess",
            createdAt: new Date("12/12/12").toISOString(),
            bio: "Richest Collector! 💰",
            location: {
              display: "Atlantis",
            },
            profession: "Guardian of the Galaxy",
            otherRelevantPositions: "Marvel Universe",
          }),
        })

        expect(await findByText("Guardian of the Galaxy")).toBeTruthy()
        expect(await findByText("Atlantis")).toBeTruthy()
        expect(await findByText("Marvel Universe")).toBeTruthy()
      })
    })
  })
})
