import * as functions from 'firebase-functions'
const admin = require('firebase-admin')


export const stopFollowingTheBlocker = functions.region('asia-east2').https.onCall((blockedData, context) => {
    
    if (!context.auth) {
        throw new functions.https.HttpsError(
          'unauthenticated', 
          'only authenticated users can add requests'
        )
      }
  
      const blockerUid = context.auth.uid
      const blockedUid = blockedData.blockedUid
  
      return admin.firestore()
      .collection('Users').doc(blockedUid)
      .update({
        following: admin.firestore.FieldValue.arrayRemove(blockerUid)
      })
    
  })