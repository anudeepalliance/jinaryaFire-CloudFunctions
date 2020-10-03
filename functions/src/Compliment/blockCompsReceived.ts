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
        //variable to track the noOfCompliments unblocked
        let noOfCompsBlocked = 0

        //Get all the compliment received documents from the blocked user
        const blockedCompsReceivedDocs = admin.firestore().collection('Users').doc(blockerUid).collection('complimentsReceived')
            .where('senderUid', '==', blockedUid)
        //get the userProfile document of the blocker
        const blockerUserProfileDocRef = admin.firestore().collection('Users').doc(blockerUid).collection('ProfileInfo')
            .doc(blockerUid)


        async function markAllBlockedCompsReceivedSenderBlockedToTrue() {
            await blockedCompsReceivedDocs.get().then(async (compReceivedDocs: DocumentSnapshot[]) => {
                compReceivedDocs.forEach(async compReceivedDoc => {
                    noOfCompsBlocked++
                    const complimentId = compReceivedDoc.data()?.complimentId
                    await admin.firestore().collection('Users').doc(blockerUid).collection('complimentsReceived')
                        .doc(complimentId).update({
                            senderBlocked: true
                        })
                })
                //increment the noOfComplimentsReceived field by noOfComps unblocked
                await blockerUserProfileDocRef.update({
                    noOfComplimentsReceived: admin.firestore.FieldValue.increment(-noOfCompsBlocked)
                })
            })
        }

        return markAllBlockedCompsReceivedSenderBlockedToTrue()

    })