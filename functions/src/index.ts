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
//to the followee's follwers arrayField in the UserDoc
import addNewFollower = require('./FollowFunctions/addNewFollower')
exports.addNewFollower = addNewFollower.newFollowerGained

//When client un-follows a user, it  calls a callable function to remove follower(himself)
//from the unfollowee's followers array field
import removeFollower = require('./FollowFunctions/removeFollower')
exports.removeFollower = removeFollower.removeTheFollower


//When client blocks a person, it  calls a callable function to remove blocker(himself)
//from the blocked person's following array field
import stopFollowingBlocked = require('./FollowFunctions/stopFollowingBlocked')
exports.stopFollowingBlocked = stopFollowingBlocked.stopFollowingTheBlocked

