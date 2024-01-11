declare module '#auth-utils' {
  interface UserSession {
    sub: string
    name: string
    email: string
    picture: string
    locale: string
  }
}
export {}

export default oauth.googleEventHandler({
  config: {
    scope: ['email', 'profile'],
    redirectUrl: '/auth/google'
  },
  async onSuccess(event, { user }) {
    // @ts-expect-error package type issue
    await setUserSession(event, { user })
    return sendRedirect(event, '/')
  }
})
