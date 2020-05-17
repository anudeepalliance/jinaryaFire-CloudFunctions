import * as functions from 'firebase-functions'
const admin = require('firebase-admin')

//When a compliment is sent by the user then the following are done
//1.it is added to the compliments received sub collection of the receiver via callable Cf as the sender does not have permission to write that sub collection
//2.A Notification payload is created and sent via FCM to the client
//3. A Notification Object is created and added to the Notifications Sub Collection of the Client
  export const addTheNewCompliment = functions.region('asia-east2').https.onCall((complimentData, context) => {
    //check if request came from an authenticated user
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated', 
        'only authenticated users can send feedback'
      )
    } 

    //Check if the sender is blocked by the recipent, if yes then throw an error
    return admin.firestore().collection('Users').doc(complimentData.receiverUid).collection('blocked')
    .doc(complimentData.senderUid).get().then((doc: { exists: any; data: () => any }) => {
      if (doc.exists) {
        throw new functions.https.HttpsError(
          'unauthenticated', 
          'Sender is blocked by receiver'
        )
      } else {
    
  //random 11 digital ComplimentId converted to String
  const randomComplimentId = (Math.random() * 100000000000).toString()

    const complimentReceivedObject = {
        senderUserName:  complimentData.senderUserName,
        senderName:  complimentData.senderName,
        senderUid: complimentData.senderUid,
        complimentReceivedContent: complimentData.complimentReceivedContent,
        receiverUid: complimentData.receiverUid,
        receiverUserName: complimentData.receiverUserName,
        receiverName: complimentData.receiverName,
        complimentRead: false,
        receivedTime: Date.now(),
        noOfLikes: 0,
        noOfViews: 0,
        complimentId: randomComplimentId,
        followingStatus: complimentData.followingStatus,
        senderBlocked: false,
        receiverBlocked: false
    }


    //get the notification token of the complimentReceiver to identify & send notification to his device
  return admin.firestore().collection('Users').doc(complimentData.receiverUid).collection('notificationToken')
  .doc('theNotificationToken').get().then((notificationTokenDoc:{ exists: any; data: () => any }) => {

    const receiverNotificationToken = notificationTokenDoc.data().notificationToken

    //Create the Notification Payload content
    const notificationPayload = {
      notification: {
        title: 'You received a new Compliment!',
        body: `${complimentData.senderName}`,
        //Add an additional intent filter in manifest file for android for the activity with the name 
        //same as the clickAction here
        clickAction: ".source.SourceActivity",
        image: `${complimentData.senderProfileImageDownloadUrl}`
      },
      data: {
        ACTIVITY_NAME: "SOURCE_COMPLIMENTS_RECEIVED_ACTIVITY_NAME",
        //The below field name to be same as the one used in the client
        SOURCE_ACTIVITY_INTENT_EXTRA: "COMPLIMENTS_RECEIVED_FRAGMENT_INTENT_EXTRA",
        COMPLIMENT_SENDER_UID_INTENT_EXTRA: complimentData.senderUid,
        //If the app is in the foreground then this channel will be used to trigger a notification and this channel has to
        //be created at the client else, this will fail
        CHANNEL_ID: "Follow Update ID"
      }
    }

    //random 11 digital Notification Doc Id
  const randomNotificationDocId = (Math.random() * 100000000000).toString()

  const notificationObject = {
    message:`${complimentData.senderUserName} sent you a compliment`,
    receivedTime: Date.now(),
    //This is needed for client to access this doc and update the wasClicked field
    notificationDocId: randomNotificationDocId,
    senderName: complimentData.senderName,
    senderUid: complimentData.senderUid,
    //this will be false by default, will turn true at client when clicked
    wasClicked: false,
    //this type has be same as in the client
    notificationChannelId: "New Compliment Received",
    intentToActivity: "SOURCE_COMPLIMENTS_RECEIVED_ACTIVITY_NAME",
    intentExtrasUid: complimentData.senderUid,
    intentExtrasName: complimentData.senderName,
    intentExtrasUserName: complimentData.senderUserName,
  }


const promises = []
//The compliment Object is added to the complimentsReceived Sub Coll of the receiver
const p = admin.firestore().collection('Users').doc(complimentReceivedObject.receiverUid).collection('complimentsReceived')
.doc(randomComplimentId).set(complimentReceivedObject)
promises.push(p)
//Add the notification doc to the user's notification sub collection
const p1 = admin.firestore().collection('Users').doc(complimentReceivedObject.receiverUid).collection('Notifications').doc(randomNotificationDocId).set(notificationObject)
promises.push(p1)
//Check if the notificationToken is not null only then attempt to send as it will fail without it anyways
if ( receiverNotificationToken !== null ) {
  //Send the notification to the user
  const p2 = admin.messaging().sendToDevice(receiverNotificationToken, notificationPayload)
  promises.push(p2)
}

return Promise.all(promises)

    })

  }

})

})
