import crypto from 'crypto'
import { IResolvers } from 'apollo-server-express'
import { Google } from '../../../lib/api'
import { Database, User, Viewer } from '../../../lib/types'
import { LoginArgs } from './types'
import { Response } from 'express'

const cookieOptions = {
  httpOnly: true,
  sameSite: true,
  signed: true,
  secure: process.env.NODE_ENV === 'development' ? false : true,
}

const loginViaGoogle = async (
  code: string,
  token: string,
  db: Database,
  res: Response
): Promise<User | undefined> => {
  const { user } = await Google.login(code)

  if (!user) {
    throw new Error('Google login error')
  }

  const userNamesList = user.names && user.names.length ? user.names : null
  const userPhotosList = user.photos && user.photos.length ? user.photos : null
  const userEmailList =
    user.emailAddresses && user.emailAddresses.length
      ? user.emailAddresses
      : null

  const username = userNamesList?.[0]?.displayName
  const userId = userNamesList?.[0]?.metadata?.source?.id
  const userAvatar = userPhotosList?.[0].url
  const userEmail = userEmailList?.[0].value

  if (!userId || !username || !userAvatar || !userEmail) {
    throw new Error('Google login error')
  }

  const updateRes = await db.users.findOneAndUpdate(
    { _id: userId },
    {
      $set: {
        name: username,
        avatar: userAvatar,
        contact: userEmail,
        token,
      },
    },
    { returnOriginal: false }
  )

  let viewer = updateRes.value

  if (!viewer) {
    const insertResult = await db.users.insertOne({
      _id: userId,
      token,
      name: username,
      avatar: userAvatar,
      contact: userEmail,
      income: 0,
      bookings: [],
      listings: [],
    })

    viewer = insertResult.ops[0]
  }

  res.cookie('viewer', userId, {
    ...cookieOptions,
    maxAge: 365 * 24 * 60 * 60 * 1000,
  })

  return viewer
}

const loginViaCookie = async (
  token: string,
  db: Database,
  req: Request,
  res: Response
): Promise<User | undefined> => {
  const updateRes = await db.users.findOneAndUpdate(
    // @ts-ignore
    { _id: req.signedCookies.viewer },
    { $set: { token } },
    { returnOriginal: false }
  )

  const viewer = updateRes.value

  if (!viewer) {
    res.clearCookie('viewer', cookieOptions)
  }

  return viewer
}

export const viewerResolvers: IResolvers = {
  Query: {
    authUrl: (): string => {
      try {
        return Google.authUrl
      } catch (error) {
        throw new Error(`Failed to query Google Auth Url: ${error}`)
      }
    },
  },
  Mutation: {
    login: async (
      _root: undefined,
      { input }: LoginArgs,
      { db, req, res }: { db: Database; req: Request; res: Response }
    ) => {
      try {
        const code = input ? input.code : null
        const token = crypto.randomBytes(16).toString('hex')

        const viewer: User | undefined = code
          ? await loginViaGoogle(code, token, db, res)
          : await loginViaCookie(token, db, req, res)

        if (!viewer) {
          return { didRequest: true }
        }

        return {
          _id: viewer._id,
          token: viewer.token,
          avatar: viewer.avatar,
          walletId: viewer.walletId,
          didRequest: true,
        }
      } catch (error) {
        throw new Error(`Failed to login: ${error}`)
      }
    },
    logout: (
      _root: undefined,
      _args: undefined,
      { res }: { res: Response }
    ) => {
      try {
        res.clearCookie('viewer', cookieOptions)

        return { didRequest: true }
      } catch (error) {
        throw new Error(`Failed to logout: ${error}`)
      }
    },
  },
  Viewer: {
    id: (viewer: Viewer): string | undefined => {
      return viewer._id
    },
    hasWallet: (viewer: Viewer): true | undefined => {
      return viewer.walletId ? true : undefined
    },
  },
}
