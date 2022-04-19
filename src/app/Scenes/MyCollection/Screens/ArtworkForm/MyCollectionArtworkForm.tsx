import { deleteCollectedArtwork } from "@artsy/cohesion"
import { useActionSheet } from "@expo/react-native-action-sheet"
import { NavigationContainer, NavigationContainerRef } from "@react-navigation/native"
import { createStackNavigator } from "@react-navigation/stack"
import { captureException } from "@sentry/react-native"
import { OldMyCollectionArtwork_sharedProps } from "__generated__/OldMyCollectionArtwork_sharedProps.graphql"
import { LengthUnitPreference } from "__generated__/UserPrefsModelQuery.graphql"
import LoadingModal from "app/Components/Modals/LoadingModal"
import { goBack } from "app/navigation/navigate"
import { updateMyUserProfile } from "app/Scenes/MyAccount/updateMyUserProfile"
import {
  cleanArtworkPayload,
  explicitlyClearedFields,
} from "app/Scenes/MyCollection/utils/cleanArtworkPayload"
import { GlobalStore } from "app/store/GlobalStore"
import { FormikProvider, useFormik } from "formik"
import { isEqual } from "lodash"
import React, { useEffect, useRef, useState } from "react"
import { Alert } from "react-native"
import { useTracking } from "react-tracking"
import { deleteArtworkImage } from "../../mutations/deleteArtworkImage"
import { myCollectionCreateArtwork } from "../../mutations/myCollectionCreateArtwork"
import { myCollectionDeleteArtwork } from "../../mutations/myCollectionDeleteArtwork"
import { myCollectionUpdateArtwork } from "../../mutations/myCollectionUpdateArtwork"
import { refreshMyCollection } from "../../MyCollection"
import { ArtworkFormValues } from "../../State/MyCollectionArtworkModel"
import { deletedPhotos } from "../../utils/deletedPhotos"
import { artworkSchema, validateArtworkSchema } from "./Form/artworkSchema"
import { removeLocalPhotos, storeLocalPhotos, uploadPhotos } from "./MyCollectionImageUtil"
import { MyCollectionAddPhotos } from "./Screens/MyCollectionArtworkFormAddPhotos"
import { MyCollectionArtworkFormArtist } from "./Screens/MyCollectionArtworkFormArtist"
import { MyCollectionArtworkFormArtwork } from "./Screens/MyCollectionArtworkFormArtwork"
import { MyCollectionArtworkFormMain } from "./Screens/MyCollectionArtworkFormMain"

export type ArtworkFormMode = "add" | "edit"

// This needs to be a `type` rather than an `interface` because there's
// a long-standing thing where a typescript `interface` will be treated a bit more strictly
// than the equivalent `type` in some situations.
// https://github.com/microsoft/TypeScript/issues/15300
// The react-navigation folks have written code that relies on the more permissive `type` behaviour.
// tslint:disable-next-line:interface-over-type-literal
export type ArtworkFormScreen = {
  ArtworkFormArtist: {
    mode: ArtworkFormMode
    clearForm(): void
    onDelete(): void
    onHeaderBackButtonPress(): void
  }
  ArtworkFormArtwork: {
    mode: ArtworkFormMode
    clearForm(): void
    onDelete(): void
    onHeaderBackButtonPress(): void
  }
  ArtworkFormMain: {
    mode: ArtworkFormMode
    clearForm(): void
    onDelete(): void
    onHeaderBackButtonPress(): void
  }
  AddPhotos: undefined
}

export type MyCollectionArtworkFormProps = { onSuccess?: () => void } & (
  | {
      mode: "add"
    }
  | {
      mode: "edit"
      onDelete: () => void
      artwork: Omit<OldMyCollectionArtwork_sharedProps, " $refType">
    }
)

const navContainerRef = { current: null as NavigationContainerRef | null }

