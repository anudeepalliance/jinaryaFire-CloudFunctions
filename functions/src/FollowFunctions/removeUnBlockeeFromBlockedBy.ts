import * as functions from 'firebase-functions'
const admin = require('firebase-admin')

//When client Unblocks a person, Firestore calls a background function to remove blocker(himself)
//from the blocked person's following sub collection
export const removeTheUnBlockeeFromBlockedBy = functions.region('asia-east2').firestore.document
('Users/{unBlockerUid}/blocked/{unBlockedUid}').onDelete((unBlockedData, context) => {
  
      const unBlockerUid = context.params.unBlockerUid
      const unBlockedUid = context.params.unBlockedUid

  
      //Remove Unblocker from unBlocked person's BlockedBy Sub Coll
      return admin.firestore()
      .collection('Users').doc(unBlockedUid).collection('blockedBy').doc(unBlockerUid)
      .delete()
    
  })