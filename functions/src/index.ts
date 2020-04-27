// Just import the functions from other files
// import * as functions from 'firebase-functions'
const admin = require('firebase-admin')
//The initialization should happen only once hence this line does not appear in other files
admin.initializeApp()

//export the functions in other files, callable https functions 
//dont work if they are in other files hence they are declared in this file
export { newUserSignUp } from './for Development/userCreated'
export { userDeleted } from './for Development/userDeleted'

//https callable function triggered when client sends feedback
import sendUserFeedback = require('./ReportAndFeedback/sendUserFeedback')
exports.sendUserFeedback = sendUserFeedback.sendFeedback

//https callable function triggered when client reports a Person
import reportPerson = require('./ReportAndFeedback/reportPerson')
exports.reportPerson = reportPerson.reportThePerson

//When client followes a user, a firestore .onCreate() background function is triggered to
//1.add follower to the followee's followers sub collection
//2.an FCM notification to sent to the users
//3.A Notification doc is added to Notification Sub Collection
import addNewFollower = require('./FollowFunctions/addNewFollower')
exports.addNewFollower = addNewFollower.addTheNewFollower

//When client un-follows a user, it calls a background FS triggered function to remove follower(the client)
//from the unfollowee's followers sub collection
import removeUserAsFollower = require('./FollowFunctions/removeUserAsFollower')
exports.removeUserAsFollower = removeUserAsFollower.removeUserAsTheFollower


//When client blocks a person, it  calls a callable function to remove blocker(himself)
//from the blocked person's following sub collection
import stopFollowingBlockerAddToBlockedBy = require('./FollowFunctions/stopFollowingBlockerAndAddToBlockedBy')
exports.stopFollowingBlockerAddToBlockedBy = stopFollowingBlockerAddToBlockedBy.stopFollowingTheBlockerAndToBlockedBy

//When client unBlocks a person, it  calls a callable function to remove unblockee(himself)
//from the blockedBy Sub Col of the blocked
import removeUnBlockeeFromBlockedBy = require('./FollowFunctions/removeUnBlockeeFromBlockedBy')
exports.removeUnBlockeeFromBlockedBy = removeUnBlockeeFromBlockedBy.removeTheUnBlockeeFromBlockedBy


//When a user updates his userDoc like name or UserName then this updated info needs to be
//reflected in the followees' followers sub coll of all the other users that the this user to following
import updateUserInfoToFollowees = require('./FollowFunctions/updateUserInfoToFollowees')
exports.updateUserInfoToFollowees = updateUserInfoToFollowees.updateUserInfoToTheFollowees

//When a user updates his userDoc like name or UserName then this updated info needs to be
//reflected in the followers' following doc of all the other users that is a follower of this user 
import updateUserInfoToFollowers = require('./FollowFunctions/updateUserInfoToFollowers')
exports.updateUserInfoToFollowers = updateUserInfoToFollowers.updateUserInfoToTheFollowers


//When an Image is upload to Cloud Storage which can only be the profilePhotos of users,
//generate thumbnail and save it back to the same folder in Cloud Storage
import generateThumbnail = require('./CloudStorageFunctions/profilePhotoThumbnail')
exports.generateThumbnail = generateThumbnail.generateTheThumbnail