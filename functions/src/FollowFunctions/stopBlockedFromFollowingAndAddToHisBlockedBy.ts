import * as functions from 'firebase-functions'
const admin = require('firebase-admin')

//When client blocks a person, Firestore triggers a background function to 
//1. adds blocker to the blockedBy sub coll of the blocked
//2. Stop the Blocked from following the Blocker
//3. decrement the noOfFollowing of the blocked
//4. set the interestMeter at blocked's compsSentNosDoc of the blocker to 0
export const stopBlockedFromFollowingAndAddToHisBlockedBy = functions.region('asia-south1').firestore.document
  ('Users/{blockerUid}/blocked/{blockedUid}').onCreate(async (blockedData, context) => {

    const db = admin.firestore()
    const blockedUid = context.params.blockedUid
    const blockerUid = context.params.blockerUid

    const promises = []
    //Add Blocker to Blocked by Sub Collection of the Blocked
    //User need not know whom all he has been blocked by hence just the Uid is added for
    //Checking purposes in perope recycler views
    const p = db.collection('Users').doc(blockedUid).collection('blockedBy').doc(blockerUid).set({
      uid: blockerUid
    })
    promises.push(p)

    //Check if the blocked person is following the blocker, 
    const blockedFollowingDocRef = db.collection('Users').doc(blockedUid).collection('following').doc(blockerUid)
    const blockedFollowingDoc = await blockedFollowingDocRef.get()
    //if yes then stop following and reduce the noOfFollowing at blocked
    if (blockedFollowingDoc.exists) {
      //Stop the Blocked from following the Blocker
      const p1 = db.collection('Users').doc(blockedUid).collection('following').doc(blockerUid).delete()
      promises.push(p1)
      //Blocked has stopped following a user so reduce the noOfFollowing count in his ProfileInfo Doc
      const p2 = db.collection('Users').doc(blockedUid).collection('ProfileInfo').doc(blockedUid).update({
        noOfFollowing: admin.firestore.FieldValue.increment(-1)
      })
      promises.push(p2)
    }
    //Check if the blocker exists in the compsSentNosColl of the blocked
    const compsSentNosDocOfBlockerDocRef = db.collection('Users').doc(blockedUid).collection('complimentsSentNumbers').doc(blockerUid)
    const compsSentNosDocOfBlocker = await compsSentNosDocOfBlockerDocRef.get()
    if ( compsSentNosDocOfBlocker.exists ) {
      //set the interestMeter to 0 at blocked's compsSentNosDoc of the blocker
      const p3 = compsSentNosDocOfBlockerDocRef.update({
        interestMeter: 0
      })
      promises.push(p3)
    }


    //run all the promises
    return Promise.all(promises)

  })