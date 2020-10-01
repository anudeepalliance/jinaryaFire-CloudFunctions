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
export const pokeForTheInsights = functions.region('asia-east2').https.onCall((pokeForInsightData, context) => {

    //check if request came from an authenticated user
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'only authenticated users can send feedback'
        )
    }

    //create a firestore reference variable
    const db = admin.firestore()

    //Check if the poker has already poked this user, if yes then throw an error
    return db.collection('Users').doc(pokeForInsightData.pokedUid).collection('pokersForInsights')
        .doc(pokeForInsightData.pokerUid).get().then((doc: any ) => {
            if (doc.exists) {
                //print a message to console that poker has already poked this user
                console.log('Poker has already poked this user')
                return
            } else {
                //Check if the poker is blocked by the poked, if yes then throw an error
                return db.collection('Users').doc(pokeForInsightData.pokedUid).collection('blocked')
                    .doc(pokeForInsightData.pokerUid).get().then((pokerBlockedDoc: DocumentSnapshot) => {
                        if (pokerBlockedDoc.exists) {
                            throw new functions.https.HttpsError(
                                'unauthenticated',
                                'Poker is blocked by the poker'
                            )
                        } else {

                            //create the poker doc that needs to be added to the pokers sub collection of the poked
                            const pokerUidDoc = {
                                uid: pokeForInsightData.pokerUid,
                                userName: pokeForInsightData.pokerUserName
                            }


                            //get the notification token of the poked to identify & send notification to his device
                            return db.collection('Users').doc(pokeForInsightData.pokedUid).collection('notificationToken')
                                .doc('theNotificationToken').get().then((notificationTokenDoc: DocumentSnapshot ) => {

                                    //the fields to be same as the ones at Fs
                                    const pokedNotificationToken = notificationTokenDoc.data()?.notificationToken


                                    //Create the Notification Payload content
                                    const notificationPayload = {
                                        notification: {
                                            title: `${pokeForInsightData.pokerUserName} has poked you`,
                                            body: `to add Insights`,
                                            //Add an additional intent filter in manifest file for android for the activity with the name 
                                            //same as the clickAction here or Off Screen Notification click action wont work
                                            clickAction: ".insights.writeInsight.WriteInsight",
                                            image: `${pokeForInsightData.photoUrl}`
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
                                        senderUserName: pokeForInsightData.pokerUserName,
                                        senderUid: pokeForInsightData.pokerUid,
                                        //this will be false by default, will turn true at client when clicked
                                        wasClicked: false,
                                        //this type has be same as in the client
                                        notificationChannelId: "Poke for Insights ID",
                                        intentToActivity: "WRITE_INSIGHT_ACTIVITY",
                                        intentExtrasUid: null,
                                        intentExtrasName: null,
                                        intentExtrasUserName: null,
                                        //This is needed for client to access this doc and update the wasClicked field
                                        contentId: pokeForInsightData.pokerUid,
                                        notificationId: nofiticationDocId
                                    }

                                    const promises = []
                                    //The pokerUid is added to the pokersForInsights Sub Coll of the poked
                                    const p = db.collection('Users').doc(pokeForInsightData.pokedUid).collection('pokersForInsights')
                                        .doc(pokerUidDoc.uid).set(pokerUidDoc)
                                    promises.push(p)

                                    //Add the notification doc to the user's notification sub collection
                                    const p1 = db.collection('Users').doc(pokeForInsightData.pokedUid).collection('Notifications')
                                        .doc(pokeForInsightData.pokerUid).set(notificationObject)
                                    promises.push(p1)

                                    //Check if the notificationToken is not null only then attempt to send as it will fail without it anyways
                                    if (pokedNotificationToken) {
                                        //Send the notification to the user
                                        const p2 = admin.messaging().sendToDevice(pokedNotificationToken, notificationPayload)
                                        promises.push(p2)
                                    }
                                    return Promise.all(promises)

                                })
                        }
                    })
            }
        })
})