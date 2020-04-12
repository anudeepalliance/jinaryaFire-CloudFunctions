import * as functions from 'firebase-functions'
const admin = require('firebase-admin')


export const newFollowerGained = functions.region('asia-east2').https.onCall((data, context) => {
    
    if (!context.auth) {
        throw new functions.https.HttpsError(
          'unauthenticated', 
          'only authenticated users can add requests'
        );
      }
  
      const followerPersonName = data.text
      const followerPersonUserName = data.userName
      const followerPersonProfilePhotoChosen = data.profilePhotoChosen
      const followerPersonUid = context.auth.uid
      const followeePersonUid = data.followeePersonUid
  
      return admin.firestore()
      .collection('Users').doc(`${followeePersonUid}`)
      .collection('Followers').doc(`${followerPersonUid}`)
      .set( {
        name: followerPersonName,
        userName: followerPersonUserName,
        profilePhotoChosen: followerPersonProfilePhotoChosen,
        uid: followerPersonUid
      });
    
  })