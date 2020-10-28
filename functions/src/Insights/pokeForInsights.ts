import * as functions from 'firebase-functions'
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore'
const admin = require('firebase-admin')
const utilityFunctions = require('frequentFunctions')

//When a poke is received by a user then do the following
//1.Check if the poker is present in the pokersForInsights sub collection of the poked, 
//If yes then just return else continue with the function
//2.Add Poker to the pokersForInsights sub collection of the poked
//3.A Notification payload is created and sent via FCM to the poked person
//4.Create and add a Notification Doc of the type Insight Pokes to poked person
export const pokeForInsights = functions.region('asia-south1').firestore.document
    ('Users/{pokedUid}/pokersForInsights/{pokerUid}').onCreate((pokedUserData, context) => {

        //create a firestore reference variable
        const db = admin.firestore()
        const pokedUid = context.params.pokedUid
        const pokerUid = context.params.pokerUid
        const pokerUserName = pokedUserData.data()?.userName
        const photoUrl = pokedUserData.data()?.photoUrl

        return poke()

        async function poke() {
            //Check if the poker is blocked by the poked, if yes then throw an error
            await db.collection('Users').doc(pokedUid).collection('blocked')
                .doc(pokerUid).get().then(async (pokerBlockedDoc: DocumentSnapshot) => {
                    if (pokerBlockedDoc.exists) {
                        throw new functions.https.HttpsError(
                            'unauthenticated',
                            'Poker is blocked by the poker'
                        )
                    } else {
                        //get the notification token of the poked to identify & send notification to his device
                        await db.collection('Users').doc(pokedUid).collection('notificationToken')
                            .doc('theNotificationToken').get().then(async (notificationTokenDoc: DocumentSnapshot) => {

                                //the fields to be same as the ones at Fs
                                const pokedNotificationToken = notificationTokenDoc.data()?.notificationToken

                                //Create the Notification Payload content
                                const notificationPayload = {
                                    notification: {
                                        title: `${pokerUserName} has poked you`,
                                        body: `to add Insights`,
                                        //Add an additional intent filter in manifest file for android for the activity with the name 
                                        //same as the clickAction here or Off Screen Notification click action wont work
                                        clickAction: ".insights.writeInsight.WriteInsight",
                                        image: `${photoUrl}`
                                    },
                                    data: {
                                        ACTIVITY_NAME: "WRITE_INSIGHT_ACTIVITY",
                                        //If the app is in the foreground then this channel will be used to trigger a notification and this channel has to
                                        //be created at the client else, this will fail 
                                        CHANNEL_ID: "Poke for Insights ID"
                                    }
                                }

                                const nofiticationDocId = utilityFunctions.randomId()

                                const notificationObject = {
                                    message: null,
                                    receivedTime: Date.now(),
                                    senderUserName: pokerUserName,
                                    senderUid: pokerUid,
                                    //this will be false by default, will turn true at client when clicked
                                    wasClicked: false,
                                    //this type has be same as in the client
                                    notificationChannelId: "Poke for Insights ID",
                                    intentToActivity: "WRITE_INSIGHT_ACTIVITY",
                                    intentExtrasUid: null,
                                    intentExtrasName: null,
                                    intentExtrasUserName: null,
                                    //This is needed for client to access this doc and update the wasClicked field
                                    contentId: pokerUid,
                                    notificationId: nofiticationDocId
                                }

                                //Add the notification doc to the user's notification sub collection
                                await db.collection('Users').doc(pokedUid).collection('Notifications')
                                    .doc(pokerUid).set(notificationObject)

                                //Check if the notificationToken is not null and not "deviceLoggedOut" then attempt to send as it will fail without it anyways
                                if (pokedNotificationToken && String(pokedNotificationToken) !== "deviceLoggedOut") {
                                    //Send the notification to the user
                                    await admin.messaging().sendToDevice(pokedNotificationToken, notificationPayload)
                                } else {
                                    console.log('receiver is not Signed In or his notificationToken does not exist')
                                }

                            })
                    }
                })
        }

    })