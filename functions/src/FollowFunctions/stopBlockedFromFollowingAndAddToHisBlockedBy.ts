import * as functions from 'firebase-functions'
const admin = require('firebase-admin')

//When client blocks a person, Firestore triggers a background function to remove blocker(himself)
//from the blocked person's following sub collection
export const stopBlockedFromFollowingAndAddToTheHisBlockedBy = functions.region('asia-east2').firestore.document
  ('Users/{blockerUid}/blocked/{blockedUid}').onCreate(async (blockedData, context) => {

    const blockedUid = context.params.blockedUid
    const blockerUid = context.params.blockerUid

    const promises = []
    //Add Blocker to Blocked by Sub Collection of the Blocked
    //User need not know whom all he has been blocked by hence just the Uid is added for
    //Checking purposes in perope recycler views
    const p = admin.firestore().collection('Users').doc(blockedUid).collection('blockedBy').doc(blockerUid).set({
      uid: blockerUid
    })
    promises.push(p)

    //Check if the blocked person is following the blocker, 
    const blockedFollowingDocRef = admin.firestore().collection('Users').doc(blockedUid).collection('following').doc(blockerUid)
    const blockedFollowingDoc = await blockedFollowingDocRef.get()
    //if yes then stop following and reduce the noOfFollowing at blocked
    if (blockedFollowingDoc.exists) {
      //Stop the Blocked from following the Blocker
      const p1 = admin.firestore().collection('Users').doc(blockedUid).collection('following').doc(blockerUid).delete()
      promises.push(p1)
      //Blocked has stopped following a user so reduce the noOfFollowing count in his ProfileInfo Doc
      const p2 = admin.firestore().collection('Users').doc(blockedUid).collection('ProfileInfo').doc(blockedUid).update({
        noOfFollowing: admin.firestore.FieldValue.increment(-1)
      })
      promises.push(p2)
    }
    //run all the promises
    return Promise.all(promises)

  })