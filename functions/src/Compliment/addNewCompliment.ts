import * as functions from 'firebase-functions'
const admin = require('firebase-admin')
// import utilityFunctions = require('../Utils/utilityFunctions')

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
        const randomComplimentId = randomDocumentId()
        // const randomComplimentId = utilityFunctions.theRandomDocId(28)
        // const randomComplimentId = (Math.random() * 100000000000).toString()


        const complimentReceivedObject = {
          senderUserName: complimentData.senderUserName,
          senderName: complimentData.senderName,
          senderUid: complimentData.senderUid,
          senderBio: complimentData.senderBio,
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
          receiverBlocked: false,
          //the below field value needs to be same as the CO defined in the client
          contentCategory: "compliment"
        }


        //get the notification token of the complimentReceiver to identify & send notification to his device
        return admin.firestore().collection('Users').doc(complimentData.receiverUid).collection('notificationToken')
          .doc('theNotificationToken').get().then((notificationTokenDoc: { exists: any; data: () => any }) => {

            //the fields to be same as the ones at Fs
            const receiverNotificationToken = notificationTokenDoc.data()?.notificationToken
            const senderThumbnailImageUrl = complimentData.photoUrl

            //Create the Notification Payload content
            const notificationPayload = {
              notification: {
                title: 'You received a new Compliment!',
                body: `${complimentData.senderName}`,
                //Add an additional intent filter in manifest file for android for the activity with the name 
                //same as the clickAction here or Off Screen Notification click action wont work
                clickAction: ".compliments.complimentReceived.NewComplimentReceivedActivity",
                image: `${senderThumbnailImageUrl}`
              },
              data: {
                ACTIVITY_NAME: "NewComplimentReceivedActivity",
                //pass the complimentId to the Notification so the client can know which compliment to retreive
                NEW_COMPLIMENT_ID_FIELD: randomComplimentId,
                //If the app is in the foreground then this channel will be used to trigger a notification and this channel has to
                //be created at the client else, this will fail
                CHANNEL_ID: "Follow Update ID"
              }
            }

            //random 11 digital Notification Doc Id
            const randomNotificationDocId = randomDocumentId()

            const notificationObject = {
              title: `${complimentData.senderUserName} sent you a compliment`,
              message: `${complimentData.complimentReceivedContent}`,
              receivedTime: Date.now(),
              //This is needed for client to access this doc and update the wasClicked field
              notificationDocId: randomNotificationDocId,
              senderUserName: complimentData.senderUserName,
              senderUid: complimentData.senderUid,
              //this will be false by default, will turn true at client when clicked
              wasClicked: false,
              //this type has be same as in the client
              notificationChannelId: "New Compliment Received",
              intentToActivity: "NEW_COMPLIMENT_RECEIVED_ACTIVITY",
              intentExtrasUid: complimentData.senderUid,
              intentExtrasName: complimentData.senderName,
              intentExtrasUserName: complimentData.senderUserName,
              contentId: randomComplimentId
            }


            const promises = []
            //The compliment Object is added to the whatsNew Sub Coll of the receiver
            const p = admin.firestore().collection('Users').doc(complimentReceivedObject.receiverUid).collection('complimentsReceived')
              .doc(randomComplimentId).set(complimentReceivedObject)
            promises.push(p)
            //Add the notification doc to the user's notification sub collection
            const p1 = admin.firestore().collection('Users').doc(complimentReceivedObject.receiverUid).collection('Notifications').doc(randomNotificationDocId).set(notificationObject)
            promises.push(p1)
            //Check if the notificationToken is not null only then attempt to send as it will fail without it anyways
            if (receiverNotificationToken) {
              //Send the notification to the user
              const p2 = admin.messaging().sendToDevice(receiverNotificationToken, notificationPayload)
              promises.push(p2)
            }
            //User gained a new compliment so increase the noOfCompliment
            const p3 = admin.firestore().collection('Users').doc(complimentReceivedObject.receiverUid).collection('ProfileInfo')
              .doc(complimentReceivedObject.receiverUid).update({
                noOfComplimentsReceived: admin.firestore.FieldValue.increment(1)
              })
            promises.push(p3)

            return Promise.all(promises)

          })

      }

    })

})

function randomDocumentId(): String {
  let text = ""
  let length = 28
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < length; i++) {
    text += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return text;
}
