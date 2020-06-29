import * as functions from 'firebase-functions'
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore'
const admin = require('firebase-admin')

//When a user blocks another user then set the compsReceived senderBlocked field to true
//So the blocker or blocked dont see the compliments exchanged between them
export const blockTheCompsReceived = functions.region('asia-east2').firestore.document
    ('Users/{userId}/blocked/{blockedUid}').onCreate((data, context) => {

        //get blocker's and blocked's Uids for identification
        const blockerUid = context.params.userId
        const blockedUid = context.params.blockedUid

        //Get all the compliment received documents from the blocked user
        const blockedCompsReceivedDocs = admin.firestore().collection('Users').doc(blockerUid).collection('complimentsReceived')
            .where('senderUid', '==', blockedUid)

        return blockedCompsReceivedDocs.get().then(
            async (querySnapshot: { docs: DocumentSnapshot[] }) => {
                await Promise.all(querySnapshot.docs.map((doc) => {
                    //get a reference to the document
                    const complimentDocRef = doc.ref
                    return complimentDocRef.update({
                        senderBlocked: true
                    })
                })
                )
            })
    })