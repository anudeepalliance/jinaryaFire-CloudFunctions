import * as functions from 'firebase-functions'
const admin = require('firebase-admin')

//When client blocks a person, it  calls a callable function to remove blocker(himself)
//from the blocked person's following sub collection
export const stopFollowingTheBlockerAndToBlockedBy = 
  functions.region('asia-east2').https.onCall((blockedData, context) => {
    
    if (!context.auth) {
        throw new functions.https.HttpsError(
          'unauthenticated', 
          'only authenticated users can add requests'
        )
      }
  
      const blockedUid = blockedData.blockedUid
      const blockerUid = context.auth.uid
      const blockerName = blockedData.blockerName
      const blockerUserName = blockedData.blockerUserName

      //Add Blocker to Blocked by Sub Collection of the Blockee
      admin.firestore()
      .collection('Users').doc(blockedUid).collection('blockedBy').doc(blockerUid)
      .set({
        uid: blockerUid,
        name: blockerName,
        userName: blockerUserName
      })
  
      //Stop the Blockee from following the Blocker
      return admin.firestore()
      .collection('Users').doc(blockedUid).collection('following').doc(blockerUid)
      .delete()
    
  })