// Just import the functions from other files
// import * as functions from 'firebase-functions'
const admin = require('firebase-admin')

const serviceAccount = require('./server/jinaryafire-firebase-adminsdk-db1fd-7d896fb9d8.json')

//The initialization should happen only once hence this line does not appear in other files
// admin.initializeApp()
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://jinaryafire.firebaseio.com"
});

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

//https callable function triggered when client reports Content either a compliment or insight
import reportContent = require('./ReportAndFeedback/reportContent')
exports.reportContent = reportContent.reportTheContent

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
import stopBlockedFromFollowingAndAddToHisBlockedBy = require('./FollowFunctions/stopBlockedFromFollowingAndAddToHisBlockedBy')
exports.stopBlockedFromFollowingAndAddToHisBlockedBy = stopBlockedFromFollowingAndAddToHisBlockedBy.stopBlockedFromFollowingAndAddToTheHisBlockedBy

//When client unBlocks a person, it  calls a callable function to remove unblockee(himself)
//from the blockedBy Sub Col of the blocked
import removeUnBlockeeFromBlockedBy = require('./FollowFunctions/removeUnBlockeeFromBlockedBy')
exports.removeUnBlockeeFromBlockedBy = removeUnBlockeeFromBlockedBy.removeTheUnBlockeeFromBlockedBy


//When a user updates his userDoc like name or UserName then this updated info needs to be
//reflected in the followees' followers sub coll of all the other users that the this user to following
import updateUserInfoAtFollowedPeople = require('./FollowFunctions/updateUserInfoAtFollowedPeople')
exports.updateUserInfoAtFollowedPeople = updateUserInfoAtFollowedPeople.updateUserInfoAtTheFollowedPeople

//When a user updates his userDoc like name or UserName then this updated info needs to be
//reflected in the followers' following doc of all the other users that is a follower of this user 
import updateUserInfoToFollowers = require('./FollowFunctions/updateUserInfoToFollowers')
exports.updateUserInfoToFollowers = updateUserInfoToFollowers.updateUserInfoToTheFollowers


//When an Image is upload to Cloud Storage which can only be the profilePhotos of users,
//generate thumbnail in 100 * 100px  and save it back to the same folder in Cloud Storage
// import profilePhotoThumbnail = require('./CloudStorageFunctions/profilePhotoThumbnail')
// exports.profilePhotoThumbnail = profilePhotoThumbnail.profilePhotoMakeThumbnail


//When a compliment is sent by the user then the following are done
//1.it is added to the compliments received sub collection of the receiver via callable Cf as the sender does not have permission to write that sub collection
//2.A Notification payload is created and sent via FCM to the client
//3. A Notification Object is created and added to the Notifications Sub Collection of the Client
import addNewCompliment = require('./Compliment/addNewCompliment')
exports.addNewCompliment = addNewCompliment.addTheNewCompliment

//When a user updates his userDoc like name or UserName then this updated info needs to be
//reflected in the complimentlikes coll of all the compliments that he has liked
import updateUserInfoAtComplimentLikes = require('./Compliment/updateUserInfoAtComplimentLikes')
exports.updateUserInfoAtComplimentLikes = updateUserInfoAtComplimentLikes.updateUserInfoAtTheComplimentLikes

//When a user updates his userDoc like name or UserName then this updated info needs to be
//reflected in the complimentSentNumbers coll of all users who have sent this person a compliment
import updateUserInfoAtComplimentsSentNumbers = require('./Compliment/updateUserInfoAtComplimentsSentNumbers')
exports.updateUserInfoAtComplimentsSentNumbers = updateUserInfoAtComplimentsSentNumbers.updateUserInfoAtTheComplimentsSentNumbers

//When a receiver deletes a compliment received then reduce the no of compliments sent
//at sender's complimentsSentNos sub Collection
import decrementComplimentsSentNo = require('./Compliment/decrementComplimentsSentNo')
exports.decrementComplimentsSentNo = decrementComplimentsSentNo.decrementTheComplimentsSentNo

//When a new notification Doc is added to the Notificatons Sub Coll
//Check for the notificationNumbers Doc, if it is greater than 99 then delete the oldest notificationDoc
//else just increment the noOfNotifications received by 1
import notificationDocsLimit = require('./Maintenance/notificationDocsLimit')
exports.notificationDocsLimit = notificationDocsLimit.deleteThe101thNotificationDoc

//When a poke is received by a user then do the following
//1.Check if the poker is present in the pokersForInsights sub collection of the poked, 
//If yes then just return else continue with the function
//2.Add Poker to the pokersForInsights sub collection of the poked
//3.A Notification payload is created and sent via FCM to the client
//4. Create and add a Notification Doc of the type Insight Pokes
import pokeForInsights = require('./Insights/pokeForInsights')
exports.pokeForInsights = pokeForInsights.pokeForTheInsights

