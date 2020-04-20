import * as functions from 'firebase-functions'
const admin = require('firebase-admin')

//When client blocks a person, it  calls a callable function to remove blocker(himself)
//from the blocked person's following sub collection
export const stopFollowingTheBlockerAndToBlockedBy = functions.region('asia-east2').firestore.document
  ('Users/{blockerUid}/blocked/{blockeeUid}').onCreate((blockedData, context) => {

      const blockeeUid = context.params.blockeeUid
      const blockerUid = context.params.blockerUid

      //Add Blocker to Blocked by Sub Collection of the Blockee
      admin.firestore().collection('Users').doc(blockeeUid).collection('blockedBy').doc(blockerUid)
      .set({
        uid: blockerUid
      })
  
      //Stop the Blockee from following the Blocker
      return admin.firestore()
      .collection('Users').doc(blockeeUid).collection('following').doc(blockerUid)
      .delete()
    
  })