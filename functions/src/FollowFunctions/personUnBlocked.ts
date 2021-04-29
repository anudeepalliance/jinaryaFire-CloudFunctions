import * as functions from 'firebase-functions'
const admin = require('firebase-admin')

//When client Unblocks a person
//1. Remove unBlocked from the blocked sub Coll of the unBlocker
//2. Remove unBlocker(himself) from the unBlocked person's BlockedBy Sub Coll
//3. Set the interest Meter of the unBlocker to 1 at unBlocked's compsSentNoDoc
//4. Set personBlocked field to false at unBlocked compliment sender person doc located in unBlocker's compliment senders sub Coll
//5. Set userBlocked field to false at unBlocker compliment sender person doc located in unBlocked's compliment senders sub Coll
export const personUnBlocked = functions.region('asia-south1').https.onCall((unBlockedData, context) => {

    //check if request came from an authenticated user
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'only authenticated users can unBlock'
        )
    }

    const unBlockerUid = context.auth.uid
    const unBlockedUid = unBlockedData.uid
    const db = admin.firestore()

    return checkBlockedAtFieldAndUnBlock()


    async function checkBlockedAtFieldAndUnBlock() {
        //get the blockedOrUnBlockedAt field from unBlockedPerson doc located at UnBlockers blocked sub coll of
        const unBlockedPersonDoc = await db.collection('Users').doc(unBlockerUid).collection('blocked').doc(unBlockedUid).get()
        const blockedOrUnBlockedAt = unBlockedPersonDoc.data()?.blockedOrUnBlockedAt
        const currentTime = Date.now()
        // const TwoDaysInMillis = 172800000
        const TwoDaysInMillis = 100
        const timeGap = currentTime - blockedOrUnBlockedAt
        //check if it is more than 48hrs since the last block/UnBlock
        if ( timeGap > TwoDaysInMillis ) {
            //If yes then update currentBlockedUnBlockedAt field and set currentlyBlocked to false
            return unBlockThePerson()
        } else {
            console.log(`timegap is ${timeGap}`)
            //it has not been 2 days yet so send an error message to client
            throw new functions.https.HttpsError(
                `unauthenticated`,
                `You need to wait 48hrs to unBlock ${unBlockedPersonDoc.userName}`
              )
        }

    }

    async function unBlockThePerson() {

        await updateBlockedAtAndCurrentlyBlockedStatus()

        await removeUnBlockedFromBlockedBySubColl()

        await setInterestMeterAtCompsSentNoLocatedAtUnBlockerToOne()

        await setInterestMeterAtCompsSentNoLocatedAtUnBlockedToOne()

        await setPersonBlockedFieldAtUnBlockerCompSenderPersonToFalse()

        await setUserBlockedFieldAtUnBlockedCompSenderPersonToFalse()
    }



    async function updateBlockedAtAndCurrentlyBlockedStatus() {
        //update the fields at unBlocked person doc
        await db.collection('Users').doc(unBlockerUid).collection('blocked').doc(unBlockedUid).update({
            blockedOrUnBlockedAt : Date.now(),
            currentlyBlocked : false
          })
    }

    async function removeUnBlockedFromBlockedBySubColl() {
        //Remove Unblocker from unBlocked person's BlockedBy Sub Coll
        await db.collection('Users').doc(unBlockedUid).collection('blockedBy').doc(unBlockerUid).delete()
    }

    async function setInterestMeterAtCompsSentNoLocatedAtUnBlockerToOne() {
        const compsSentNosDocOfUnBlockedRef = db.collection('Users').doc(unBlockerUid).collection('complimentsSentNumbers').doc(unBlockedUid)
        //set interest meter of unBlocker person at unBlockedPerson's compsSentNosCollection to 1
        const compsSentNosDocOfUnBlocker = await compsSentNosDocOfUnBlockedRef.get()
        //Check if the blocker exists in the compsSentNosColl of the blocked
        if (compsSentNosDocOfUnBlocker.exists) {
            //Set the interest Meter of the unBlocker to 1 at unBlocked's compsSentNoDoc of the unBlocker
            compsSentNosDocOfUnBlockedRef.update({
                interestMeter: 1
            })
        }
    }

    async function setInterestMeterAtCompsSentNoLocatedAtUnBlockedToOne() {
        const compsSentNosDocOfUnBlockerRef = db.collection('Users').doc(unBlockedUid).collection('complimentsSentNumbers').doc(unBlockerUid)
        //set interest meter of unBlocker person at unBlockedPerson's compsSentNosCollection to 1
        const compsSentNosDocOfUnBlocker = await compsSentNosDocOfUnBlockerRef.get()
        //Check if the blocker exists in the compsSentNosColl of the blocked
        if (compsSentNosDocOfUnBlocker.exists) {
            //Set the interest Meter of the unBlocker to 1 at unBlocked's compsSentNoDoc of the unBlocker
            compsSentNosDocOfUnBlockerRef.update({
                interestMeter: 1
            })
        }
    }

    async function setPersonBlockedFieldAtUnBlockerCompSenderPersonToFalse() {
        const unBlockedComplimentSenderRef = db.collection('Users').doc(unBlockerUid).collection('complimentSenders').doc(unBlockedUid)
        //Set personBlocked field of unBlockedComplimentSenderPerson doc located in unBlocker's compliment senders sub Coll to false
        const unBlockedComplimentSender = await unBlockedComplimentSenderRef.get()
        if ( unBlockedComplimentSender.exists ) {
            unBlockedComplimentSenderRef.update({
                personBlocked: false
            })
        }
    }

    async function setUserBlockedFieldAtUnBlockedCompSenderPersonToFalse() {
        const unBlockerComplimentSenderRef = db.collection('Users').doc(unBlockedUid).collection('complimentSenders').doc(unBlockerUid)
        //Set userBlocked field of unBlockerComplimentSenderPerson doc located in unBlocked's compliment senders sub Coll to false
        const unBlockerComplimentSender = await unBlockerComplimentSenderRef.get()
        if ( unBlockerComplimentSender.exists ) {
            unBlockerComplimentSenderRef.update({
                userBlocked: false
            })
        }
        
    }

})