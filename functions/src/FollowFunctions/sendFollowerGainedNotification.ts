import * as functions from 'firebase-functions'
const admin = require('firebase-admin')

//When a user updates his userDoc like name or UserName then this updated info needs to be
//reflected in the user's followees' followers sub coll of all the other users that he is following
export const sendTheFollowerGainedNotification = functions.region('asia-east2').firestore.document
  ('Users/{followerUserId}/following/{followeeUserId}').onCreate((data, context) => {

  const followeeUid = context.params.followeeUserId
  const followerUid : String = context.params.followerUserId

  //Follower user details that needs to be duplicated to the Followee's following Sub Coll
  admin.firestore().collection('Users').doc(followerUid).get().then((doc:{ exists: any; data: () => any }) => {

    let followerUserName = doc.data().userName

    admin.firestore().collection('Users').doc(followeeUid).collection('notificationToken')
      .doc('theNotificationToken').get().then((notificationTokenDoc:{ exists: any; data: () => any }) => {

    let followeeToken =  notificationTokenDoc.data().notificationToken
    console.log(`followeeToken ${followeeToken}`)

          // Notification details.
          const payload = {
            notification: {
              title: 'You have a new follower!',
              body: `${followerUserName}`,
              clickAction: ".People.PersonProfileActivity"
            },
            data: {
              ACTIVITY_NAME: "PersonProfileActivity",
              PERSON_UID_INTENT_EXTRA: followerUid
            }
          }

return admin.messaging().sendToDevice(followeeToken, payload).then(function(response: any) {
							console.log("Successfully sent message:", response);
						  })
						  .catch(function(error: any) {
							console.log("Error sending message:", error);
      })                    
    })
  })
                
})