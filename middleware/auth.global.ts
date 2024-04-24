export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn } = useUserSession()
  if (to.name === 'chat' && !loggedIn.value) {
    return navigateTo('/')
  }
  if (to.name === 'index' && loggedIn.value) {
    return navigateTo('/chat') 
  }
})
