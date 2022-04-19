import {
  MyCollectionArtworkArticles_article,
  MyCollectionArtworkArticles_article$key,
} from "__generated__/MyCollectionArtworkArticles_article.graphql"
import { ArticleCardContainer } from "app/Components/ArticleCard"
import { navigate } from "app/navigation/navigate"
import { ArrowRightIcon, Flex, Spacer, Text } from "palette"
import React from "react"
import { FlatList, TouchableOpacity } from "react-native"
import { useFragment } from "react-relay"
import { graphql } from "relay-runtime"

interface MyCollectionArtworkArticlesProps {
  articles: MyCollectionArtworkArticles_article$key
  artistNames: string | null
  artistSlug: string | undefined
  totalCount: number | null | undefined
}

export const MyCollectionArtworkArticles: React.FC<MyCollectionArtworkArticlesProps> = (props) => {
  const articles = useFragment<MyCollectionArtworkArticles_article$key>(
    articleFragment,
    props.articles
  )

  if (!articles.length) {
    return null
  }

  return (
    <Flex mb={3}>
      <TouchableOpacity onPress={() => navigate(`/artist/${props.artistSlug}/articles`)}>
        <Flex flexDirection="row" alignItems="flex-start" mb={2}>
          <Flex flex={1} flexDirection="row">
            <Text variant="md">{`Articles featuring ${props.artistNames || ""}`}</Text>
            {!!props?.totalCount && (
              <Text variant="xs" color="blue100" ml={0.5} mt={-0.5}>
                {props?.totalCount}
              </Text>
            )}
          </Flex>

          <Flex my="auto">
            <ArrowRightIcon width={12} fill="black60" ml={0.5} />
          </Flex>
        </Flex>
      </TouchableOpacity>

      <FlatList<MyCollectionArtworkArticles_article[number]>
        testID="test-articles-flatlist"
        horizontal
        ItemSeparatorComponent={() => <Spacer ml="2" />}
        scrollsToTop={false}
        style={{ overflow: "visible" }}
        initialNumToRender={2}
        data={articles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ArticleCardContainer article={item} />}
      />
    </Flex>
  )
}

const articleFragment = graphql`
  fragment MyCollectionArtworkArticles_article on Article @relay(plural: true) {
    id
    ...ArticleCard_article
  }
`
