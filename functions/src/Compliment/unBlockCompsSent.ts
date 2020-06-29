import * as functions from 'firebase-functions'
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore'
const admin = require('firebase-admin')

//When a user unBlocks another user then set the compliments Sent receivedBlocked field to false
//So the unBlocker or unBlocked can see the compliments exchanged between them
export const unBlockTheCompsSent = functions.region('asia-east2').firestore.document
    ('Users/{userId}/blocked/{blockedUid}').onDelete((data, context) => {

        //get blocker's and blocked's Uids for identification
        const unBlockerUid = context.params.userId
        const unBlockedUid = context.params.blockedUid

        //Get all the compliment received documents from the blocked user
        const unBlockedCompsSentDocs = admin.firestore().collectionGroup('complimentsReceived')
            .where('senderUid', '==', unBlockerUid).where('receiverUid', '==', unBlockedUid)

        return unBlockedCompsSentDocs.get().then(
            async (querySnapshot: { docs: DocumentSnapshot[] }) => {
                await Promise.all(querySnapshot.docs.map((doc) => {
                    //get a reference to the document
                    const complimentDocRef = doc.ref
                    return complimentDocRef.update({
                        receiverBlocked: false
                    })
                })
                )
            })
    })