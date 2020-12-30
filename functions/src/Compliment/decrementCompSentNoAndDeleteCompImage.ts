import * as functions from 'firebase-functions'
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore'
const admin = require('firebase-admin')
// const firebase = admin.initializeApp();

//When a receiver deletes a compliment received then 
//1.check if noOfCompliments sent at complimentsSentNos at sender is 1, if yes then delete complimentSender doc at receiver
//2. Reduce the no of compliments sent at sender's complimentsSentNos sub Collection
//3. Decrement the noOfCompsSent at sender's userProfile Document
//4. Delete the compsSent Image at the sender's complimentsSent CS Folder
//5. Decrement the noOfCompsSent at sender's/following/receiverUid/document
//NoOfComps received by the receiver remains the same despite the delete
export const decrementCompSentNoAndDeleteCompImage = functions.region('asia-south1').firestore.document
  ('Users/{userId}/complimentsReceived/{complimentId}').onDelete((snap, context) => {

    //get the data of the deleted compliment document
    const deletedCompliment = snap.data()
    //get the Uid of the compliment deleter
    const receiverUid = context.params.userId
    //get Uid of the compliment Sender
    const senderUid = deletedCompliment?.senderUid
    const db = admin.firestore()
    const complimentSentNumbersDoc = db.collection('Users').doc(senderUid).collection('complimentsSentNumbers')
    .doc(receiverUid)

    return reduceNoOfComplimentsSentAndDeleteIt()

    async function reduceNoOfComplimentsSentAndDeleteIt() {

      //delete the compSender person at receiver if the noOfCompsSentNos is less than 2
      await deleteTheComplimentSenderPersonIfNoCompliments()

      //decrement the noOfComps sent at complimentsSentNumbers
      await complimentSentNumbersDoc.update({
        noOfComplimentsSent: admin.firestore.FieldValue.increment(-1)
      })

      //decrement the noOfComps sent at userProfile Doc
      await db.collection('Users').doc(senderUid).collection('ProfileInfo')
      .doc(senderUid).update({
        noOfComplimentsSent: admin.firestore.FieldValue.increment(-1)
      })

      //delete the compliment Image is the compliment had one
      if ( deletedCompliment.hasImage === true) {
        await deleteTheComplimentImage()
      }

      //decrement the noOfComps sent at user Followed person doc
      await db.collection('Users').doc(senderUid).collection('following')
      .doc(receiverUid).update({
        noOfComplimentsSent: admin.firestore.FieldValue.increment(-1)
      })

    }

    async function deleteTheComplimentSenderPersonIfNoCompliments() {

      await complimentSentNumbersDoc.get().then(async ( complimentSentNoDoc: DocumentSnapshot) => {
        
        const noOfNotificationsSentBeforeDecrement = complimentSentNoDoc.data()?.noOfComplimentsSent

        //delete the compSenderPerson at receiver if the number is less than 2
        if ( noOfNotificationsSentBeforeDecrement < 2 ) {
          await  db.collection('Users').doc(receiverUid).collection('complimentSenders')
          .doc(senderUid).delete().then(() => {
            console.log(`Compliment sender person at receiver deleted`)
          })
        } else {
          console.log(`No need to delete Compliment sender person at receiver since noOfCompsSent before decrement is ${noOfNotificationsSentBeforeDecrement}`)
        }

      })

    }

    async function deleteTheComplimentImage() {

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
      await complimentImageFile.delete().then(() => {
        console.log(`Successfully deleted the deleted compliment photo`)
      }).catch((err: any) => {
        console.log(`Failed to delete photo, error: ${err}`)
      })

    }

  })
