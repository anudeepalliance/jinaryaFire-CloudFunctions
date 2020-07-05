import * as functions from 'firebase-functions'
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore'
const admin = require('firebase-admin')

//When a poked adds an Insights, do the following:
//1. Check if there are some pending pokers in the pokersForInsights Sub Collection
//2. If yes then get their Notification Tokens, them send them all FCM notifications and Notification Docs
//3. Then delete the pokers from the sub collection so they are not notified unnecesarily for future insights
export const sendNotificationToThePokers = functions.region('asia-east2').firestore.document
    ('Users/{pokedUid}/insights/{insightId}').onCreate((insightData, context) => {

        //get pokedUid
        const pokedUid = context.params.pokedUid
        //create a firestore reference variable
        const db = admin.firestore()

        //Check if the poked has any pending pokers
        return db.collection('Users').doc(pokedUid).collection('pokersForInsights')
            .get().then((pokers: DocumentSnapshot[] ) => {
                if (pokers.length === 0) {
                    console.log('The poked does not have any pending Pokers');
                    return
                } else {

                    //get the poked UserName and his profile Photo Url for the notification payload
                    return db.collection('Users').doc(pokedUid).collection('ProfileInfo')
                        .doc(pokedUid).get().then((pokedUserProfileDoc: { exists: any; data: () => any }) => {

                            //get the userName of the Poked
                            const pokedUserName = pokedUserProfileDoc.data().userName
                            const pokedPhotoUrl = pokedUserProfileDoc.data().photoUrl

                            //Create the Notification Payload content
                            const notificationPayload = {
                                notification: {
                                    title: `${pokedUserName} has added insights`,
                                    body: `${insightData.data().insightContent}`,
                                    //Add an additional intent filter in manifest file for android for the activity with the name 
                                    //same as the clickAction here or Off Screen Notification click action wont work
                                    clickAction: ".insights.connectionInsights.PokedConnectionInsightActivity",
                                    image: `${pokedPhotoUrl}`
                                },
                                data: {
                                    ACTIVITY_NAME: "POKED_CONNECTION_INSIGHTS_ACTIVITY",
                                    //The below field name to be same as the one used in the client
                                    NEW_INSIGHT_FOLLOWED_ID_FIELD: pokedUid,
                                    NEW_INSIGHT_ID_FIELD: `${insightData.data().insightId}`,
                                    //If the app is in the foreground then this channel will be used to trigger a notification and this channel has to
                                    //be created at the client else, this will fail
                                    CHANNEL_ID: "Poked Insights Available ID"
                                }
                            }

                            const notificationObject = {
                                message: `${insightData.data().insightContent}`,
                                receivedTime: Date.now(),
                                senderUserName: pokedUserName,
                                senderUid: pokedUid,
                                //this will be false by default, will turn true at client when clicked
                                wasClicked: false,
                                //this type has be same as in the client
                                notificationChannelId: "Poked Insights Available ID",
                                intentToActivity: "POKED_CONNECTION_INSIGHTS_ACTIVITY",
                                intentExtrasUid: pokedUid,
                                intentExtrasName: null,
                                intentExtrasUserName: pokedUserName,
                                //This is needed for client to access this doc and update the wasClicked field
                                contentId: insightData.data().insightId
                            }

                            //initialize a promises array for all the tasks
                            const promises = []

                            pokers.forEach(poker => {

                                const pokerUid = poker.data()?.uid

                                //get this poker's notificationToken, send a notification and then delete the poker
                                const p = db.collection('Users').doc(pokerUid).collection('notificationToken')
                                    .doc('theNotificationToken').get().then((notificationTokenDoc: { exists: any; data: () => any }) => {
                                        //send a notification to this poker with his notificationToken
                                        const p1 = admin.messaging().sendToDevice(notificationTokenDoc.data().notificationToken, notificationPayload)
                                        promises.push(p1)
                                        //delete the poker
                                        const p2 = poker.ref.delete()
                                        promises.push(p2)
                                        //Add the notification doc to the user's notification sub collection
                                        const p3 = db.collection('Users').doc(pokerUid).collection('Notifications')
                                            .doc(insightData.data().insightId).set(notificationObject)
                                        promises.push(p3)
                                    })

                                promises.push(p)

                            })

                        })
                }

            })

    })