require('dotenv').config()

import express, { Application } from 'express'
import { ApolloServer } from 'apollo-server-express'
import cookieParser from 'cookie-parser'

import { resolvers, typeDefs } from './graphql'
import { connectDatabase } from './database'

async function mount(app: Application) {
  app.use(cookieParser(process.env.SECRET))

  const db = await connectDatabase()
  const server = new ApolloServer({
    resolvers,
    typeDefs,
    context: ({ req, res }) => ({ db, req, res }),
  })
  server.applyMiddleware({ app, path: '/api' })

  app.listen(process.env.PORT)
}

mount(express())
