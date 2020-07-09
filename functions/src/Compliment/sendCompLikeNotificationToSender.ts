import * as functions from 'firebase-functions'
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore'
const admin = require('firebase-admin')
const utilityFunctions = require('frequentFunctions')

//When a person likes a compliment, then send a notification to the comp sender if the liker is not the sender
//and add a notificationDoc to their notifications Sub Coll
export const sendCompLikeNotificationToSender = functions.region('asia-east2').firestore.document
    ('Users/{userId}/complimentsReceived/{complimentId}/complimentLikes/{likerUid}')
    .onCreate((data, context) => {

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
        //get the comp sender Uid
        return admin.firestore().collection('Users').doc(receiverUid).collection('complimentsReceived')
            .doc(complimentId).get().then((complimentDoc: DocumentSnapshot) => {

                const senderUid = complimentDoc.data()?.senderUid

                //Is the liker same as the receiver, then just return in that case
                if (senderUid === likerUid) {
                    console.log('liker is same as sender')
                    return Promise
                } else {
                    //get the likerProfilePhotoUrl
                    return admin.firestore().collection('Users').doc(likerUid).collection('ProfileInfo')
                        .doc(likerUid).get().then((likerUserProfileDoc: DocumentSnapshot) => {
                            //the likerProfilePhotoUrl
                            const likerProfileImageUrl = likerUserProfileDoc.data()!.photoUrl

                            //Create the Notification Payload content
                            const notificationPayload = {
                                notification: {
                                    title: 'Your compliment received a Like',
                                    body: `${likerUserName}`,
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
                                message: null,
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
                            return admin.firestore().collection('Users').doc(senderUid).collection('notificationToken')
                                .doc('theNotificationToken').get().then((notificationTokenDoc: DocumentSnapshot) => {
                                    const senderNotificationToken = notificationTokenDoc.get('notificationToken')
                                    //initiate an empty promises Array
                                    const promises = []
                                    //send a notification to the sender
                                    const p = admin.messaging().sendToDevice(senderNotificationToken, notificationPayload)
                                    promises.push(p)
                                    //add a notificationDoc to the sender
                                    const p1 = admin.firestore().collection('Users').doc(senderUid).collection('Notifications').doc(nofiticationDocId).set(notificationObject)
                                    promises.push(p1)
                                    //run all the promises
                                    return Promise.all(promises)

                                })

                        })
                }
            })

    })
