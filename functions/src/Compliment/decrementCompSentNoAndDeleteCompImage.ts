import * as functions from 'firebase-functions'
const admin = require('firebase-admin')
// const firebase = admin.initializeApp();

//When a receiver deletes a compliment received then 
//1. Reduce the no of compliments sent at sender's complimentsSentNos sub Collection
//2. Delete the compsSent Image at the sender's complimentsSent CS Folder
export const decrementTheCompSentNoAndDeleteCompImage = functions.region('asia-east2').firestore.document
  ('Users/{userId}/complimentsReceived/{complimentId}').onDelete((snap, context) => {

    //get the data of the deleted compliment document
    const deletedCompliment = snap.data()
    //get the Uid of the compliment deleter
    const receiverUid = context.params.userId
    //get Uid of the compliment Sender
    const senderUid = deletedCompliment?.senderUid

    const promises = []
    //Reduce the no of compliments sent at sender's complimentsSentNos sub Collection
    const p = admin.firestore().collection('Users').doc(senderUid).collection('complimentsSentNumbers')
      .doc(receiverUid).update({
        noOfComplimentsSent: admin.firestore.FieldValue.increment(-1)
      })
    promises.push(p)

    //Check if the deleted compliment had an Image, if yes then delete the image as well
    if (deletedCompliment.hasImage === true) {
      //get the id of the compliment that was deleted
      const complimentId = context.params.complimentId
      //get a reference to CS storage bucket
      const bucket = admin.storage().bucket()
      //get the name of the image
      const complimentImageName = `compliment_sent_photo_${complimentId}`
      //get a reference to the deleted compliment Image
      const complimentImagePath = `Users/${senderUid}/complimentsSent/${complimentImageName}`
      //get a reference to the compliment Image file
      const complimentImageFile = bucket.file(complimentImagePath)
      //Delete the compsSent Image at the sender's complimentsSent CS Folder
      const p1 = complimentImageFile.delete().then(() => {
        console.log(`Successfully deleted the deleted compliment photo`)
      }).catch((err: any) => {
        console.log(`Failed to delete photo, error: ${err}`)
      })
      promises.push(p1)
    }

    return Promise.all(promises)


  })