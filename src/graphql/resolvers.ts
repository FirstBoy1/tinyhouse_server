import merge from 'lodash.merge'
import { viewerResolvers } from './resolvers/Viewer'
import { userResolvers } from './resolvers/User'
import { listingResolvers } from './resolvers/Listing'
import { bookingResolvers } from './resolvers/Booking'

export const resolvers = merge(
  viewerResolvers,
  userResolvers,
  listingResolvers,
  bookingResolvers
)
