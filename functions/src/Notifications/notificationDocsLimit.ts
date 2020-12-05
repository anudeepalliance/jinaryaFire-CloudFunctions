import * as functions from 'firebase-functions'
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore'
const admin = require('firebase-admin')
//track the notificationId of the last wasClicked notification, this is to check if a wasClicked variable exists
let oldestWasClickedNotificationDocRefPath = "0"

//When a new notification Doc is added to the Notificatons Sub Coll
//Check for the notificationNumbers Doc, if it is greater than 99 then delete the oldest notificationDoc
//else just increment the noOfNotifications received by 1
export const notificationDocsLimit = functions.region('asia-south1').firestore.document
    ('Users/{userId}/Notifications/{notificationDoc}').onCreate((data, context) => {

        const userId = context.params.userId
        let noOfNotifications = 0
        //It is not a new user so run the function as usual
        const db = admin.firestore()
        //path to noOfNotificationsReceived document
        const noOfNotificationsReceivedDoc = db.collection('Users').doc(userId)
            .collection('Notifications').doc(`noOfNotificationsReceived`)
        //path to Notifications collection
        const notificationsColl = db.collection('Users').doc(userId)
            .collection('Notifications')


        //If it is a new user then a default noOfNotificationsReceivedDoc with value 0
        //will be created, if so then just return else run the function
        if (data.data().noOfNotificationsReceived === 0) {
            return Promise
        } else {
            //new notification was actually created
            return getNumberOfNotificationsAndDeleteExcess()
        }

        async function getNumberOfNotificationsAndDeleteExcess() {
            //get the number of notificationsReceived
            await noOfNotificationsReceivedDoc.get().then(async (noOfNotificationsDoc: DocumentSnapshot) => {
                noOfNotifications = noOfNotificationsDoc.data()?.noOfNotificationsReceived

                if (noOfNotifications > 99) {
                    console.log(`No of notifications is greater than 99, delete the oldest notification`)
                    await deleteTheOldestWasClickedNotification()
                } else {
                    console.log(`No of notifications is less than 99, so just increment it`)
                    await incrementNoOfNotificationsReceived()
                }

            })

        }


        async function deleteTheOldestWasClickedNotification() {
            //Retreive oldest wasClicked notification
            await notificationsColl
                .where('wasClicked', '==', true)
                .orderBy('receivedTime', 'asc')
                .limit(1)
                .get()
                .then(async (oldestWasClickedNotification: DocumentSnapshot[]) => {
                    oldestWasClickedNotification.forEach(oldestWasClickedNotificationDoc => {
                        oldestWasClickedNotificationDocRefPath = oldestWasClickedNotificationDoc.ref.path
                    })

                    //If wasClicked notifications do not exist then this will be 0
                    if (oldestWasClickedNotificationDocRefPath === "0") {
                        console.log(`No wasClicked Notifications available, delete any oldest one`)
                        //just get and delete any oldest notification
                        return deleteAnOldestNotification()
                    } else {
                        console.log(`latest wasClicked available, delete it`)
                        //If it does exist then just delete it via the doc reference
                        return deleteNotifiction(oldestWasClickedNotificationDocRefPath)
                    }

                })

        }

        async function deleteAnOldestNotification() {
            await notificationsColl
                .orderBy('receivedTime', 'asc')
                .limit(1)
                .get()
                .then(async (oldestNotification: DocumentSnapshot[]) => {
                    //get a path to the notification, use this forEach method since that is the only way to access the element
                    oldestNotification.forEach( oldestNotificationDoc => {
                        return deleteNotifiction(oldestNotificationDoc.ref.path)
                    })
                })
        }


        async function deleteNotifiction(notificationDocRefPath: string) {
            await db.doc(notificationDocRefPath).delete()
        }


        async function incrementNoOfNotificationsReceived() {
            await noOfNotificationsReceivedDoc.update({
                noOfNotificationsReceived: admin.firestore.FieldValue.increment(1)
            })
        }

    })