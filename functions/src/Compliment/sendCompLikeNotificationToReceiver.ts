import * as functions from 'firebase-functions'
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore'
const admin = require('firebase-admin')
const utilityFunctions = require('frequentFunctions')

//When a person likes a compliment, then send a notification to the comp receiver if the liker is not the receiver
//and add a notificationDoc to their notifications Sub Coll
export const sendCompLikeNotificationToReceiver = functions.region('asia-south1').firestore.document
    ('Users/{userId}/complimentsReceived/{complimentId}/complimentLikes/{likerUid}')
    .onCreate((data, context) => {

        //get the compId
        const complimentId =  context.params.complimentId
        //get the comp receiver Uid
        const receiverUid = context.params.userId
        //get the comp liker Uid
        const likerUid = context.params.likerUid
        //get the liker name
        const likerName = data.data()?.name
        //get the liker userName
        const likerUserName = data.data()?.userName
        //Is the liker same as the receiver, then just return in that case
        if (receiverUid === likerUid) {
            console.log('liker is same as receiver')
            return Promise
        } else {
            return getTheComplimentContentAndSendCompliment()
        }

        async function getTheComplimentContentAndSendCompliment() {
            await admin.firestore().collection('Users').doc(receiverUid).collection('complimentsReceived')
                .doc(complimentId).get().then(async(complimentDoc: DocumentSnapshot) => {
                    const complimentContent = complimentDoc.data()?.complimentContent
                    await sendTheNotification(complimentContent)
                })
        }
            
        async function sendTheNotification(complimentContent: String) {

            //get the liker userProfile doc for profilePhotoUrl
            await admin.firestore().collection('Users').doc(likerUid).collection('ProfileInfo')
                .doc(likerUid).get().then(async (likerUserProfileDoc: DocumentSnapshot) => {

                    //the likerProfilePhotoUrl
                    const likerProfileImageUrl = likerUserProfileDoc.data()?.photoUrl

                    //Create the Notification Payload content
                    const notificationPayload = {
                        notification: {
                            title: `${likerUserName} has liked your compliment`,
                            body: complimentContent,
                            //Add an additional intent filter in manifest file for android for the activity with the name 
                            //same as the clickAction here or Off Screen Notification click action wont work
                            clickAction: ".compliments.complimentReceived.NewComplimentReceivedActivity",
                            image: `${likerProfileImageUrl}`
                        },
                        data: {
                            ACTIVITY_NAME: "NEW_COMPLIMENT_RECEIVED_ACTIVITY",
                            //pass the complimentId to the Notification so the client can know which compliment to retreive
                            //field name is kept same as the addNewCompliment as both CFs take users to the same activity
                            NEW_COMPLIMENT_ID_FIELD: complimentId,
                            //If the app is in the foreground then this channel will be used to trigger a notification and this channel has to
                            //be created at the client else, this will fail
                            CHANNEL_ID: "Compliment Likes ID"
                        }
                    }

                    const nofiticationDocId = utilityFunctions.randomId()

                    const notificationObject = {
                        message: complimentContent,
                        receivedTime: Date.now(),
                        senderUserName: likerUserName,
                        senderUid: likerUid,
                        //this will be false by default, will turn true at client when clicked
                        wasClicked: false,
                        //this type has be same as in the client
                        notificationChannelId: "Compliment Likes ID",
                        intentToActivity: "NEW_COMPLIMENT_RECEIVED_ACTIVITY",
                        intentExtrasUid: likerUid,
                        intentExtrasName: likerName,
                        intentExtrasUserName: likerUserName,
                        intentExtrasBio: null,
                        //This is needed for client to access this doc and update the wasClicked field
                        contentId: complimentId,
                        notificationId: nofiticationDocId
                    }

                    //Get the notification token of the compReceiver
                    await admin.firestore().collection('Users').doc(receiverUid).collection('notificationToken')
                        .doc('theNotificationToken').get().then(async (notificationTokenDoc: DocumentSnapshot) => {

                            const receiverNotificationToken = await notificationTokenDoc.data()?.notificationToken
                            //Check if the notificationToken is not null and not "deviceLoggedOut" then attempt to send as it will fail without it anyways
                            if (receiverNotificationToken && String(receiverNotificationToken) !== "deviceLoggedOut") {
                                //Send the notification to the user
                                await admin.messaging().sendToDevice(receiverNotificationToken, notificationPayload)
                            } else {
                                console.log('receiver is not Signed In or his notificationToken does not exist')
                              }

                            //add a notificationDoc to the receiver
                            await admin.firestore().collection('Users').doc(receiverUid).collection('Notifications').doc(nofiticationDocId).set(notificationObject)

                        })

                })

        }


    })
