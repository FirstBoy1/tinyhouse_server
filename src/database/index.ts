import { MongoClient } from 'mongodb'
import { Database } from '../lib/types'

const uri = `mongodb://${process.env.DB_USER}/?readPreference=primary&ssl=false`

export const connectDatabase = async (): Promise<Database> => {
  const client = await MongoClient.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })

  const db = client.db('tinyhouse')

  return {
    listings: db.collection('listings'),
  }
}
