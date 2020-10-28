import * as functions from 'firebase-functions'
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore'
const admin = require('firebase-admin')
const utilityFunctions = require('frequentFunctions')

//When client followes a user, a firestore .onCreate() background function is triggered to
//1.add follower to the followed's followers sub collection
//2.an FCM notification to sent to the followed
//3.A Notification doc is added to Notification Sub Collection of the Followed
export const addNewFollower = functions.region('asia-south1').firestore.document
  ('Users/{followerUserId}/following/{followedUserId}').onCreate((data, context) => {

    const db = admin.firestore()
    //get follower and followee Uids for identification
    const followedUid = context.params.followedUserId
    //for identification and notification payload data (Intent Extras for client)
    const followerUid = context.params.followerUserId
    //get reference to the follower's whatsNewSubColl
    const followerWhatsNewColl = db.collection('Users').doc(followerUid).collection('whatsNew')
    //get reference to the follower's noOfFollowedPersonUnReadWhatsNewItems
    const noOfFollowedPersonUnReadWhatsNewItemsDoc = db.collection('Users').doc(followerUid).collection('whatsNewRecords').doc('noOfFollowedPersonUnReadWhatsNewItems')

    return addFollower()

    async function addFollower() {

      // Check if follower is blocked by the followed, if yes then throw an error
      await db.collection('Users').doc(followedUid).collection('blocked')
        .doc(followerUid).get().then(async (blockedFollower: DocumentSnapshot) => {
          if (blockedFollower.exists) {
            //print a message to console that follower was not added
            console.log('cannot add follower, follower is blocked by followed')
            //remove the followed from follower's following sub coll
            await db.collection('Users').doc(followerUid)
              .collection('following').doc(followedUid).delete()

          } else {
            //Follower is not blocked by followed so carry on with the logic

            //Find out if Followed is following the Follower already
            await db.collection('Users').doc(followedUid).collection('following')
              .doc(followerUid).get().then(async (followerPerson: DocumentSnapshot) => {

                let followedFollowingBack = false

                //if doc exists mean followed is following the follower so set the variable to true
                if (followerPerson.exists) {
                  followedFollowingBack = true
                }

                //Get Follower user details that needs to be duplicated to the Followed's follower Sub Coll
                //And also added to the notification Payload data
                await db.collection('Users').doc(followerUid).collection('ProfileInfo')
                  .doc(followerUid).get().then(async (followerUserProfileDoc: DocumentSnapshot) => {


                    //The FollowerPerson object which will be pushed to the followers sub collection of followed
                    const followerData = {
                      name: followerUserProfileDoc.data()!.name,
                      nameLowerCase: followerUserProfileDoc.data()!.name.toLowerCase().toString(),
                      userName: followerUserProfileDoc.data()!.userName,
                      uid: followerUid,
                      followedYouAt: Date.now(),
                      //is the followed following back the follower,
                      followingBack: followedFollowingBack,
                    }

                    const followerThumbnailImageUrl = followerUserProfileDoc.data()!.photoUrl

                    //get the notification token of the followed to identify & send notification to his device
                    await db.collection('Users').doc(followedUid).collection('notificationToken')
                      .doc('theNotificationToken').get().then(async (notificationTokenDoc: DocumentSnapshot) => {

                        //the fields to be same as the ones at Fs
                        const followedNotificationToken = notificationTokenDoc.data()?.notificationToken

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
                            //If the app is in the foreground then this channel will be used to trigger a notification and this channel has to
                            //be created at the client else, this will fail
                            CHANNEL_ID: "Follow Update ID"
                          }
                        }

                        const nofiticationDocId = utilityFunctions.randomId()

                        const notificationObject = {
                          message: null,
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
                          //This is needed for client to access this doc and update the wasClicked field
                          contentId: followerUid,
                          notificationId: nofiticationDocId
                        }


                        //Add the follower to the followee sub-collection
                        await db.collection('Users').doc(followedUid).collection('followers').doc(followerUid).set(followerData)
                        //Add the notification doc to the user's notification sub collection
                        await db.collection('Users').doc(followedUid).collection('Notifications').doc(followerUid).set(notificationObject)
                        //Check if the notificationToken is not null and not "deviceLoggedOut" then attempt to send as it will fail without it anyways
                        if (followedNotificationToken && String(followedNotificationToken) !== "deviceLoggedOut") {
                          //Send the notification to the user
                        await admin.messaging().sendToDevice(followedNotificationToken, notificationPayload)
                        } else {
                          console.log('receiver is not Signed In or his notificationToken does not exist')
                        }
                        //save the async function as a promise
                        await markFollowedPersonWhatsNewItemsFollowingStatusToTrueAndIncrementNoOfUnReadItems()

                      })

                  })

              })

          }

        })

    }

    //find the followed person's whatsNew items and mark the following status as true, 
    //then increment the noOfFollowedPersonUnReadWhatsNewItems
    //by one if that whatsItem's hasRead field is false as this is a doc that user should read now
    async function markFollowedPersonWhatsNewItemsFollowingStatusToTrueAndIncrementNoOfUnReadItems() {
      await followerWhatsNewColl
        .where('primaryProfileUid', '==', followedUid)
        .get().then(
          async (followedWhatsNewItems: DocumentSnapshot[]) => {
            //check if there are followedPerson's whatsNew items
            if (followedWhatsNewItems.length !== null) {
              //loop through each item
              followedWhatsNewItems.forEach(async followedWhatsNewItem => {

                //update the following status to true
                await followerWhatsNewColl.doc(followedWhatsNewItem.data()?.id).update({
                  isFollowing: true
                })

                //if the whatsNewItem hasRead is false then increment the noOfFollowedPersonUnReadWhatsNewItems
                if (followedWhatsNewItem.data()?.hasRead === false) {
                  await noOfFollowedPersonUnReadWhatsNewItemsDoc.update({
                    noOfFollowedPersonUnReadWhatsNewItems: admin.firestore.FieldValue.increment(1)
                  })
                }

              })
            } else {
              //print a message to console that no Followed Person whatsNewItems
              console.log('no Followed Person whatsNewItems available')
            }
          })
    }

  })