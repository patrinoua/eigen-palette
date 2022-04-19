import { useScreenDimensions } from "app/utils/useScreenDimensions"
import { Box, BulletedItem, Flex, Join, Spacer, Text } from "palette"
import React from "react"
import { ScrollView } from "react-native"

export const ArtworkSubmissionStatusFAQ: React.FC = () => {
  const { safeAreaInsets } = useScreenDimensions()

  return (
    <ScrollView>
      <Box pt={safeAreaInsets.top} pb={safeAreaInsets.bottom} px={2}>
        <Box my={3}>
          <Join separator={<Spacer my={1.5} />}>
            <Text variant="lg">Submission Status</Text>

            <Join separator={<Spacer my={0} />}>
              <Text caps mb={0} variant="xs">
                What does my Artwork’s status mean?
              </Text>
              <Flex flexDirection="column" mb={0} mt={0}>
                <BulletedItem color="black">
                  Submission in Progress - the artwork is being reviewed or is in the sales process.
                </BulletedItem>
                <BulletedItem color="black">
                  Evaluation Complete - our specialists have reviewed this submission and determined
                  that we do not currently have a market for it.
                </BulletedItem>
                <BulletedItem color="black">
                  Artwork Sold - the artwork has successfully been sold.
                </BulletedItem>
              </Flex>
            </Join>

            <Join separator={<Spacer my={0} />}>
              <Flex mb={0}>
                <Text caps variant="xs">
                  find out more
                </Text>
              </Flex>
              <Flex flexDirection="column">
                <Text mb={1}>
                  For more information, see our Collector Help Center article{" "}
                  {
                    <Text style={{ textDecorationLine: "underline" }}>
                      What do we look for in consignment submissions?
                    </Text>
                  }
                </Text>
                <Text>
                  Or get in touch with one of our specialists at
                  {<Text style={{ textDecorationLine: "underline" }}> consign@artsymail.com.</Text>}
                </Text>
              </Flex>
            </Join>
          </Join>
        </Box>
      </Box>
    </ScrollView>
  )
}
