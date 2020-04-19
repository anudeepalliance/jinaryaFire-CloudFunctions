import * as functions from 'firebase-functions'
const admin = require('firebase-admin')

//When client followes a user, it  calls a callable function to add follower(himself)
//to the followee's follwers arrayField in the UserDoc
export const newFollowerGained = functions.region('asia-east2').https.onCall((followerData, context) => {
    
    if (!context.auth) {
        throw new functions.https.HttpsError(
          'unauthenticated', 
          'only authenticated users can add requests'
        )
      }
  
      const followerName = followerData.name
      const followerUserName  = followerData.userName
      const followerProfilePhotoChosen = followerData.ProfilePhotoChosen
      const followerUid = context.auth.uid
      const followeeUid = followerData.followeeUid


      return admin.firestore()
      .collection('Users').doc(followeeUid).collection('followers').doc(followerUid)
      .set({          
        name: followerName,
        userName: followerUserName,
        uid: followerUid,
        profilePhotoChosen: followerProfilePhotoChosen
        }) 

  })
  