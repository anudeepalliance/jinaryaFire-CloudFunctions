import * as functions from 'firebase-functions'
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore'
const admin = require('firebase-admin')

//When a user blocks another user then set the compliments Sent receivedBlocked field to true
//So the blocker or blocked dont see the compliments exchanged between them
export const blockCompsSent = functions.region('asia-south1').firestore.document
    ('Users/{userId}/blocked/{blockedUid}').onCreate((data, context) => {

        //get blocker's and blocked's Uids for identification
        const blockerUid = context.params.userId
        const blockedUid = context.params.blockedUid
        //variable to track the noOfCompliments blocked
        let noOfCompsBlocked = 0

        //Get all the compliment received documents from the blocked user
        const blockedCompsSentDocs = admin.firestore().collectionGroup('complimentsReceived')
            .where('senderUid', '==', blockerUid).where('receiverUid', '==', blockedUid)
        //get the userProfile document of the blocker
        const blockerUserProfileDocRef = admin.firestore().collection('Users').doc(blockerUid).collection('ProfileInfo')
            .doc(blockerUid)
        //get the compsSentNumbers document of the blocker
        const blockerCompsSentNumbersDocRef = admin.firestore().collection('Users').doc(blockerUid).collection('complimentsSentNumbers')
            .doc(blockedUid)

        async function markAllBlockedCompsSentReceiverBlockedToTrue() {
            await blockedCompsSentDocs.get().then(async (compSentDocs: DocumentSnapshot[]) => {
                compSentDocs.forEach(async compSentDoc => {
                    noOfCompsBlocked++
                    const complimentDocRef = compSentDoc.ref.path
                    await admin.firestore().doc(complimentDocRef).update({
                        receiverBlocked: true
                    })
                })
                //decrement the noOfComplimentsSemt field by noOfComps blocked
                await blockerUserProfileDocRef.update({
                    noOfComplimentsSent: admin.firestore.FieldValue.increment(-noOfCompsBlocked)
                })
                //decrement at complimentsSentNumbers
                await blockerCompsSentNumbersDocRef.update({
                    noOfComplimentsSent: admin.firestore.FieldValue.increment(-noOfCompsBlocked)
                })
            })
        }

        return markAllBlockedCompsSentReceiverBlockedToTrue()
    })