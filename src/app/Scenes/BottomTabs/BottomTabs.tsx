import { GlobalStore, useIsStaging } from "app/store/GlobalStore"
import { Flex, Separator, useTheme } from "palette"
import React, { useEffect } from "react"
import useInterval from "react-use/lib/useInterval"

export const BottomTabs: React.FC = () => {
  const { color } = useTheme()

  const unreadConversationCount = GlobalStore.useAppState(
    (state) => state.bottomTabs.sessionState.unreadConversationCount
  )

  useEffect(() => {
    GlobalStore.actions.bottomTabs.fetchCurrentUnreadConversationCount()
  }, [])

  useInterval(() => {
    GlobalStore.actions.bottomTabs.fetchCurrentUnreadConversationCount()
    // run this every 60 seconds
  }, 1000 * 60)

  const isStaging = useIsStaging()

  return null
}
