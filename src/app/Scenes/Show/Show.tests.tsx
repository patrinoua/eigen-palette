import { ShowTestsQuery } from "__generated__/ShowTestsQuery.graphql"
import { HeaderArtworksFilterWithTotalArtworks } from "app/Components/HeaderArtworksFilter/HeaderArtworksFilterWithTotalArtworks"
import { extractText } from "app/tests/extractText"
import { renderWithWrappers } from "app/tests/renderWithWrappers"
import React from "react"
import { graphql, QueryRenderer } from "react-relay"
import { act } from "react-test-renderer"
import { createMockEnvironment, MockPayloadGenerator } from "relay-test-utils"
import { ShowContextCard } from "./Components/ShowContextCard"
import { Show, ShowFragmentContainer } from "./Show"

jest.unmock("react-relay")

describe("Show", () => {
  let env: ReturnType<typeof createMockEnvironment>

  beforeEach(() => {
    env = createMockEnvironment()
  })

  const TestRenderer = () => (
    <QueryRenderer<ShowTestsQuery>
      environment={env}
      query={graphql`
        query ShowTestsQuery($showID: String!) @relay_test_operation {
          show(id: $showID) {
            ...Show_show
          }
        }
      `}
      variables={{ showID: "the-big-show" }}
      render={({ props, error }) => {
        if (props?.show) {
          return <ShowFragmentContainer show={props.show} />
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
    expect(wrapper.root.findAllByType(Show)).toHaveLength(1)
  })

  it("renders the show", () => {
    const wrapper = getWrapper({
      Show: () => ({
        name: "The big show",
        formattedStartAt: "October 23",
        formattedEndAt: "October 27, 2000",
        startAt: "2000-10-23T20:00:00+00:00",
        endAt: "2000-10-27T00:00:00+00:00",
        partner: {
          name: "Example Partner",
        },
      }),
    })

    expect(wrapper.root.findAllByType(Show)).toHaveLength(1)

    const text = extractText(wrapper.root)

    expect(text).toContain("The big show")
    expect(text).toContain("October 23 – October 27, 2000")
    expect(text).toContain("Closed")
    expect(text).toContain("Example Partner")
  })

  it("renders the installation shots", () => {
    const wrapper = getWrapper({
      Show: () => ({
        images: [{ caption: "First install shot" }, { caption: "Second install shot" }],
      }),
    })

    const text = extractText(wrapper.root)

    expect(text).toContain("First install shot")
    expect(text).toContain("Second install shot")
  })

  it("renders the context card", () => {
    const wrapper = getWrapper()
    expect(wrapper.root.findAllByType(ShowContextCard)).toHaveLength(1)
  })

  it("renders artworks filter header", () => {
    const wrapper = getWrapper()
    expect(wrapper.root.findAllByType(HeaderArtworksFilterWithTotalArtworks)).toHaveLength(1)
  })
})
