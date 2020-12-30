import * as functions from 'firebase-functions'
const admin = require('firebase-admin')

//When client Unblocks a person, Firestore calls a background function to 
//1. Remove unBlocker(himself) from the unBlocked person's BlockedBy Sub Coll
//2. Set the interest Meter of the unBlocker to 1 at unBlocked's compsSentNoDoc
//3. Set personBlocked field to false at unBlocked compliment sender person doc located in unBlocker's compliment senders sub Coll
//4. Set userBlocked field to false at unBlocker compliment sender person doc located in unBlocked's compliment senders sub Coll
export const removeUnBlockeeFromBlockedBy = functions.region('asia-south1').firestore.document
    ('Users/{unBlockerUid}/blocked/{unBlockedUid}').onDelete(async (unBlockedData, context) => {

        const unBlockerUid = context.params.unBlockerUid
        const unBlockedUid = context.params.unBlockedUid
        const db = admin.firestore()

        const promises = []
        //Remove Unblocker from unBlocked person's BlockedBy Sub Coll
        const p = db.collection('Users').doc(unBlockedUid).collection('blockedBy').doc(unBlockerUid).delete()
        promises.push(p)

        //get a doc ref to the compsSentNosDoc
        const compsSentNosDocOfBlockerRef = db.collection('Users').doc(unBlockedUid).collection('complimentsSentNumbers').doc(unBlockerUid)
        const compsSentNosDocOfBlocker = await compsSentNosDocOfBlockerRef.get()
        //Check if the blocker exists in the compsSentNosColl of the blocked
        if (compsSentNosDocOfBlocker.exists) {
            //Set the interest Meter of the unBlocker to 1 at unBlocked's compsSentNoDoc of the unBlocker
            const p1 = compsSentNosDocOfBlockerRef.update({
                interestMeter: 1
            })
            promises.push(p1)
        }

        //Set personBlocked field to false at unBlocked compliment sender person doc located in unBlocker's compliment senders sub Coll
        const complimentSenderAtUnBlockerDoc = db.collection('Users').doc(unBlockerUid).collection('complimentSenders').doc(unBlockedUid)
        const p2 = complimentSenderAtUnBlockerDoc.update({
            personBlocked: false
        })
        promises.push(p2)

        //Set userBlocked field to false at unBlocker compliment sender person doc located in unBlocked's compliment senders sub Coll
        const complimentSenderAtUnBlockedDoc = db.collection('Users').doc(unBlockedUid).collection('complimentSenders').doc(unBlockerUid)
        const p3 = complimentSenderAtUnBlockedDoc.update({
            userBlocked: false
        })
        promises.push(p3)


        return Promise.all(promises)

    })