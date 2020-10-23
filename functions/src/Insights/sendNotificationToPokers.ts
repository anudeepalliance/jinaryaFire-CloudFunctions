import * as functions from 'firebase-functions'
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore'
const admin = require('firebase-admin')
const utilityFunctions = require('frequentFunctions')

//When a poked adds an Insights, do the following:
//1. Check if there are some pending pokers in the pokersForInsights Sub Collection
//2. If yes then get their Notification Tokens, them send them all FCM notifications and Notification Docs
//3. Then delete the pokers from the sub collection so they are not notified unnecesarily for future insights
export const sendNotificationToPokers = functions.region('asia-south1').firestore.document
    ('Users/{pokedUid}/insights/{insightId}').onCreate((insightData, context) => {

        //get pokedUid
        const pokedUid = context.params.pokedUid
        //create a firestore reference variable
        const db = admin.firestore()

        let pokedUserName : String = ""
        let pokedPhotoUrl : String = ""

        async function sendNotificationIfPokersExist() {
            await db.collection('Users').doc(pokedUid).collection('pokersForInsights').get().then(async (pokers: DocumentSnapshot[]) => {
                if (pokers.toString().length === 0) {
                    console.log('The poked does not have any pending Pokers')
                    return
                } else {
                    console.log('The poked does have Pokers')
                    //get the poked UserName and his profile Photo Url for the notification payload
                    await getPokedPersonDetails()

                            //Create the Notification Payload content
                            const notificationPayload = {
                                notification: {
                                    title: `${pokedUserName} has added insights`,
                                    body: `${insightData.data().insightContent}`,
                                    //Add an additional intent filter in manifest file for android for the activity with the name 
                                    //same as the clickAction here or Off Screen Notification click action wont work
                                    clickAction: ".insights.connectionInsights.SpecificInsightHolderActivity",
                                    image: `${pokedPhotoUrl}`
                                },
                                data: {
                                    ACTIVITY_NAME: "SPECIFIC_INSIGHT_HOLDER_ACTIVITY",
                                    //specify the insight category to hold, poked insight or likedReceived insight?
                                    INSIGHT_CATEGORY: "POKED_INSIGHT_CATEGORY",
                                    //The below field name to be same as the one used in the client
                                    NEW_INSIGHT_FOLLOWED_ID_FIELD: pokedUid,
                                    NEW_INSIGHT_ID_FIELD: `${insightData.data().insightId}`,
                                    //If the app is in the foreground then this channel will be used to trigger a notification and this channel has to
                                    //be created at the client else, this will fail
                                    CHANNEL_ID: "Poked Insights Available ID"
                                }
                            }

                            const nofiticationDocId = utilityFunctions.randomId()

                            const notificationObject = {
                                message: `${insightData.data().insightContent}`,
                                receivedTime: Date.now(),
                                senderUserName: pokedUserName,
                                senderUid: pokedUid,
                                //this will be false by default, will turn true at client when clicked
                                wasClicked: false,
                                //this type has be same as in the client
                                notificationChannelId: "Poked Insights Available ID",
                                intentToActivity: "SPECIFIC_INSIGHT_HOLDER_ACTIVITY",
                                intentExtrasUid: pokedUid,
                                intentExtrasName: null,
                                intentExtrasUserName: pokedUserName,
                                //This is needed for client to access this doc and update the wasClicked field
                                contentId: insightData.data().insightId,
                                notificationId: nofiticationDocId
                            }

                            pokers.forEach(async poker => {

                                const pokerUid = poker.data()?.uid

                                //get this poker's notificationToken, send a notification and then delete the poker
                                await db.collection('Users').doc(pokerUid).collection('notificationToken')
                                    .doc('theNotificationToken').get().then(async (notificationTokenDoc: DocumentSnapshot) => {
                                        
                                        const notificationToken = notificationTokenDoc.data()?.notificationToken
                                        //Check if the notificationToken is not null and not "deviceLoggedOut" then attempt to send as it will fail without it anyways
                                        if (notificationToken && String(notificationToken) !== "deviceLoggedOut") {
                                            //send a notification to this poker with his notificationToken
                                            await admin.messaging().sendToDevice(notificationToken, notificationPayload)
                                        } else {
                                            console.log('receiver is not Signed In or his notificationToken does not exist')
                                        }
                                        
                                        //delete the poker
                                        const pokerDocPath = poker.ref.path
                                        await db.doc(pokerDocPath).delete()
                                        //Add the notification doc to the user's notification sub collection
                                        await db.collection('Users').doc(pokerUid).collection('Notifications')
                                            .doc(insightData.data().insightId).set(notificationObject)

                                    })

                            })
                }
            })
        }

        //get the poked UserName and his profile Photo Url for the notification payload
        async function getPokedPersonDetails() {
            await db.collection('Users').doc(pokedUid).collection('ProfileInfo')
                .doc(pokedUid).get().then(async (pokedUserProfileDoc: DocumentSnapshot) => {
                    //get the userName of the Poked
                    pokedUserName = pokedUserProfileDoc.data()?.userName
                    pokedPhotoUrl = pokedUserProfileDoc.data()?.photoUrl
                })
        }

        return sendNotificationIfPokersExist()

    })