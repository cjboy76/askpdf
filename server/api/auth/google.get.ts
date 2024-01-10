import { User } from '../../models/userModel'

declare module '#auth-utils' {
    interface UserSession {
        sub: string
        name: string
        email: string
        picture: string
        locale: string
    }
}
export { }

export default oauth.googleEventHandler({
    config: {
        scope: ['email', 'profile'],
        redirectUrl: '/auth/google'
    },
    async onSuccess(event, { user }) {
        try {
            await User.create({
                sub: user.sub,
                name: user.name,
                email: user.email,
                picture: user.picture,
                locale: user.locale
            })
        }
        catch (err) {
            console.log('err', err)
        }

        // @ts-expect-error package type issue
        await setUserSession(event, { user, loggedInAt: new Date() })
        return sendRedirect(event, '/')
    },
})