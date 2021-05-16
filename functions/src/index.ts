//get reference to the firebase admin defined in package.json
const admin = require('firebase-admin')

//this service account file is available in the server folder of this project, this was created at GCC
//which gives admin access to the Firebase Project. This file is highly confidential and should not be uploaded to Git
const serviceAccount = require('../server/jinaryafire-firebase-adminsdk-db1fd-459c7721a7.json')
//Initialize the App with the service account
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://jinaryafire.firebaseio.com",
  storageBucket: "gs://jinaryafire.appspot.com"
})


//All the functions are imported from this line, visit the functions file for details on what these functions do
export { newUserCreated } from './forDevelopment/newUserCreated'
export { userDeleted } from './forDevelopment/userDeleted'

//Moved this to be done at the client itself, no need for a CF
// import sendUserFeedback = require('./ReportAndFeedback/sendUserFeedback')
// exports.sendUserFeedback = sendUserFeedback.sendUserFeedback

//User will directly upload reports to FS without the need for the CF
// import reportPerson = require('./ReportAndFeedback/reportPerson')
// exports.reportPerson = reportPerson.reportThePerson

//User will directly upload reports to FS without the need for the CF
// import reportContent = require('./ReportAndFeedback/reportContent')
// exports.reportContent = reportContent.reportTheContent

import addNewFollower = require('./FollowFunctions/addNewFollower')
exports.addNewFollower = addNewFollower.addNewFollower

import acceptFollowRequest = require('./FollowFunctions/acceptFollowRequest')
exports.acceptFollowRequest = acceptFollowRequest.acceptFollowRequest

import cancelFollowRequest = require('./FollowFunctions/cancelFollowRequest')
exports.cancelFollowRequest = cancelFollowRequest.cancelFollowRequest

import removeUnFollowerAsFollower = require('./FollowFunctions/removeUnFollowerAsFollower')
exports.removeUnFollowerAsFollower = removeUnFollowerAsFollower.removeUnFollowerAsFollower

import removeAsFollower = require('./FollowFunctions/removeAsFollower')
exports.removeAsFollower = removeAsFollower.removeAsFollower

import personBlocked = require('./FollowFunctions/personBlocked')
exports.personBlocked = personBlocked.personBlocked

import personUnBlocked = require('./FollowFunctions/personUnBlocked')
exports.personUnBlocked = personUnBlocked.personUnBlocked

import deactivateUser = require('./ReportAndFeedback/deactivateUser')
exports.deactivateUser = deactivateUser.deactivateUser

import reactivateUser = require('./ReportAndFeedback/reactivateUser')
exports.reactivateUser = reactivateUser.reactivateUser

import updateUserInfoAtFollowedPeople = require('./FollowFunctions/updateUserInfoAtFollowedPeople')
exports.updateUserInfoAtFollowedPeople = updateUserInfoAtFollowedPeople.updateUserInfoAtFollowedPeople

import updateUserInfoToFollowers = require('./FollowFunctions/updateUserInfoToFollowers')
exports.updateUserInfoToFollowers = updateUserInfoToFollowers.updateUserInfoToFollowers

//curently not in use, this function creates a thumbnail version of the profile image uploaded CS
//but does not retrieve the URL of the uploaded thumbnail Image, hence this done at the client for now
import profilePhotoThumbnail = require('./CloudStorageFunctions/profilePhotoThumbnail')
exports.profilePhotoThumbnail = profilePhotoThumbnail.profilePhotoThumbnail

import addNewCompliment = require('./Compliment/addNewCompliment')
exports.addNewCompliment = addNewCompliment.addNewCompliment

import updateUserInfoAtComplimentLikes = require('./Compliment/updateUserInfoAtComplimentLikes')
exports.updateUserInfoAtComplimentLikes = updateUserInfoAtComplimentLikes.updateUserInfoAtComplimentLikes

import updateUserInfoAtComplimentsSentNumbers = require('./Compliment/updateUserInfoAtComplimentsSentNumbers')
exports.updateUserInfoAtComplimentsSentNumbers = updateUserInfoAtComplimentsSentNumbers.updateUserInfoAtComplimentsSentNumbers

import decrementCompSentNoAndDeleteCompImage = require('./Compliment/decrementCompSentNoAndDeleteCompImage')
exports.decrementCompSentNoAndDeleteCompImage = decrementCompSentNoAndDeleteCompImage.decrementCompSentNoAndDeleteCompImage

import notificationDocsLimit = require('./Notifications/notificationDocsLimit')
exports.notificationDocsLimit = notificationDocsLimit.notificationDocsLimit

import decrementNoOfNotificationsReceived = require('./Notifications/decrementNoOfNotificationsReceived')
exports.decrementNoOfNotificationsReceived = decrementNoOfNotificationsReceived.decrementNoOfNotificationsReceived

import pokeForInsights = require('./Insights/pokeForInsights')
exports.pokeForInsights = pokeForInsights.pokeForInsights

import sendNotificationToPokers = require('./Insights/sendNotificationToPokers')
exports.sendNotificationToPokers = sendNotificationToPokers.sendNotificationToPokers

import updateUserDetailsAtCompsSent = require('./Compliment/updateUserDetailsAtCompsSent')
exports.updateUserDetailsAtCompsSent = updateUserDetailsAtCompsSent.updateUserDetailsAtCompsSent

import sendCompLikeNotificationToReceiver = require('./Compliment/sendCompLikeNotificationToReceiver')
exports.sendCompLikeNotificationToReceiver = sendCompLikeNotificationToReceiver.sendCompLikeNotificationToReceiver

import sendCompLikeNotificationToSender = require('./Compliment/sendCompLikeNotificationToSender')
exports.sendCompLikeNotificationToSender = sendCompLikeNotificationToSender.sendCompLikeNotificationToSender

import incrementNoOfFollowers = require('./FollowFunctions/incrementNoOfFollowers')
exports.incrementNoOfFollowers = incrementNoOfFollowers.incrementNoOfFollowers

import decrementNoOfFollowers = require('./FollowFunctions/decrementNoOfFollowers')
exports.decrementNoOfFollowers = decrementNoOfFollowers.decrementNoOfFollowers

import sendInsightLikeNotificationToOwner = require('./Insights/sendInsightLikeNotificationToOwner')
exports.sendInsightLikeNotificationToOwner = sendInsightLikeNotificationToOwner.sendInsightLikeNotificationToOwner

import populateWhatsNew = require('./WhatsNew/populateWhatsNew')
exports.populateWhatsNew = populateWhatsNew.populateWhatsNew

import whatsNewCollectionMaintenance = require('./WhatsNew/whatsNewCollectionMaintenance')
exports.whatsNewCollectionMaintenance = whatsNewCollectionMaintenance.whatsNewCollectionMaintenance

import deleteWhatsNewDocWhenCompReceivedDeleted = require('./WhatsNew/deleteWhatsNewDocWhenCompReceivedDeleted')
exports.deleteWhatsNewDocWhenCompReceivedDeleted = deleteWhatsNewDocWhenCompReceivedDeleted.deleteWhatsNewDocWhenCompReceivedDeleted

import deleteWhatsNewDocWhenInsightAddedDeleted = require('./WhatsNew/deleteWhatsNewDocWhenInsightAddedDeleted')
exports.deleteWhatsNewDocWhenInsightAddedDeleted = deleteWhatsNewDocWhenInsightAddedDeleted.deleteWhatsNewDocWhenInsightAddedDeleted


//for Development functions

import logDataSentByClient = require('./forDevelopment/logDataSentByClient')
exports.logDataSentByClient = logDataSentByClient.logDataSentByClient
