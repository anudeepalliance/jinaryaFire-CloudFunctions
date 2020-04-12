// Just import the functions from other files
// import * as functions from 'firebase-functions'
const admin = require('firebase-admin')
admin.initializeApp()

//export the functions in other files, callable https functions 
//dont work if they are in other files hence they are declared in this file
export { newUserSignUp } from './userCreated'
export { userDeleted } from './userDeleted'

//https callable function triggered when client sends feedback
import sendUserFeedback = require('./sendUserFeedback')
exports.sendUserFeedback = sendUserFeedback.sendFeedback

//When client followes a user, it  calls a callable function to add follower(himself)
//to the followee's followers sub collection
import addNewFollower = require('./addNewFollower')
exports.addNewFollower = addNewFollower.newFollowerGained

//When client un-follows a user, it  calls a callable function to remove follower(himself)
//from the unfollowee's followers sub collection
import removeFollower = require('./removeFollower')
exports.removeFollower = removeFollower.removeTheFollower