import * as functions from 'firebase-functions'
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore'
const admin = require('firebase-admin')

//When a user unBlocks another user then set the compsReceived senderBlocked field to false
//So the unBlocker and UnBlocked can see the compliments exchanged between them
export const unBlockTheCompsReceived = functions.region('asia-east2').firestore.document
    ('Users/{userId}/blocked/{blockedUid}').onDelete((data, context) => {

        //get blocker's and blocked's Uids for identification
        const unBlockerUid = context.params.userId
        const unBlockedUid = context.params.blockedUid

        //Get all the compliment received documents from the blocked user
        const unBlockedCompsReceivedDocs = admin.firestore().collection('Users').doc(unBlockerUid).collection('complimentsReceived')
            .where('senderUid', '==', unBlockedUid)

        return unBlockedCompsReceivedDocs.get().then(
            async (querySnapshot: DocumentSnapshot[] ) => {
                await Promise.all(querySnapshot.map((doc) => {
                    //get a reference to the document
                    const complimentDocRef = doc.ref
                    return complimentDocRef.update({
                        senderBlocked: false
                    })
                })
                )
            })
    })