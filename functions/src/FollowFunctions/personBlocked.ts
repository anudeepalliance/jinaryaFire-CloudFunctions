import * as functions from 'firebase-functions'
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore'
const admin = require('firebase-admin')

//When client blocks a person, Firestore triggers a background function to 
//1. add blocker to the blockedBy sub coll of the blocked
//2. Stop the Blocked from following the Blocker & decrement the noOfFollowing of the blocked
//3. set the interestMeter at blocked's compsSentNosDoc located at the blocker to 0
//4. set the personBlocked status of blocked's complimentSender person located at blocker's compsSenders subColl to true
//5. set the userBlocked status at blocker's complimentSender person located at blocked's compsSenders subColl to true
//6. delete unRead comps sent by Blocker to Blocked
//7. delete unRead comps sent by Blocked to Blocker
export const personBlocked = functions.region('asia-south1').firestore.document
  ('Users/{blockerUid}/blocked/{blockedUid}').onCreate(async (blockedData, context) => {

    const db = admin.firestore()
    const blockedUid = context.params.blockedUid
    const blockerUid = context.params.blockerUid

    return personWasBlocked()

    async function personWasBlocked() {

      await addBlockedToBlockedBySubColl()

      await stopBlockedFromFollowingTheBlocker()

      await setInterestMeterAtCompSentNosToZeroAtBlocked()

      await setPersonBlockedAtCompSenderPersonToTrue()

      await setUserBlockedAtCompSenderPersonToTrue()

      await deleteAllUnReadComplimentsSentByBlocker()

      await deleteAllUnReadComplimentsReceivedByBlocked()

    }

    async function addBlockedToBlockedBySubColl() {
      //Add Blocker to Blocked by Sub Collection of the Blocked
      //User need not know whom all he has been blocked by hence just the Uid is added for
      //Checking purposes in perope recycler views
      await db.collection('Users').doc(blockedUid).collection('blockedBy').doc(blockerUid).set({
        uid: blockerUid
      })

    }

    async function stopBlockedFromFollowingTheBlocker() {
      //Check if the blocked person is following the blocker
      const blockedFollowingDocRef = db.collection('Users').doc(blockedUid).collection('following').doc(blockerUid)
      const blockedFollowingDoc = await blockedFollowingDocRef.get()
      //if yes then stop following and reduce the noOfFollowing at blocked
      if (blockedFollowingDoc.exists) {
        //Stop the Blocked from following the Blocker
        await db.collection('Users').doc(blockedUid).collection('following').doc(blockerUid).delete()
        //Blocked has stopped following a user so reduce the noOfFollowing count in his ProfileInfo Doc
        await db.collection('Users').doc(blockedUid).collection('ProfileInfo').doc(blockedUid).update({
          noOfFollowing: admin.firestore.FieldValue.increment(-1)
        })
      }
    }

    async function setInterestMeterAtCompSentNosToZeroAtBlocked() {
      const compsSentNosDocOfBlockerDocRef = db.collection('Users').doc(blockedUid).collection('complimentsSentNumbers').doc(blockerUid)
    const compsSentNosDocOfBlocker = await compsSentNosDocOfBlockerDocRef.get()
    if ( compsSentNosDocOfBlocker.exists ) {
      //set the interestMeter to 0 at blocked's compsSentNosDoc of the blocker
      await compsSentNosDocOfBlockerDocRef.update({
        interestMeter: 0
      })
    }
  }

    async function setPersonBlockedAtCompSenderPersonToTrue() {
      //set the personBlocked status of blocked's complimentSender person located at blocker's compsSenders subColl to true
      const complimentSenderAtBlockerDoc = db.collection('Users').doc(blockerUid).collection('complimentSenders').doc(blockedUid)
      await complimentSenderAtBlockerDoc.update({
        personBlocked: true
      })
    }

    async function setUserBlockedAtCompSenderPersonToTrue() {
      //set the userBlocked status at blocker's complimentSender person located at blocked's compsSenders subColl to true
      const complimentSenderAtBlockedDoc = db.collection('Users').doc(blockedUid).collection('complimentSenders').doc(blockerUid)
      await complimentSenderAtBlockedDoc.update({
        userBlocked: true
      })
    }

    //disabled this since its alright to see unRead compsReceived from blocker, this will avoid exploitation by blocker,
    //and sticks to whatsApp logic where unRead msgs can still be seen by blocked person
    async function deleteAllUnReadComplimentsSentByBlocker() {
      //delete unRead comps sent by Blocker to Blocked
      // const unReadCompsSentByBlocker = db.collection('Users').doc(blockedUid).collection('complimentSenders').doc(blockerUid)
      //   .where('complimentRead', '==', false)

      // await unReadCompsSentByBlocker.get().then(async ( unReadCompsSent : DocumentSnapshot[]) => {
      //   unReadCompsSent.forEach(async unReadCompSent => {
      //     const complimentRef = unReadCompSent.ref
      //     await complimentRef.delete()
      //   })
      // })

    }

    async function deleteAllUnReadComplimentsReceivedByBlocked() {
      //delete unRead comps sent by Blocked to Blocker
      const unReadCompsReceivedByBlocked = db.collection('Users').doc(blockerUid).collection('complimentSenders').doc(blockedUid)
      .where('complimentRead', '==', false)

    await unReadCompsReceivedByBlocked.get().then(async ( unReadCompsReceived : DocumentSnapshot[]) => {
      unReadCompsReceived.forEach(async unReadCompReceived => {
        const complimentRef = unReadCompReceived.ref
        await complimentRef.delete()
      })
    })

    }


  })