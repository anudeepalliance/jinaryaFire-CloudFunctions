import * as functions from 'firebase-functions'
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore'
const admin = require('firebase-admin')

//When client followes a user, it  calls a callable function to add follower(himself)
//to the followee's follwers arrayField in the UserDoc
export const newFollowerGained = functions.region('asia-east2').https.onCall((followData, context) => {
    
    if (!context.auth) {
        throw new functions.https.HttpsError(
          'unauthenticated', 
          'only authenticated users can add requests'
        )
      }
  
      const followerUid = context.auth.uid
      const followeeUid = followData.followeeUid

      const isFollowerBlockedByFollowee = 
      admin.firestore().collection('Users').doc(followeeUid).collection('ProfileInfo').doc(followeeUid)
      .where('blocked', 'array-contains', [followerUid])
      .get().then(snapshot => {
          if ( !snapshot.exists) {
              return false
          } else if ( snapshot.exists ) {
            return true
          }
      })

      if ( !isFollowerBlockedByFollowee) {
        return admin.firestore()
        .collection('Users').doc(followeeUid)
        .update({
          followers: admin.firestore.FieldValue.arrayUnion(followerUid)
        })
      } else {
        return null
      }

    
  })