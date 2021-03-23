import merge from 'lodash.merge'
import { viewerResolvers } from './resolvers/Viewer'
import { userResolvers } from './resolvers/User'

export const resolvers = merge(viewerResolvers, userResolvers)