//When a poked adds an Insights, do the following:
//1. Check if there are some pending pokers in the pokersForInsights Sub Collection
//2. If yes then get their Notification Tokens and send them all a notification
//3. Then delete the pokers from the sub collection
import sendNotificationToPokers = require('./Insights/sendNotificationToPokers')
exports.sendNotificationToPokers = sendNotificationToPokers.sendNotificationToThePokers

//When a new notification Doc is added to the Notificatons Sub Coll
//Check for the notificationNumbers Doc, if it is greater than 99 then delete the oldest notificationDoc
//else just increment the noOfNotifications received by 1
// import generateRandomDocId = require('./Utils/utilityFunctions')
// exports.generateRandomDocId = theRandomDocumentId(28)

//When a user blocks another user then set the compsReceived senderBlocked field to true
//So the blocker or blocked dont see the compliments exchanged between them
import blockCompsReceived = require('./Compliment/blockCompsReceived')
exports.blockCompsReceived = blockCompsReceived.blockTheCompsReceived

//When a user blocks another user then set the compliments Sent receivedBlocked field to true
//So the blocker or blocked dont see the compliments exchanged between them
import blockCompsSent = require('./Compliment/blockCompsSent')
exports.blockCompsSent = blockCompsSent.blockTheCompsSent

//When a user unBlocks another user then set the compsReceived senderBlocked field to false
//So the unBlocker and UnBlocked can see the compliments exchanged between them
import unBlockCompsReceived = require('./Compliment/unBlockCompsReceived')
exports.unBlockCompsReceived = unBlockCompsReceived.unBlockTheCompsReceived

//When a user unBlocks another user then set the compliments Sent receivedBlocked field to false
//So the unBlocker or unBlocked can see the compliments exchanged between them
import unBlockCompsSent = require('./Compliment/unBlockCompsSent')
exports.unBlockCompsSent = unBlockCompsSent.unBlockTheCompsSent

//When a user follows another user then set the compsReceived from the followed person
//following status field to true so that comp receiver has the updated comp received doc
import markFollowedPersonCompsReceivedToTrue = require('./Compliment/markFollowedPersonCompsReceivedToTrue')
exports.markFollowedPersonCompsReceivedToTrue = markFollowedPersonCompsReceivedToTrue.markTheFollowedPersonCompsReceivedToTrue

//When a user UnFollows another user then set the compsReceived from the UnFollowed person
//following status field to false so that comp receiver has the updated comp received doc
import markUnFollowedCompsReceivedToFalse = require('./Compliment/markUnFollowedCompsReceivedToFalse')
exports.markUnFollowedCompsReceivedToFalse = markUnFollowedCompsReceivedToFalse.markTheUnFollowedCompsReceivedToFalse

//When a user updates his userDoc with name or UserName then this updated info needs to be
//reflected in all the compliments Sent Docs by this person, this will run only if name or userName was changed
import updateUserDetailsAtCompsSent = require('./Compliment/updateUserDetailsAtCompsSent')
exports.updateUserDetailsAtCompsSent = updateUserDetailsAtCompsSent.updateTheUserDetailsAtCompsSent

//When a person likes a compliment, then send a notification to the comp receiver if the liker is not the receiver
//and add a notificationDoc to their notifications Sub Coll as long as they are not the same as liker
import sendCompLikeNotificationToReceiver = require('./Compliment/sendCompLikeNotificationToReceiver')
exports.sendCompLikeNotificationToReceiver = sendCompLikeNotificationToReceiver.sendTheCompLikeNotificationToReceiver

//When a person likes a compliment, then send a notification to the comp sender if the liker is not the sender
//and add a notificationDoc to their notifications Sub Coll
import sendCompLikeNotificationToSender = require('./Compliment/sendCompLikeNotificationToSender')
exports.sendCompLikeNotificationToSender = sendCompLikeNotificationToSender.sendTheCompLikeNotificationToSender

//When a follower doc is added to the User's followers sub coll then
//increase noOfFollowers field by 1 the profileInfo doc
import incrementNoOfFollowers = require('./FollowFunctions/incrementNoOfFollowers')
exports.incrementNoOfFollowers = incrementNoOfFollowers.incrementTheNoOfFollowers

//When a follower doc is added to the User's followers sub coll then
//decrease noOfFollowers field by 1 the profileInfo doc
import decrementNoOfFollowers = require('./FollowFunctions/decrementNoOfFollowers')
exports.decrementNoOfFollowers = decrementNoOfFollowers.decrementTheNoOfFollowers