import * as functions from 'firebase-functions'
const admin = require('firebase-admin')

//When client blocks a person, it  calls a callable function to remove blocker(himself)
//from the blocked person's following array field
export const removeTheUnBlockeeFromBlockedByFsTriggered = functions.region('asia-east2').firestore.document
('Users/{unBlockerUid}/blocked/{unBlockedUid}').onDelete((unBlockedData, context) => {
  
      const unBlockerUid = context.params.unBlockerUid
      const unBlockedUid = context.params.unBlockedUid

  
      //Remove Unblocker from unBlocked person's BlockedBy Sub Coll
      return admin.firestore()
      .collection('Users').doc(unBlockedUid).collection('blockedBy').doc(unBlockerUid)
      .delete()
    
  })