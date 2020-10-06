import * as functions from 'firebase-functions'
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore'
const admin = require('firebase-admin')
const utilityFunctions = require('frequentFunctions')

//When a compliment is sent by the user then the following are done
//1.it is added to the compliments received sub collection of the receiver via callable Cf as the sender does not have permission to write that sub collection
//2.A Notification payload is created and sent via FCM to the client
//3. A Notification Object is created and added to the Notifications Sub Collection of the Client
export const addNewCompliment = functions.region('asia-east2').https.onCall((complimentData, context) => {

  const db = admin.firestore()

  //check if request came from an authenticated user
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'only authenticated users can send feedback'
    )
  }

  async function checkIfSenderIsBlocked() {
    //For safety check if the comp sender is blocked by the received
    await db.collection('Users').doc(complimentData.receiverUid).collection('blocked')
      .doc(complimentData.senderUid).get().then((doc: DocumentSnapshot) => {
        if (doc.exists) {
          throw new functions.https.HttpsError(
            'unauthenticated',
            'Sender is blocked by receiver'
          )
        } else {
          //sender is not blocked so continue with the function
          return addNewCompliment()

        }
      }
  }

  async function addNewCompliment() {
    
  }

  //Check if the sender is blocked by the recipent, if yes then throw an error
  return db.collection('Users').doc(complimentData.receiverUid).collection('blocked')
    .doc(complimentData.senderUid).get().then((doc: DocumentSnapshot) => {
      if (doc.exists) {
        throw new functions.https.HttpsError(
          'unauthenticated',
          'Sender is blocked by receiver'
        )
      } else {

        //random 11 digital ComplimentId converted to String
        const complimentId: String = complimentData.complimentId


        const complimentReceivedObject = {
          senderUserName: complimentData.senderUserName,
          senderName: complimentData.senderName,
          senderUid: complimentData.senderUid,
          complimentContent: complimentData.complimentContent,
          receiverUid: complimentData.receiverUid,
          receiverUserName: complimentData.receiverUserName,
          receiverName: complimentData.receiverName,
          complimentRead: false,
          receivedTime: Date.now(),
          noOfLikes: 0,
          noOfViews: 0,
          //compliment is just being added so neither of them would have liked this content
          receiverLiked: false,
          //added this variable as the same object is used as compReceived and compSent Object
          senderLiked: false,
          complimentId: complimentId,
          followingStatus: complimentData.followingStatus,
          senderBlocked: false,
          receiverBlocked: false,
          hasImage: complimentData.hasImage,
          //the below field value needs to be same as the CO defined in the client
          contentCategory: "compliment"
        }


        //get the notification token of the complimentReceiver to identify & send notification to his device
        return db.collection('Users').doc(complimentData.receiverUid).collection('notificationToken')
          .doc('theNotificationToken').get().then((notificationTokenDoc: DocumentSnapshot) => {

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
                ACTIVITY_NAME: "NEW_COMPLIMENT_RECEIVED_ACTIVITY",
                //pass the complimentId to the Notification so the client can know which compliment to retreive
                NEW_COMPLIMENT_ID_FIELD: complimentId,
                //If the app is in the foreground then this channel will be used to trigger a notification and this channel has to
                //be created at the client else, this will fail
                CHANNEL_ID: "New Compliment Received ID"
              }
            }

            const nofiticationDocId = utilityFunctions.randomId()

            const notificationObject = {
              message: `${complimentData.complimentContent}`,
              receivedTime: Date.now(),
              senderUserName: complimentData.senderUserName,
              senderUid: complimentData.senderUid,
              //this will be false by default, will turn true at client when clicked
              wasClicked: false,
              //this type has be same as in the client
              notificationChannelId: "New Compliment Received ID",
              intentToActivity: "NEW_COMPLIMENT_RECEIVED_ACTIVITY",
              intentExtrasUid: complimentData.senderUid,
              intentExtrasName: complimentData.senderName,
              intentExtrasUserName: complimentData.senderUserName,
              //This is needed for client to access this doc and update the wasClicked field
              contentId: complimentId,
              notificationId: nofiticationDocId
            }

            const promises = []
            //The compliment Object is added to the compsReceived Sub Coll of the receiver
            const p = db.collection('Users').doc(complimentReceivedObject.receiverUid).collection('complimentsReceived')
              .doc(complimentId).set(complimentReceivedObject)
            promises.push(p)
            //Add the notification doc to the user's notification sub collection
            const p1 = db.collection('Users').doc(complimentReceivedObject.receiverUid).collection('Notifications')
              .doc(complimentId).set(notificationObject)
            promises.push(p1)
            //Check if the notificationToken is not null only then attempt to send as it will fail without it anyways
            if (receiverNotificationToken) {
              //Send the notification to the user
              const p2 = admin.messaging().sendToDevice(receiverNotificationToken, notificationPayload)
              promises.push(p2)
            }
            //User gained a new compliment so increase the noOfCompliment
            const p3 = db.collection('Users').doc(complimentReceivedObject.receiverUid).collection('ProfileInfo')
              .doc(complimentReceivedObject.receiverUid).update({
                noOfComplimentsReceived: admin.firestore.FieldValue.increment(1)
              })
            promises.push(p3)
            return Promise.all(promises)

          })

      }

    })
})