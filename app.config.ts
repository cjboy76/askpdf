export default defineAppConfig({
    ui: {
      primary: 'teal',
      gray: 'cool',
      notifications: {
        // Show toasts at the top right of the screen
        position: 'top-0 bottom-auto',
      },
      notification: {
        default: {
          timeout: 2000
        }
      }
    }
  })
  