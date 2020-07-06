import * as functions from 'firebase-functions'
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore'
const admin = require('firebase-admin')
const utilityFunctions = require('frequentFunctions')

//When client followes a user, a firestore .onCreate() background function is triggered to
//1.add follower to the followed's followers sub collection
//2.an FCM notification to sent to the users
//3.A Notification doc is added to Notification Sub Collection
export const addTheNewFollower = functions.region('asia-east2').firestore.document
  ('Users/{followerUserId}/following/{followedUserId}').onCreate((data, context) => {

    //get follower and followee Uids for identification
    const followedUid = context.params.followedUserId
    //for identification and notification payload data (Intent Extras for client)
    const followerUid = context.params.followerUserId

    // Check if follower is blocked by the followed, if yes then throw an error
    return admin.firestore().collection('Users').doc(followedUid).collection('blocked')
      .doc(followerUid).get().then((blockedFollower: DocumentSnapshot ) => {
        if (blockedFollower.exists) {
          //print a message to console that follower was not added
          console.log('cannot add follower, follower is blocked by followed')
          //remove the followed from follower's following sub coll
          return admin.firestore().collection('Users').doc(followerUid)
            .collection('following').doc(followedUid).delete()

        } else {
          //Follower is not blocked by followed so carry on with the logic

          //Find out if Followed is following the Follower already
          return admin.firestore().collection('Users').doc(followedUid).collection('following')
            .doc(followerUid).get().then((followerPerson: DocumentSnapshot) => {

              let followedFollowingBack = false

              //if doc exists mean followed is following the follower so set the variable to true
              if (followerPerson.exists) {
                followedFollowingBack = true
              }

              //Get Follower user details that needs to be duplicated to the Followed's follower Sub Coll
              //And also added to the notification Payload data
              return admin.firestore().collection('Users').doc(followerUid).collection('ProfileInfo')
                .doc(followerUid).get().then((followerUserProfileDoc: DocumentSnapshot) => {


                  //The FollowerPerson object which will be pushed to the followers sub collection of followed
                  const followerData = {
                    name: followerUserProfileDoc.data()!.name,
                    nameLowerCase: followerUserProfileDoc.data()!.name.toLowerCase().toString(),
                    userName: followerUserProfileDoc.data()!.userName,
                    uid: followerUid,
                    followedAt: Date.now(),
                    //is the followed following back the follower,
                    followingBack: followedFollowingBack,
                    //not adding noOfComplimentsSent as that is added by a different CF
                    bio: followerUserProfileDoc.data()!.bio
                  }

                  const followerThumbnailImageUrl = followerUserProfileDoc.data()!.photoUrl

                  //get the notification token of the followed to identify & send notification to his device
                  return admin.firestore().collection('Users').doc(followedUid).collection('notificationToken')
                    .doc('theNotificationToken').get().then((notificationTokenDoc: DocumentSnapshot) => {

                      //the fields to be same as the ones at Fs
                      const followedNotificationToken = notificationTokenDoc.data()!.notificationToken

                      //Create the Notification Payload content
                      const notificationPayload = {
                        notification: {
                          title: 'You have a new Follower',
                          body: `${followerData.userName}`,
                          //Add an additional intent filter in manifest file for android for the activity with the name 
                          //same as the clickAction here or Off Screen Notification click action wont work
                          clickAction: ".People.PersonProfileActivity",
                          image: `${followerThumbnailImageUrl}`
                        },
                        data: {
                          ACTIVITY_NAME: "PERSON_PROFILE_ACTIVITY",
                          //The below field name to be same as the one used in the client
                          PERSON_UID_INTENT_EXTRA: followerUid,
                          PERSON_NAME_INTENT_EXTRA: followerData.name,
                          PERSON_USERNAME_INTENT_EXTRA: followerData.userName,
                          PERSON_BIO_INTENT_EXTRA: followerData.bio,
                          //If the app is in the foreground then this channel will be used to trigger a notification and this channel has to
                          //be created at the client else, this will fail
                          CHANNEL_ID: "Follow Update ID"
                        }
                      }

                      const nofiticationDocId = utilityFunctions.randomId()
                      
                      const notificationObject = {
                        message: `${followerData.bio}`,
                        receivedTime: Date.now(),
                        senderUserName: followerData.userName,
                        senderUid: followerData.uid,
                        //this will be false by default, will turn true at client when clicked
                        wasClicked: false,
                        //this type has be same as in the client
                        notificationChannelId: "Follow Update ID",
                        intentToActivity: "PERSON_PROFILE_ACTIVITY",
                        intentExtrasUid: followerData.uid,
                        intentExtrasName: followerData.name,
                        intentExtrasUserName: followerData.userName,
                        intentExtrasBio: followerData.bio,
                        //This is needed for client to access this doc and update the wasClicked field
                        contentId: followerUid,
                        notificationId: nofiticationDocId
                      }


                      const promises = []
                      //Add the follower to the followee sub-collection
                      const p = admin.firestore().collection('Users').doc(followedUid).collection('followers').doc(followerUid).set(followerData)
                      promises.push(p)
                      //Add the notification doc to the user's notification sub collection
                      const p1 = admin.firestore().collection('Users').doc(followedUid).collection('Notifications').doc(followerUid).set(notificationObject)
                      promises.push(p1)
                      //Check if the notificationToken is not null only then attempt to send as it will fail without it anyways
                      //if ( followeeNotificationToken ) {
                      //Send the notification to the user
                      const p2 = admin.messaging().sendToDevice(followedNotificationToken, notificationPayload)
                      promises.push(p2)
                      //run all the promises
                      return Promise.all(promises)
                    })

                })

            })

        }

      })

  })