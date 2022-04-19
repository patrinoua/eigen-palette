import {
  SearchCriteria,
  SearchCriteriaAttributes,
} from "app/Components/ArtworkFilter/SavedSearch/types"
import { clearDefaultAttributes, getNamePlaceholder } from "./helpers"
import { SavedSearchPill } from "./SavedSearchAlertModel"

describe("getNamePlaceholder", () => {
  it("returns the singular form for the filter label", () => {
    const pills: SavedSearchPill[] = [
      { label: "One", paramName: SearchCriteria.materialsTerms, value: "one" },
    ]
    expect(getNamePlaceholder("artistName", pills)).toBe("artistName • 1 filter")
  })

  it("returns the plural form for the filter label", () => {
    const pills: SavedSearchPill[] = [
      { label: "One", paramName: SearchCriteria.materialsTerms, value: "one" },
      { label: "Two", paramName: SearchCriteria.materialsTerms, value: "two" },
    ]
    expect(getNamePlaceholder("artistName", pills)).toBe("artistName • 2 filters")
  })

  it("returns the correct number of filters with artist pill", () => {
    const pills: SavedSearchPill[] = [
      { label: "Artist Name", paramName: SearchCriteria.artistID, value: "artistName" },
      { label: "One", paramName: SearchCriteria.materialsTerms, value: "one" },
      { label: "Two", paramName: SearchCriteria.materialsTerms, value: "two" },
    ]
    expect(getNamePlaceholder("artistName", pills)).toBe("artistName • 2 filters")
  })

  it("returns only artist name when pills are empty", () => {
    expect(getNamePlaceholder("artistName", [])).toBe("artistName")
  })
})

describe("clearDefaultAttributes", () => {
  it("should remove all default values", () => {
    const attributes: SearchCriteriaAttributes = {
      materialsTerms: [],
      colors: [],
      priceRange: null,
      acquireable: null,
      sizes: ["SMALL", "MEDIUM"],
      atAuction: true,
      artistIDs: ["artistID"],
    }

    expect(clearDefaultAttributes(attributes)).toEqual({
      sizes: ["SMALL", "MEDIUM"],
      atAuction: true,
      artistIDs: ["artistID"],
    })
  })
})
