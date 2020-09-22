//get reference to the firebase admin defined in package.json
const admin = require('firebase-admin')

//this service account file is available in the server folder of this project, this was created at GCC
//which gives admin access to the Firebase Project. This file is highly confidential and not uploaded to Git
const serviceAccount = require('../server/jinaryafire-firebase-adminsdk-db1fd-7d77661d4e.json')

//Initialize the App with the service account
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://jinaryafire.firebaseio.com",
  storageBucket: "gs://jinaryafire.appspot.com"
})


//All the functions are imported from this line, visit the functions file for details on what these functions do
export { newUserSignUp } from './for Development/userCreated'
export { userDeleted } from './for Development/userDeleted'


import sendUserFeedback = require('./ReportAndFeedback/sendUserFeedback')
exports.sendUserFeedback = sendUserFeedback.sendFeedback


import reportPerson = require('./ReportAndFeedback/reportPerson')
exports.reportPerson = reportPerson.reportThePerson


import reportContent = require('./ReportAndFeedback/reportContent')
exports.reportContent = reportContent.reportTheContent

import addNewFollower = require('./FollowFunctions/addNewFollower')
exports.addNewFollower = addNewFollower.addTheNewFollower


import removeUserAsFollower = require('./FollowFunctions/removeUserAsFollower')
exports.removeUserAsFollower = removeUserAsFollower.removeUserAsTheFollower


import stopBlockedFromFollowingAndAddToHisBlockedBy = require('./FollowFunctions/stopBlockedFromFollowingAndAddToHisBlockedBy')
exports.stopBlockedFromFollowingAndAddToHisBlockedBy = stopBlockedFromFollowingAndAddToHisBlockedBy.stopBlockedFromFollowingAndAddToTheHisBlockedBy

import removeUnBlockeeFromBlockedBy = require('./FollowFunctions/removeUnBlockeeFromBlockedBy')
exports.removeUnBlockeeFromBlockedBy = removeUnBlockeeFromBlockedBy.removeTheUnBlockeeFromBlockedBy


import updateUserInfoAtFollowedPeople = require('./FollowFunctions/updateUserInfoAtFollowedPeople')
exports.updateUserInfoAtFollowedPeople = updateUserInfoAtFollowedPeople.updateUserInfoAtTheFollowedPeople

import updateUserInfoToFollowers = require('./FollowFunctions/updateUserInfoToFollowers')
exports.updateUserInfoToFollowers = updateUserInfoToFollowers.updateUserInfoToTheFollowers

//curently not in use, this function creates a thumbnail version of the profile image uploaded CS
//but does not retrieve the URL of the uploaded thumbnail Image, hence this done at the client for now
// import profilePhotoThumbnail = require('./CloudStorageFunctions/profilePhotoThumbnail')
// exports.profilePhotoThumbnail = profilePhotoThumbnail.profilePhotoMakeThumbnail


import addNewCompliment = require('./Compliment/addNewCompliment')
exports.addNewCompliment = addNewCompliment.addTheNewCompliment

import updateUserInfoAtComplimentLikes = require('./Compliment/updateUserInfoAtComplimentLikes')
exports.updateUserInfoAtComplimentLikes = updateUserInfoAtComplimentLikes.updateUserInfoAtTheComplimentLikes

import updateUserInfoAtComplimentsSentNumbers = require('./Compliment/updateUserInfoAtComplimentsSentNumbers')
exports.updateUserInfoAtComplimentsSentNumbers = updateUserInfoAtComplimentsSentNumbers.updateUserInfoAtTheComplimentsSentNumbers

import decrementCompSentNoAndDeleteCompImage = require('./Compliment/decrementCompSentNoAndDeleteCompImage')
exports.decrementCompSentNoAndDeleteCompImage = decrementCompSentNoAndDeleteCompImage.decrementTheCompSentNoAndDeleteCompImage

import notificationDocsLimit = require('./Maintenance/notificationDocsLimit')
exports.notificationDocsLimit = notificationDocsLimit.deleteThe101thNotificationDoc

import pokeForInsights = require('./Insights/pokeForInsights')
exports.pokeForInsights = pokeForInsights.pokeForTheInsights

import sendNotificationToPokers = require('./Insights/sendNotificationToPokers')
exports.sendNotificationToPokers = sendNotificationToPokers.sendNotificationToThePokers

import blockCompsReceived = require('./Compliment/blockCompsReceived')
exports.blockCompsReceived = blockCompsReceived.blockTheCompsReceived

import blockCompsSent = require('./Compliment/blockCompsSent')
exports.blockCompsSent = blockCompsSent.blockTheCompsSent

import unBlockCompsReceived = require('./Compliment/unBlockCompsReceived')
exports.unBlockCompsReceived = unBlockCompsReceived.unBlockTheCompsReceived

import unBlockCompsSent = require('./Compliment/unBlockCompsSent')
exports.unBlockCompsSent = unBlockCompsSent.unBlockTheCompsSent

import markFollowedPersonCompsReceivedToTrue = require('./Compliment/markFollowedPersonCompsReceivedToTrue')
exports.markFollowedPersonCompsReceivedToTrue = markFollowedPersonCompsReceivedToTrue.markTheFollowedPersonCompsReceivedToTrue

import markUnFollowedCompsReceivedToFalse = require('./Compliment/markUnFollowedCompsReceivedToFalse')
exports.markUnFollowedCompsReceivedToFalse = markUnFollowedCompsReceivedToFalse.markTheUnFollowedCompsReceivedToFalse

import updateUserDetailsAtCompsSent = require('./Compliment/updateUserDetailsAtCompsSent')
exports.updateUserDetailsAtCompsSent = updateUserDetailsAtCompsSent.updateTheUserDetailsAtCompsSent

import sendCompLikeNotificationToReceiver = require('./Compliment/sendCompLikeNotificationToReceiver')
exports.sendCompLikeNotificationToReceiver = sendCompLikeNotificationToReceiver.sendCompLikeNotificationToReceiver

import sendCompLikeNotificationToSender = require('./Compliment/sendCompLikeNotificationToSender')
exports.sendCompLikeNotificationToSender = sendCompLikeNotificationToSender.sendCompLikeNotificationToSender

import incrementNoOfFollowers = require('./FollowFunctions/incrementNoOfFollowers')
exports.incrementNoOfFollowers = incrementNoOfFollowers.incrementTheNoOfFollowers

import decrementNoOfFollowers = require('./FollowFunctions/decrementNoOfFollowers')
exports.decrementNoOfFollowers = decrementNoOfFollowers.decrementTheNoOfFollowers

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