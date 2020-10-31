import * as functions from 'firebase-functions'
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore'
const admin = require('firebase-admin')
const utilityFunctions = require('frequentFunctions')

//When a person likes a compliment, then send a notification to the comp sender if the liker is not the sender
//and add a notificationDoc to their notifications Sub Coll
export const sendCompLikeNotificationToSender = functions.region('asia-south1').firestore.document
    ('Users/{userId}/complimentsReceived/{complimentId}/complimentLikes/{likerUid}').onCreate((data, context) => {

        //get the receiverUid
        const receiverUid = context.params.userId
        //get the compId
        const complimentId = context.params.complimentId
        //get the comp liker Uid
        const likerUid = context.params.likerUid
        //get the liker name
        const likerName = data.data()?.name
        //get the liker userName
        const likerUserName = data.data()?.userName

        return sendNotificationIfLikerIsNotSender()

        async function sendNotificationIfLikerIsNotSender() {
            //get the comp sender Uid
            await admin.firestore().collection('Users').doc(receiverUid).collection('complimentsReceived')
                .doc(complimentId).get().then((complimentDoc: DocumentSnapshot) => {

                    const senderUid = complimentDoc.data()?.senderUid

                    //Is the liker same as the receiver, then just return in that case
                    if (senderUid === likerUid) {
                        console.log('liker is same as sender')
                        return Promise
                    } else {
                        const complimentReceiverUserName = complimentDoc.data()?.receiverUserName
                        return sendTheNotification(senderUid, complimentReceiverUserName)

                    }
                })
        }

        async function sendTheNotification(theSenderUid : String, complimentReceiverUserName : String) {

            //get the likerProfilePhotoUrl
            await admin.firestore().collection('Users').doc(likerUid).collection('ProfileInfo')
                .doc(likerUid).get().then(async (likerUserProfileDoc: DocumentSnapshot) => {
                    //the likerProfilePhotoUrl
                    const likerProfileImageUrl = likerUserProfileDoc.data()!.photoUrl

                    //Create the Notification Payload content
                    const notificationPayload = {
                        notification: {
                            title: `${likerUserName} liked your compliment`,
                            body: `You sent this compliment to ${complimentReceiverUserName}`,
                            //Add an additional intent filter in manifest file for android for the activity with the name 
                            //same as the clickAction here or Off Screen Notification click action wont work
                            clickAction: ".compliments.likedComplimentSent.LikeReceivedComplimentSentActivity",
                            image: likerProfileImageUrl
                        },
                        data: {
                            ACTIVITY_NAME: "LIKE_RECEIVED_COMPLIMENT_SENT_ACTIVITY",
                            //pass the complimentId to the Notification so the client can know which compliment to retreive
                            LIKE_RECEIVED_COMPLIMENT_ID_FIELD: complimentId,
                            //If the app is in the foreground then this channel will be used to trigger a notification and this channel has to
                            //be created at the client else, this will fail
                            CHANNEL_ID: "Compliment Likes ID"
                        }
                    }

                    const nofiticationDocId = utilityFunctions.randomId()

                    const notificationObject = {
                        message: `You sent this compliment to ${complimentReceiverUserName}`,
                        receivedTime: Date.now(),
                        senderUserName: likerUserName,
                        senderUid: likerUid,
                        //this will be false by default, will turn true at client when clicked
                        wasClicked: false,
                        //this type has to be same as in the client
                        notificationChannelId: "Compliment Likes ID",
                        intentToActivity: "LIKE_RECEIVED_COMPLIMENT_SENT_ACTIVITY",
                        intentExtrasUid: likerUid,
                        intentExtrasName: likerName,
                        intentExtrasUserName: likerUserName,
                        intentExtrasBio: null,
                        //This is needed for client to access this doc and update the wasClicked field
                        contentId: complimentId,
                        notificationId: nofiticationDocId
                    }

                    //get the senderNotification Token of the receiver
                    await admin.firestore().collection('Users').doc(theSenderUid).collection('notificationToken')
                        .doc('theNotificationToken').get().then(async (notificationTokenDoc: DocumentSnapshot) => {
                            const senderNotificationToken = await notificationTokenDoc.get('notificationToken')
                            //Check if the notificationToken is not null and not "deviceLoggedOut" then attempt to send as it will fail without it anyways
                            if (senderNotificationToken && String(senderNotificationToken) !== "deviceLoggedOut") {
                                //send a notification to the sender
                                await admin.messaging().sendToDevice(senderNotificationToken, notificationPayload)
                            } else {
                                console.log('receiver is not Signed In or his notificationToken does not exist')
                              }
                            //add a notificationDoc to the sender
                            await admin.firestore().collection('Users').doc(theSenderUid)
                                .collection('Notifications').doc(nofiticationDocId).set(notificationObject)

                        })

                })
        }


    })
