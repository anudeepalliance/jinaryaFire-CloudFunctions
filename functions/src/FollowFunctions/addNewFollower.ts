import * as functions from 'firebase-functions'
const admin = require('firebase-admin')


export const newFollowerGained = functions.region('asia-east2').https.onCall((followData, context) => {
    
    if (!context.auth) {
        throw new functions.https.HttpsError(
          'unauthenticated', 
          'only authenticated users can add requests'
        )
      }
  
      const followerUid = context.auth.uid
      const followeeUid = followData.followeeUid
  
      return admin.firestore()
      .collection('Users').doc(followeeUid)
      .update({
        followers: admin.firestore.FieldValue.arrayUnion(followerUid)
      })
    
  })