export const MyCollectionArtworkForm: React.FC<MyCollectionArtworkFormProps> = (props) => {
  const { trackEvent } = useTracking()
  const { formValues, dirtyFormCheckValues } = GlobalStore.useAppState(
    (state) => state.myCollection.artwork.sessionState
  )

  const preferredCurrency = GlobalStore.useAppState((state) => state.userPrefs.currency)
  const preferredMetric = GlobalStore.useAppState((state) => state.userPrefs.metric)

  // we need to store the form values in a ref so that onDismiss can access their current value (prop updates are not
  // sent through the react-navigation system)
  const formValuesRef = useRef(formValues)
  formValuesRef.current = formValues

  const [loading, setLoading] = useState<boolean>(false)

  const { showActionSheetWithOptions } = useActionSheet()

  const handleSubmit = async (values: ArtworkFormValues) => {
    setLoading(true)
    try {
      await updateMyUserProfile({
        currencyPreference: preferredCurrency,
        lengthUnitPreference: preferredMetric.toUpperCase() as LengthUnitPreference,
      })
      await updateArtwork(values, dirtyFormCheckValues, props)
    } catch (e) {
      if (__DEV__) {
        console.error(e)
      } else {
        captureException(e)
      }
      Alert.alert("An error ocurred", typeof e === "string" ? e : undefined)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    return () => {
      GlobalStore.actions.myCollection.artwork.resetForm()
    }
  }, [])

  const formik = useFormik<ArtworkFormValues>({
    enableReinitialize: true,
    initialValues: formValues,
    initialErrors: validateArtworkSchema(formValues),
    onSubmit: handleSubmit,
    validationSchema: artworkSchema,
  })

  const onDelete =
    props.mode === "edit" && props.onDelete
      ? async () => {
          setLoading(true)
          trackEvent(tracks.deleteCollectedArtwork(props.artwork.internalID, props.artwork.slug))
          try {
            await myCollectionDeleteArtwork(props.artwork.internalID)
            refreshMyCollection()
            props.onDelete()
          } catch (e) {
            if (__DEV__) {
              console.error(e)
            } else {
              captureException(e)
            }
            Alert.alert("An error ocurred", typeof e === "string" ? e : undefined)
          } finally {
            setLoading(false)
          }
        }
      : undefined

  const clearForm = async () => {
    const formIsDirty = !isEqual(formValuesRef.current, dirtyFormCheckValues)

    if (formIsDirty) {
      const discardData = await new Promise((resolve) =>
        showActionSheetWithOptions(
          {
            title: "Do you want to discard your changes?",
            options: ["Discard", "Keep editing"],
            destructiveButtonIndex: 0,
            cancelButtonIndex: 1,
            useModal: true,
          },
          (buttonIndex) => {
            if (buttonIndex === 0) {
              resolve(true)
            }
          }
        )
      )
      if (!discardData) {
        return
      }
    }

    GlobalStore.actions.myCollection.artwork.resetFormButKeepArtist()
  }

  const onHeaderBackButtonPress = () => {
    const currentRoute = navContainerRef.current?.getCurrentRoute()
    const isFirstScreen =
      props.mode === "edit" || !currentRoute?.name || currentRoute?.name === "ArtworkFormArtist"

    // clear and exit the form if we're on the first screen
    if (isFirstScreen) {
      GlobalStore.actions.myCollection.artwork.resetForm()
      goBack()
      return
    }

    navContainerRef.current?.goBack()
  }

  return (
    <NavigationContainer independent ref={navContainerRef}>
      <FormikProvider value={formik}>
        <Stack.Navigator
          // force it to not use react-native-screens, which is broken inside a react-native Modal for some reason
          detachInactiveScreens={false}
          screenOptions={{
            headerShown: false,
            safeAreaInsets: { top: 0, bottom: 0, left: 0, right: 0 },
            cardStyle: { backgroundColor: "white" },
          }}
        >
          {props.mode === "add" && (
            <Stack.Screen
              name="ArtworkFormArtist"
              component={MyCollectionArtworkFormArtist}
              initialParams={{ onDelete, clearForm, onHeaderBackButtonPress }}
            />
          )}
          {props.mode === "add" && (
            <Stack.Screen
              name="ArtworkFormArtwork"
              component={MyCollectionArtworkFormArtwork}
              initialParams={{
                onDelete,
                clearForm,
                mode: props.mode,
                onHeaderBackButtonPress,
              }}
            />
          )}
          <Stack.Screen
            name="ArtworkFormMain"
            component={MyCollectionArtworkFormMain}
            initialParams={{ onDelete, clearForm, mode: props.mode, onHeaderBackButtonPress }}
          />
          <Stack.Screen name="AddPhotos" component={MyCollectionAddPhotos} />
        </Stack.Navigator>
        <LoadingModal isVisible={loading} />
      </FormikProvider>
    </NavigationContainer>
  )
}

const Stack = createStackNavigator<ArtworkFormScreen>()

export const updateArtwork = async (
  values: ArtworkFormValues,
  dirtyFormCheckValues: ArtworkFormValues,
  props: MyCollectionArtworkFormProps
) => {
  const {
    photos,
    artistSearchResult,
    pricePaidDollars,
    pricePaidCurrency,
    artist,
    artistIds,
    ...others
  } = values
  const externalImageUrls = await uploadPhotos(photos)

  let pricePaidCents
  if (pricePaidDollars && !isNaN(Number(pricePaidDollars))) {
    pricePaidCents = Number(pricePaidDollars) * 100
  }

  if (values.attributionClass !== "LIMITED_EDITION") {
    others.editionNumber = ""
    others.editionSize = ""
  }

  if (props.mode === "add") {
    const response = await myCollectionCreateArtwork({
      artistIds: [artistSearchResult!.internalID as string],
      externalImageUrls,
      pricePaidCents,
      pricePaidCurrency,
      ...cleanArtworkPayload(others),
    })

    const slug = response.myCollectionCreateArtwork?.artworkOrError?.artworkEdge?.node?.slug
    if (slug) {
      storeLocalPhotos(slug, photos)
    }
  } else {
    const response = await myCollectionUpdateArtwork({
      artistIds: [artistSearchResult!.internalID as string],
      artworkId: props.artwork.internalID,
      externalImageUrls,
      pricePaidCents: pricePaidCents ?? null,
      pricePaidCurrency,
      ...cleanArtworkPayload(others),
      ...explicitlyClearedFields(others, dirtyFormCheckValues),
    })

    const deletedImages = deletedPhotos(dirtyFormCheckValues.photos, photos)
    for (const photo of deletedImages) {
      await deleteArtworkImage(props.artwork.internalID, photo.id)
    }
    const slug = response.myCollectionUpdateArtwork?.artworkOrError?.artwork?.slug
    if (slug) {
      removeLocalPhotos(slug)
    }
  }

  refreshMyCollection()
  props.onSuccess?.()
}

const tracks = {
  deleteCollectedArtwork: (internalID: string, slug: string) => {
    return deleteCollectedArtwork({ contextOwnerId: internalID, contextOwnerSlug: slug })
  },
}
