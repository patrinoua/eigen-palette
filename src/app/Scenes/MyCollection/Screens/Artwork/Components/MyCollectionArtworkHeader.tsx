import { tappedCollectedArtworkImages } from "@artsy/cohesion"
import { MyCollectionArtworkHeader_artwork } from "__generated__/MyCollectionArtworkHeader_artwork.graphql"
import {
  CarouselImageDescriptor,
  ImageCarousel,
  ImageCarouselFragmentContainer,
} from "app/Scenes/Artwork/Components/ImageCarousel/ImageCarousel"
import { ScreenMargin } from "app/Scenes/MyCollection/Components/ScreenMargin"
import { retrieveLocalImages } from "app/utils/LocalImageStore"
import { useScreenDimensions } from "app/utils/useScreenDimensions"
import { Flex, NoImageIcon, Spacer, Text, useColor } from "palette"
import React, { useEffect, useState } from "react"
import { createFragmentContainer, graphql } from "react-relay"
import { useTracking } from "react-tracking"
import { imageIsProcessing, isImage } from "../../ArtworkForm/MyCollectionImageUtil"

interface MyCollectionArtworkHeaderProps {
  artwork: MyCollectionArtworkHeader_artwork
}

export const MyCollectionArtworkHeader: React.FC<MyCollectionArtworkHeaderProps> = (props) => {
  const {
    artwork: { artistNames, date, images, internalID, title, slug },
  } = props

  const [imagesToDisplay, setImagesToDisplay] = useState<
    typeof images | CarouselImageDescriptor[] | null
  >(images)
  const [isDisplayingLocalImages, setIsDisplayingLocalImages] = useState(false)

  const dimensions = useScreenDimensions()
  const formattedTitleAndYear = [title, date].filter(Boolean).join(", ")

  const color = useColor()

  const { trackEvent } = useTracking()

  useEffect(() => {
    const defaultImage = images?.find((i) => i?.isDefault) || (images && images[0])
    if (!isImage(defaultImage) || imageIsProcessing(defaultImage, "normalized")) {
      // fallback to local images for this collection artwork
      retrieveLocalImages(slug).then((localImages) => {
        const mappedLocalImages =
          localImages?.map((localImage) => ({
            url: localImage.path,
            width: localImage.width,
            height: localImage.height,
            deepZoom: null,
          })) ?? null
        setImagesToDisplay(mappedLocalImages)
        setIsDisplayingLocalImages(!!localImages?.length)
      })
    }
  }, [])

  const ImagesToDisplayCarousel = isDisplayingLocalImages
    ? ImageCarousel
    : ImageCarouselFragmentContainer

  return (
    <>
      <ScreenMargin>
        <Text variant="lg">{artistNames}</Text>
        <Text variant="md" color="black60">
          {formattedTitleAndYear}
        </Text>
      </ScreenMargin>
      <Spacer my={1} />
      {!!imagesToDisplay ? (
        <ImagesToDisplayCarousel
          images={imagesToDisplay as any}
          cardHeight={dimensions.height / 2.5}
          paginationIndicatorType="scrollBar"
          onImagePressed={() => trackEvent(tracks.tappedCollectedArtworkImages(internalID, slug))}
        />
      ) : (
        <Flex
          testID="Fallback-image-mycollection-header"
          bg={color("black5")}
          height={dimensions.height / 2.5}
          justifyContent="center"
          mx={20}
        >
          <NoImageIcon fill="black60" mx="auto" />
        </Flex>
      )}
    </>
  )
}

export const MyCollectionArtworkHeaderFragmentContainer = createFragmentContainer(
  MyCollectionArtworkHeader,
  {
    artwork: graphql`
      fragment MyCollectionArtworkHeader_artwork on Artwork {
        artistNames
        date
        images {
          ...ImageCarousel_images
          imageVersions
          isDefault
        }
        internalID
        slug
        title
      }
    `,
  }
)

const tracks = {
  tappedCollectedArtworkImages: (internalID: string, slug: string) => {
    return tappedCollectedArtworkImages({ contextOwnerId: internalID, contextOwnerSlug: slug })
  },
}
