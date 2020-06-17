import * as functions from 'firebase-functions'
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore'
const admin = require('firebase-admin')

//When a new notification Doc is added to the Notificatons Sub Coll
//Check for the notificationNumbers Doc, if it is greater than 99 then delete the oldest notificationDoc
//else just increment the noOfNotifications received by 1
export const deleteThe101thNotificationDoc = functions.region('asia-east2').firestore.document
    ('Users/{userId}/Notifications/{notificationDoc}').onCreate((data, context) => {

        //If it is a new user then a default noOfNotificationsReceivedDoc with value 0
        //will be created, if so then just return else run the function
        if (data.data().noOfNotificationsReceived === 0) {
            return
        } else {
            //It is not a new user so run the function as usual
            const db = admin.firestore()

            const noOfNotificationsReceivedDoc = db.collection('Users').doc(context.params.userId)
                .collection('Notifications').doc(`noOfNotificationsReceived`)

            const notificationDocs = db.collection('Users').doc(context.params.userId)
                .collection('Notifications')


            const promises = []
            //run a series of transactions to enforce NoOfNotification docs
            const p = noOfNotificationsReceivedDoc.get().then((doc1: any) => {
                //Check if the noOfNotifications Received is greater than 99
                if (doc1.data().noOfNotificationsReceived > 99) {
                    //Get the oldest Notification Doc
                    // const p1 = notificationDocs.orderBy('receivedTime', 'asc').limit(1)
                    const p1 = notificationDocs.orderBy('receivedTime', 'asc').limit(1)
                    .get().then((querySnapshot: { docs: DocumentSnapshot[] }) => {
                            //get the oldest notificationDoc
                            const oldestNotificationDoc = querySnapshot.docs[0]
                            //Get the notificationDocId of the oldest notification
                            const oldestNotificationDocId = oldestNotificationDoc.data()?.notificationDocId
                            //delete the oldest notification Doc
                            const p2 = notificationDocs.doc(oldestNotificationDocId).delete()
                            promises.push(p2)
                        })
                    promises.push(p1)
                } else {
                    //else just increment the noOfNotificationsReceived field
                    const p3 = noOfNotificationsReceivedDoc.update({
                        noOfNotificationsReceived: admin.firestore.FieldValue.increment(1)
                    })
                    promises.push(p3)
                }
            })
            promises.push(p)
            return Promise.all(promises)
        }
    })