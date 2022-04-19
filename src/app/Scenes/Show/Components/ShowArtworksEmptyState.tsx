import { ShowArtworksEmptyState_show } from "__generated__/ShowArtworksEmptyState_show.graphql"
import { Box, BoxProps, Message } from "palette"
import React from "react"
import { createFragmentContainer, graphql } from "react-relay"

export interface ShowArtworksEmptyStateProps extends BoxProps {
  show: ShowArtworksEmptyState_show
}

export const ShowArtworksEmptyState: React.FC<ShowArtworksEmptyStateProps> = ({
  show,
  ...rest
}) => {
  const message = [
    `This ${Boolean(show.isFairBooth) ? "fair booth" : "show"} is currently unavailable.`,

    ...(show.status !== "closed"
      ? [
          `Please check back closer to the ${
            Boolean(show.isFairBooth) ? "fair" : "show"
          } for artworks.`,
        ]
      : []),
  ].join(" ")

  return (
    <Box {...rest}>
      <Message>{message}</Message>
    </Box>
  )
}

export const ShowArtworksEmptyStateFragmentContainer = createFragmentContainer(
  ShowArtworksEmptyState,
  {
    show: graphql`
      fragment ShowArtworksEmptyState_show on Show {
        isFairBooth
        status
      }
    `,
  }
)
