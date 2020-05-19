import * as functions from 'firebase-functions'
const admin = require('firebase-admin')

//When a receiver deletes a compliment received then reduce the no of compliments sent
//at sender's complimentsSentNos sub Collection
export const decrementTheComplimentsSentNo = functions.region('asia-east2').firestore.document
  ('Users/{userId}/complimentsReceived/{complimentId}').onDelete((snap, context) => {

  //get the data of the deleted compliment document
  const deletedCompliment = snap.data();
  //get the Uid of the compliment deleter
  const receiverUid = context.params.userId
  //get Uid of the compliment Sender
  const senderUid = deletedCompliment!!.senderUid

return admin.firestore().collection('Users').doc(senderUid).collection('complimentsSentNumbers')
  .doc(receiverUid).update({
    noOfComplimentsSent : admin.firestore.FieldValue.increment(-1)
  })


  })
