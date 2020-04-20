import * as functions from 'firebase-functions'
const admin = require('firebase-admin')

//When client blocks a person, it  calls a callable function to remove blocker(himself)
//from the blocked person's following array field
export const removeTheUnBlockeeFromBlockedByFsTriggered = 
  functions.region('asia-east2').https.onCall((unBlockedData, context) => {
    
    if (!context.auth) {
        throw new functions.https.HttpsError(
          'unauthenticated', 
          'only authenticated users can add requests'
        )
      }
  
      const unBlockeeUid = unBlockedData.unBlockeeUid
      const blockedUid = unBlockedData.blockedUid

  
      //Remove Unblockee from blocked person Blocked By Sub Col
      return admin.firestore()
      .collection('Users').doc(blockedUid).collection('blockedBy').doc(unBlockeeUid)
      .delete()
    
  })