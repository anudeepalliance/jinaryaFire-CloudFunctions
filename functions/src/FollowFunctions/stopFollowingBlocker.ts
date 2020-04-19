import * as functions from 'firebase-functions'
const admin = require('firebase-admin')

//When client blocks a person, it  calls a callable function to remove blocker(himself)
//from the blocked person's following array field
export const stopFollowingTheBlocker = functions.region('asia-east2').https.onCall((blockedData, context) => {
    
    if (!context.auth) {
        throw new functions.https.HttpsError(
          'unauthenticated', 
          'only authenticated users can add requests'
        )
      }
  
      const blockerUid = context.auth.uid
      const blockedUid = blockedData.blockedUid

      admin.firestore()
      .collection('Users').doc(blockedUid).collection('blockedBy').doc(blockerUid)
      .set({
        uid: blockerUid
      })
  
      return admin.firestore()
      .collection('Users').doc(blockedUid)
      .update({
        following: admin.firestore.FieldValue.arrayRemove(blockerUid)
      })
    
  })