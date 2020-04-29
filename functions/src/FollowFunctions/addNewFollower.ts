import * as functions from 'firebase-functions'
const admin = require('firebase-admin')

//When client followes a user, a firestore .onCreate() background function is triggered to
//1.add follower to the followee's followers sub collection
//2.an FCM notification to sent to the users
//3.A Notification doc is added to Notification Sub Collection
export const addTheNewFollower = functions.region('asia-east2').firestore.document
  ('Users/{followerUserId}/following/{followeeUserId}').onCreate((data, context) => {


  //get follower and followee Uids for identification
  const followeeUid = context.params.followeeUserId
  //for identification and notification payload data (Intent Extras for client)
  const followerUid = context.params.followerUserId

  //Get Follower user details that needs to be duplicated to the Followee's following Sub Coll
  //And also added to the notification Payload data
  return admin.firestore().collection('Users').doc(followerUid).get().then((doc:{ exists: any; data: () => any }) => {

    //Extracting this separately as this need not be copied to the Followers sub-collection
    const followerImageUrl = doc.data().DOWNLOAD_URL

    //This data will be copied to the followers sub collection
    const followerData = {
      name:  doc.data().name,
      uid: followerUid,
      userName: doc.data().userName,
      profilePhotoChosen: doc.data().profilePhotoChosen
    }
    

  //get the notification token of the followee to identify & send notification to his device
  return admin.firestore().collection('Users').doc(followeeUid).collection('notificationToken')
    .doc('theNotificationToken').get().then((notificationTokenDoc:{ exists: any; data: () => any }) => {

      const followeeNotificationToken = notificationTokenDoc.data().notificationToken

  //Create the Notification Payload content
  const notificationPayload = {
    notification: {
      title: 'You have a new follower!',
      body: `${followerData.userName}`,
      clickAction: ".People.PersonProfileActivity",
      image: `${followerImageUrl}`
    },
    data: {
      ACTIVITY_NAME: "PersonProfileActivity",
      //The below field name to be same as the one used in the client
      PERSON_UID_INTENT_EXTRA: followerUid,
      PERSON_NAME_INTENT_EXTRA: followerData.name,
      PERSON_USERNAME_INTENT_EXTRA: followerData.userName,
      //If the app is in the foreground then this channel will be used to trigger a notification and this channel has to
      //be created at the client else, this will fail
      CHANNEL_ID: "Follow Update ID"
    }
  }

  //random 11 digital Notification Doc Id
  const randomNotificationDocId = (Math.random() * 100000000000).toString()

  const notificationObject = {
    message:`${followerData.userName} started following you`,
    receivedTime: Date.now(),
    //This is needed for client to access this doc and update the wasClicked field
    notificationDocId: randomNotificationDocId,
    senderName: followerData.name,
    senderUid: followerData.uid,
    //this will be false by default, will turn true at client when clicked
    wasClicked: false,
    //this type has be same as in the client
    notificationChannelId: "Follow Updates",
    intentToActivity: "PersonProfileActivity",
    intentExtrasUid: followerData.uid,
    intentExtrasName: followerData.name,
    intentExtrasUserName: followerData.userName,
  }
      

        const promises = []
          //Add the follower to the followee sub-collection
          const p =  admin.firestore().collection('Users').doc(followeeUid).collection('followers').doc(followerUid).set(followerData)
          promises.push(p)
          //Add the notification doc to the user's notification sub collection
          const p1 = admin.firestore().collection('Users').doc(followeeUid).collection('Notifications').doc(randomNotificationDocId).set(notificationObject)
          promises.push(p1)
          //Check if the notificationToken is not null only then attempt to send as it will fail without it anyways
          if ( followeeNotificationToken != null ) {
            //Send the notification to the user
            const p2 = admin.messaging().sendToDevice(followeeNotificationToken, notificationPayload)
            promises.push(p2)
          }
          return Promise.all(promises)
      })

     })

  })
