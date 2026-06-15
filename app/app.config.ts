export default defineAppConfig({
  ui: {
    button: {
      slots: {
        base: 'border-2 border-stone-900',
        // If the button is active, switch color to white.
        variants: {
          primary: 'text-white'
        }
      }
    },
    drawer: {
      slots: {
        overlay: 'fixed inset-0 backdrop-blur-sm',
      }
    }
  }
})