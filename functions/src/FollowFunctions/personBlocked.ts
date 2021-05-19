import * as functions from 'firebase-functions'
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore'
const admin = require('firebase-admin')
const utilityFunctions = require('frequentFunctions')

//When client blocks a person, Firestore triggers a background function to 
//1. add blocked to the blocked sub coll of the blocker
//2. Stop following the blocked and decrement noOfFollowers by 1
//3. add blocker to the blockedBy sub coll of the blocked
//4. Stop the Blocked from following the Blocker & decrement the noOfFollowing of the blocked
//5. set the interestMeter at blocked's compsSentNosDoc located at the blocker to 0
//6. set the personBlocked status of blocked's complimentSender person located at blocker's compsSenders subColl to true
//7. set the userBlocked status at blocker's complimentSender person located at blocked's compsSenders subColl to true
//8. delete unRead comps sent by Blocker to Blocked
//9. delete unRead comps sent by Blocked to Blocker
export const personBlocked = functions.region('asia-south1').https.onCall((blockedPersonData, context) => {

  //check if request came from an authenticated user
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'only authenticated users can block'
    )
  }

  const db = admin.firestore()
  const blockedUid = blockedPersonData.uid
  const blockerUid = context.auth.uid 

    return checkIfBlockedPersonExistsAndBlock()


  async function checkIfBlockedPersonExistsAndBlock() {
    //get the blocked person
    const blockedPerson = await db.collection('Users').doc(blockerUid).collection('blocked').doc(blockedUid).get()
    //see if blocked person exists
    if (blockedPerson.exists) {
      //if exisits then get the blockedOrUnBlockedFiled
      const blockedOrUnBlockedAt = blockedPerson.data()?.blockedOrUnBlockedAt
      const currentTime = Date.now()
      // const TwoDaysInMillis = 172800000
      const TwoDaysInMillis = 100
      const timeGap = currentTime - blockedOrUnBlockedAt
      //If it was done more than 48hrs ago then update the blockedOrUnBlockedAt field and currently blocked fueld
      if (timeGap > TwoDaysInMillis) {

        return blockThePerson()

      } else {
            //it has not been 2 days yet so send an error message to client
            throw new functions.https.HttpsError(
              `unauthenticated`,
              `You need to wait 48hrs to Block ${blockedPerson.userName}.`
            )
      }
    } else {
      //If does not exist then just add the blocked person and execute the other functions
      return blockThePerson()
    }

  }

  async function blockThePerson() {

    await addBlockedToBlockedSubCollOfBlocker()

    await stopBlockerFromFollowingTheBlocked()

    // await setInterestMeterAtCompsSentNoToZeroAtBlocker()

    await stopBlockedFromFollowingTheBlocker()

    // await setInterestMeterAtCompSentNosToZeroAtBlocked()

    // await setPersonBlockedAtCompSenderPersonToTrue()

    // await setUserBlockedAtCompSenderPersonToTrue()

    // await deleteAllUnReadComplimentsSentByBlocker()

    // await deleteAllUnReadComplimentsReceivedByBlocked()

    await deleteFollowRequestsBetweenTheTwo()

  }

  async function addBlockedToBlockedSubCollOfBlocker() {
    //create a blocked person object from the function data and add the person to the blocked Sub Coll\
    const blockedPersonDoc = {
      blockedId : utilityFunctions.randomId(),
      blockedUid: blockedPersonData.uid,
      blockedOrUnBlockedAt: Date.now(),
      currentlyBlocked: true,
      blockerUid: blockerUid
    }

    //add the blocked person to the blocked sub Coll of the blocker
    await db.collection('Users').doc(blockerUid).collection('blocked').doc(blockedUid).set(blockedPersonDoc)

  }


  async function stopBlockerFromFollowingTheBlocked() {
    const blockedFollowingPerson = await db.collection('Users').doc(blockerUid).collection('following').doc(blockedUid).get()
    if (blockedFollowingPerson.exists) {
      //stop following the blocked
      await db.collection('Users').doc(blockerUid).collection('following').doc(blockedUid).delete()
      //decrement noOfFollowing People
      // await db.collection('Users').doc(blockerUid).collection('ProfileInfo').doc(blockerUid).update({
      //   noOfFollowing: admin.firestore.FieldValue.increment(-1)
      // })
      //removed the blocker as follower to the blocked ( it exists since he was following the blocked )
      await db.collection('Users').doc(blockedUid).collection('followers').doc(blockerUid).delete()
      //decrement the noOfFollowers at blocked
      // await db.collection('Users').doc(blockedUid).collection('ProfileInfo').doc(blockedUid).update({
      //   noOfFollowers: admin.firestore.FieldValue.increment(-1)
      // })
    }
  }

  // async function setInterestMeterAtCompsSentNoToZeroAtBlocker() {
  //   const compsSentNosDocOfBlockedDocRef = db.collection('Users').doc(blockerUid).collection('complimentsSentNumbers').doc(blockedUid)
  //   const compsSentNosDocOfBlocked = await compsSentNosDocOfBlockedDocRef.get()
  //   if (compsSentNosDocOfBlocked.exists) {
  //     //set the interestMeter to 0 at blocked's compsSentNosDoc of the blocker
  //     await compsSentNosDocOfBlockedDocRef.update({
  //       interestMeter: 0
  //     })
  //   }
  // }


  async function stopBlockedFromFollowingTheBlocker() {
    //Check if the blocked person is following the blocker
    const blockerFollowingDocRef = db.collection('Users').doc(blockedUid).collection('following').doc(blockerUid)
    const blockerFollowingDoc = await blockerFollowingDocRef.get()
    //if yes then stop following and reduce the noOfFollowing at blocked
    if (blockerFollowingDoc.exists) {
      //Stop the Blocked from following the Blocker
      await db.collection('Users').doc(blockedUid).collection('following').doc(blockerUid).delete()
      //decrement the noOfFollowing count in his ProfileInfo Doc
      await db.collection('Users').doc(blockedUid).collection('ProfileInfo').doc(blockedUid).update({
        noOfFollowing: admin.firestore.FieldValue.increment(-1)
      })
      //remove blocked as follower at blocker, blocked is a follower at blocker since he was following the blocker
      await db.collection('Users').doc(blockerUid).collection('followers').doc(blockedUid).delete()
      //decrement the noOfFollowers of Blocker
      await db.collection('Users').doc(blockedUid).collection('ProfileInfo').doc(blockedUid).update({
        noOfFollowers: admin.firestore.FieldValue.increment(-1)
      })
    }
  }

  // async function setInterestMeterAtCompSentNosToZeroAtBlocked() {
  //   const compsSentNosDocOfBlockerDocRef = db.collection('Users').doc(blockedUid).collection('complimentsSentNumbers').doc(blockerUid)
  //   const compsSentNosDocOfBlocker = await compsSentNosDocOfBlockerDocRef.get()
  //   if (compsSentNosDocOfBlocker.exists) {
  //     //set the interestMeter to 0 at blocked's compsSentNosDoc of the blocker
  //     await compsSentNosDocOfBlockerDocRef.update({
  //       interestMeter: 0
  //     })
  //   }
  // }

  // async function setPersonBlockedAtCompSenderPersonToTrue() {
  //   const complimentSenderAtBlockerDocRef = db.collection('Users').doc(blockerUid).collection('complimentSenders').doc(blockedUid)
  //   //set the personBlocked status of blocked's complimentSender person located at blocker's compsSenders subColl to true
  //   const complimentSenderAtBlockerDoc = await complimentSenderAtBlockerDocRef.get()
  //   if ( complimentSenderAtBlockerDoc.exists ) {
  //     await complimentSenderAtBlockerDocRef.update({
  //       personBlocked: true
  //     })
  //   }
  // }

  // async function setUserBlockedAtCompSenderPersonToTrue() {
  //   const complimentSenderAtBlockedDocRef = db.collection('Users').doc(blockedUid).collection('complimentSenders').doc(blockerUid)
  //   //set the userBlocked status at blocker's complimentSender person located at blocked's compsSenders subColl to true
  //   const complimentSenderAtBlockedDoc = await complimentSenderAtBlockedDocRef.get()
  //   if (complimentSenderAtBlockedDoc.exists) {
  //     await complimentSenderAtBlockedDocRef.update({
  //       userBlocked: true
  //     })
  //   }
  // }

  //disabled this since its alright to see unRead compsReceived from blocker, this will avoid exploitation by blocker,
  //and sticks to whatsApp logic where unRead msgs can still be seen by blocked person
  // async function deleteAllUnReadComplimentsSentByBlocker() {
    //delete unRead comps sent by Blocker to Blocked
    // const unReadCompsSentByBlocker = db.collection('Users').doc(blockedUid).collection('complimentSenders').doc(blockerUid)
    //   .where('complimentRead', '==', false)

    // await unReadCompsSentByBlocker.get().then(async ( unReadCompsSent : DocumentSnapshot[]) => {
    //   unReadCompsSent.forEach(async unReadCompSent => {
    //     const complimentRef = unReadCompSent.ref
    //     await complimentRef.delete()
    //   })
    // })

  // }

  // async function deleteAllUnReadComplimentsReceivedByBlocked() {
  //   //delete unRead comps sent by Blocked to Blocker
  //   const unReadCompsReceivedByBlocked = db.collection('Users').doc(blockerUid).collection('complimentSenders').doc(blockedUid)
  //   .collection('compliments').where('complimentRead', '==', false)

  //   await unReadCompsReceivedByBlocked.get().then(async (unReadCompsReceived: DocumentSnapshot[]) => {
  //     unReadCompsReceived.forEach(async unReadCompReceived => {
  //       const complimentRef = unReadCompReceived.ref
  //       await complimentRef.delete()
  //     })
  //   })

  // }

  async function deleteFollowRequestsBetweenTheTwo() {
    //delete follow request from blocked to the blocker
    await db.collection('Users').doc(blockerUid).collection('followRequests')
    .doc(blockedUid).delete()

    //delete follow request from blocker to the blocked
    await db.collection('Users').doc(blockedUid).collection('followRequests')
    .doc(blockerUid).delete()

  }


})