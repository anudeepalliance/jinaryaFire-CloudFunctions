import * as functions from 'firebase-functions'
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore'
const admin = require('firebase-admin')

//When a user blocks another user then set the compliments Sent receivedBlocked field to true
//So the blocker or blocked dont see the compliments exchanged between them
export const blockTheCompsSent = functions.region('asia-east2').firestore.document
    ('Users/{userId}/blocked/{blockedUid}').onCreate((data, context) => {

        //get blocker's and blocked's Uids for identification
        const blockerUid = context.params.userId
        const blockedUid = context.params.blockedUid

        //Get all the compliment received documents from the blocked user
        const blockedCompsSentDocs = admin.firestore().collectionGroup('complimentsReceived')
            .where('senderUid', '==', blockerUid).where('receiverUid', '==', blockedUid)

        return blockedCompsSentDocs.get().then(
            async (querySnapshot:DocumentSnapshot[]) => {
                await Promise.all(querySnapshot.map((doc) => {
                    //get a reference to the document
                    const complimentDocRef = doc.ref
                    return complimentDocRef.update({
                        receiverBlocked: true
                    })
                })
                )
            })
    })