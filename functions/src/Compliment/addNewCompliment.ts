import * as functions from 'firebase-functions'
const admin = require('firebase-admin')

// export function reportUser() 
  export const addTheNewCompliment = functions.region('asia-east2').https.onCall((complimentData, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated', 
        'only authenticated users can send feedback'
      )
    } 
    
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
        senderBlocked: false
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
        clickAction: ".source.SourceActivity",
        image: `${complimentData.senderProfileImageDownloadUrl}`
      },
      data: {
        ACTIVITY_NAME: "source.SourceActivity",
        //The below field name to be same as the one used in the client
        SOURCE_ACTIVITY_INTENT_EXTRA: "COMPLIMENTS_RECEIVED_FRAGMENT_INTENT_EXTRA",
        COMPLIMENT_SENDER_UID_INTENT_EXTRA: complimentData.senderUid,
        //If the app is in the foreground then this channel will be used to trigger a notification and this channel has to
        //be created at the client else, this will fail
        CHANNEL_ID: "New Compliment Received ID"
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
    intentToActivity: "SourceActivity",
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

})
