import { reactive } from 'vue'

/**
 * Global reactive variables used throughout the application
 */
export const GlobalVars = reactive({
  isLoadingCapture: false,
  timeToLateCapture: 2000,
  showBorders: true,
  // Add other global variables as needed
})

export default GlobalVars
