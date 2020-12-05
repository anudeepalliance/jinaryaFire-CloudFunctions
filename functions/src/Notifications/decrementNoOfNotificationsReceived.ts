import * as functions from 'firebase-functions'
const admin = require('firebase-admin')

//When a new notification Doc is deleted in the Notificatons Sub Coll
//decrement the noOfNotifications received by 1
export const decrementNoOfNotificationsReceived = functions.region('asia-south1').firestore.document
    ('Users/{userId}/Notifications/{notificationDoc}').onDelete((data, context) => {

        const userId = context.params.userId
        const db = admin.firestore()

        return decrementNoOfNotificationsReceivedField()


        async function decrementNoOfNotificationsReceivedField() {
            await db.collection('Users').doc(userId)
            .collection('Notifications').doc('noOfNotificationsReceived').update({
                noOfNotificationsReceived: admin.firestore.FieldValue.increment(-1)
            })
        }


    })