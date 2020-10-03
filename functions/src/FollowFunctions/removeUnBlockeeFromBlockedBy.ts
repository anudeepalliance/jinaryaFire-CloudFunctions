import * as functions from 'firebase-functions'
const admin = require('firebase-admin')

//When client Unblocks a person, Firestore calls a background function to 
//1. Remove blocker(himself) from the blocked person's following sub collection
//2. Set the interest Meter of the unBlocker to 1 at unBlocked's compsSentNoDoc of the unBlocker
export const removeUnBlockeeFromBlockedBy = functions.region('asia-east2').firestore.document
    ('Users/{unBlockerUid}/blocked/{unBlockedUid}').onDelete(async (unBlockedData, context) => {

        const unBlockerUid = context.params.unBlockerUid
        const unBlockedUid = context.params.unBlockedUid

        const promises = []
        //Remove Unblocker from unBlocked person's BlockedBy Sub Coll
        const p = admin.firestore().collection('Users').doc(unBlockedUid).collection('blockedBy').doc(unBlockerUid).delete()
        promises.push(p)

        //get a doc ref to the compsSentNosDoc
        const compsSentNosDocOfBlockerRef = admin.firestore().collection('Users').doc(unBlockedUid).collection('complimentsSentNumbers').doc(unBlockerUid)
        const compsSentNosDocOfBlocker = await compsSentNosDocOfBlockerRef.get()
        //Check if the blocker exists in the compsSentNosColl of the blocked
        if (compsSentNosDocOfBlocker.exists) {
            //Set the interest Meter of the unBlocker to 1 at unBlocked's compsSentNoDoc of the unBlocker
            const p1 = compsSentNosDocOfBlockerRef.update({
                interestMeter: 1
            })
            promises.push(p1)
        }


        return Promise.all(promises)

    })