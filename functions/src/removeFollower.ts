import * as functions from 'firebase-functions'
const admin = require('firebase-admin')


export const removeTheFollower = functions.region('asia-east2').https.onCall((unFollowData, context) => {
    
    if (!context.auth) {
        throw new functions.https.HttpsError(
          'unauthenticated', 
          'only authenticated users can add requests'
        );
      }
  
      const unFollowerPersonUid = unFollowData.unFollowerPersonUid
      const unFolloweePersonUid = unFollowData.unFolloweePersonUid
  
      return admin.firestore()
      .collection('Users').doc(unFolloweePersonUid)
      .collection('Followers').doc(unFollowerPersonUid).delete()
    
  })