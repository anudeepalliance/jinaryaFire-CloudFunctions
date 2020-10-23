import * as functions from 'firebase-functions'
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore'
const admin = require('firebase-admin')
const utilityFunctions = require('frequentFunctions')

//When a n insight received a like then send a notification to the owner of the insight 
//unless the liker is different from the insight owner
export const sendInsightLikeNotificationToOwner = functions.region('asia-south1').firestore.document
    ('Users/{userId}/insights/{insightId}/insightLikes/{likerUid}')
    .onCreate((data, context) => {

        //get the insightOwnerUid
        const ownerUid = context.params.userId
        //get the insightId
        const insightId = context.params.insightId
        //get the insight liker Uid
        const likerUid = context.params.likerUid
        //get the liker name
        const likerName = data.data()?.name
        //get the liker userName
        const likerUserName = data.data()?.userName

        //Is the liker same as the owner, then just return in that case
        if (ownerUid === likerUid) {
            console.log('liker is same as owner')
            return Promise
        } else {
            return sendNotification()

        }

        async function sendNotification() {
            //get the likerProfilePhotoUrl
            await admin.firestore().collection('Users').doc(likerUid).collection('ProfileInfo')
                .doc(likerUid).get().then(async(likerUserProfileDoc: DocumentSnapshot) => {
                    //the likerProfilePhotoUrl
                    const likerProfileImageUrl = likerUserProfileDoc.data()!.photoUrl

                    //Create the Notification Payload content
                    const notificationPayload = {
                        notification: {
                            title: 'Your insight received a Like',
                            body: `${likerUserName}`,
                            //Add an additional intent filter in manifest file for android for the activity with the name 
                            //same as the clickAction here or Off Screen Notification click action wont work
                            clickAction: ".insights.connectionInsights.SpecificInsightHolderActivity",
                            image: likerProfileImageUrl
                        },
                        data: {
                            ACTIVITY_NAME: "SPECIFIC_INSIGHT_HOLDER_ACTIVITY",
                            //specify the insight category to hold, poked insight or likedReceived insight?
                            INSIGHT_CATEGORY: "LIKE_RECEIVED_INSIGHT_CATEGORY",
                            //add the insight Id for the activity to know which insight to populate
                            NEW_INSIGHT_ID_FIELD: insightId,
                            //If the app is in the foreground then this channel will be used to trigger a notification and this channel has to
                            //be created at the client else, this will fail
                            CHANNEL_ID: "Insight Likes ID"
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
                        notificationChannelId: "Insight Likes ID",
                        intentToActivity: "SPECIFIC_INSIGHT_HOLDER_ACTIVITY",
                        intentExtrasUid: likerUid,
                        intentExtrasName: likerName,
                        intentExtrasUserName: likerUserName,
                        intentExtrasBio: null,
                        contentId: insightId,
                        //This is needed for client to access this doc and update the wasClicked field
                        notificationId: nofiticationDocId
                    }

                    //get the senderNotification Token of the receiver
                    await admin.firestore().collection('Users').doc(ownerUid).collection('notificationToken')
                        .doc('theNotificationToken').get().then(async(notificationTokenDoc: DocumentSnapshot) => {
                            const senderNotificationToken = await notificationTokenDoc.get('notificationToken')

                            //Check if the notificationToken is not null and not "deviceLoggedOut" then attempt to send as it will fail without it anyways
                            if (senderNotificationToken && String(senderNotificationToken) !== "deviceLoggedOut") {
                                //Send the notification to the sender
                                await admin.messaging().sendToDevice(senderNotificationToken, notificationPayload)
                            } else {
                                console.log('receiver is not Signed In or his notificationToken does not exist')
                            }
                            //add a notificationDoc to the sender
                            await admin.firestore().collection('Users').doc(ownerUid).collection('Notifications').doc(nofiticationDocId).set(notificationObject)
                        })

                })
        }

    })

