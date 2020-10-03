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
        //variable to track the noOfCompliments unblocked
        let noOfCompsUnblocked = 0

        //Get all the compliment received documents from the blocked user
        const unBlockedCompsSentDocs = admin.firestore().collectionGroup('complimentsReceived')
            .where('senderUid', '==', unBlockerUid).where('receiverUid', '==', unBlockedUid)
        //get the userProfile document of the unBlocker
        const unBlockerUserProfileDocRef = admin.firestore().collection('Users').doc(unBlockerUid).collection('ProfileInfo')
            .doc(unBlockerUid)
        //get the compsSentNumbers document of the blocker
        const unBlockerCompsSentNumbersDocRef = admin.firestore().collection('Users').doc(unBlockerUid).collection('complimentsSentNumbers')
            .doc(unBlockedUid)


        async function markAllUnBlockedCompsSentReceiverBlockedToFalse() {
            await unBlockedCompsSentDocs.get().then(async (compSentDocs: DocumentSnapshot[]) => {
                compSentDocs.forEach(async compSentDoc => {
                    noOfCompsUnblocked++
                    const complimentDocRef = compSentDoc.ref.path
                    await admin.firestore().doc(complimentDocRef).update({
                        receiverBlocked: false
                        })
                })
                //increment the noOfComplimentsReceived field by noOfComps unblocked
                await unBlockerUserProfileDocRef.update({
                    noOfComplimentsSent: admin.firestore.FieldValue.increment(noOfCompsUnblocked)
                })
                //increment at complimentsSentNumbers
                await unBlockerCompsSentNumbersDocRef.update({
                    noOfComplimentsSent: admin.firestore.FieldValue.increment(noOfCompsUnblocked)
                })
            })
        }

        return markAllUnBlockedCompsSentReceiverBlockedToFalse()
    })