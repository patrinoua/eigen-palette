global.__TEST__ = false
global.__STORYBOOK__ = false

// for more info about metaflags, look [here](/docs/metaflags.md)
let metaflags = {
  startStorybook: false,
}
if (__DEV__) {
  try {
    const fileContents = require("./metaflags.json")
    metaflags = { ...metaflags, ...fileContents }
  } catch {}
}

require("./src/app/errorReporting/sentrySetup").setupSentry({ environment: "bootstrap" })

require("./src/storybook")

// add a comment
