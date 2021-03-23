require('dotenv').config()

import { connectDatabase } from '../src/database'

async function seed() {
  try {
    console.log('[clear]: running...')
    const db = await connectDatabase()

    const bookings = await db.bookings.find({}).toArray()
    const users = await db.users.find({}).toArray()
    const listings = await db.listings.find({}).toArray()

    if (listings.length > 0) {
      await db.listings.drop()
    }
    if (users.length > 0) {
      await db.users.drop()
    }
    if (bookings.length > 0) {
      await db.bookings.drop()
    }

    console.log('[clear]: success')
    process.exit()
  } catch {
    throw new Error('[clear]: failed to clear database')
  }
}

seed()
