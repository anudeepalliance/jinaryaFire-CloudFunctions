import * as functions from 'firebase-functions'
const admin = require('firebase-admin')

//When client un-follows a user, it calls a callable function to remove follower(himself)
//from the unfollowee's followers array field
export const removeTheUserAsFollower = functions.region('asia-east2').https.onCall((unFollowData, context) => {
    
    if (!context.auth) {
        throw new functions.https.HttpsError(
          'unauthenticated', 
          'only authenticated users can add requests'
        );
      }
  
      const unFollowerUid = context.auth.uid
      const unFolloweeUid = unFollowData.unFolloweeUid
  
      return admin.firestore()
      .collection('Users').doc(unFolloweeUid)
      .update({
        followers: admin.firestore.FieldValue.arrayRemove(unFollowerUid)
      })
    
  })