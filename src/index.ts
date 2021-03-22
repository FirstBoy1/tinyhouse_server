require('dotenv').config()

import express, { Application } from 'express'
import { ApolloServer } from 'apollo-server-express'

import { resolvers, typeDefs } from './graphql'
import { connectDatabase } from './database'

async function mount(app: Application) {
  const db = await connectDatabase()
  const server = new ApolloServer({
    resolvers,
    typeDefs,
    context: () => ({ db }),
  })
  server.applyMiddleware({ app, path: '/api' })

  app.listen(process.env.PORT)
}

mount(express())
