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

//When client followes a user, it  calls a callable function to add follower(himself)
//to the followee's followers sub collection
// import addNewFollower = require('./FollowFunctions/addNewFollower')
// exports.addNewFollower = addNewFollower.newFollowerGained

//When client followes a user, a firestore .onCreate() background function is triggered to add follower
//to the followee's followers sub collection
import addNewFollowerFsTrigger = require('./FollowFunctions/FsTriggeredFunctions/addNewFollowerFsTriggered')
exports.addNewFollowerFsTrigger = addNewFollowerFsTrigger.addTheNewFollowerFsTriggered

//When client un-follows a user, it  calls a callable function to remove follower(himself)
//from the unfollowee's followers sub collection
// import removeUserAsFollower = require('./FollowFunctions/removeUserAsFollower')
// exports.removeUserAsFollower = removeUserAsFollower.removeTheUserAsFollower

//When client un-follows a user, it calls a background FS triggered function to remove follower(the client)
//from the unfollowee's followers sub collection
import removeUserAsFollowerFsTriggered = require('./FollowFunctions/FsTriggeredFunctions/removeUserAsFollowerFsTriggered')
exports.removeUserAsFollowerFsTriggered = removeUserAsFollowerFsTriggered.removeUserAsTheFollowerFsTriggered


//When client blocks a person, it  calls a callable function to remove blocker(himself)
//from the blocked person's following sub collection
import stopFollowingBlockerAddToBlockedBy = require('./FollowFunctions/stopFollowingBlockerAndAddToBlockedBy')
exports.stopFollowingBlockerAddToBlockedBy = stopFollowingBlockerAddToBlockedBy.stopFollowingTheBlockerAndToBlockedBy

//When client unBlocks a person, it  calls a callable function to remove unblockee(himself)
//from the blockedBy Sub Col of the blocked
import removeUnBlockeeFromBlockedBy = require('./FollowFunctions/removeUnBlockeeFromBlockedBy')
exports.removeUnBlockeeFromBlockedBy = removeUnBlockeeFromBlockedBy.removeTheUnBlockeeFomBlockedBy

//When a user updates his userDoc like name or UserName then this updated info needs to be
//reflected in the followees' followers sub coll of all the other users that the this user to following
import updateUserInfoToFollowees = require('./FollowFunctions/updateUserInfoToFollowees')
exports.updateUserInfoToFollowees = updateUserInfoToFollowees.updateUserInfoToTheFollowees

//When a user updates his userDoc like name or UserName then this updated info needs to be
//reflected in the followers' following doc of all the other users that is a follower of this user 
import updateUserInfoToFollowers = require('./FollowFunctions/updateUserInfoToFollowers')
exports.updateUserInfoToFollowers = updateUserInfoToFollowers.updateUserInfoToTheFollowers