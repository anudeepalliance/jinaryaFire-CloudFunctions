import * as functions from 'firebase-functions'
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore'
const admin = require('firebase-admin')

//when a user deletes an insightAdded then delete all the 
//whatsNewDoc versions of that deleted insight
export const deleteWhatsNewDocWhenInsightAddedDeleted = functions.region('asia-east2').firestore.document
  ('Users/{userId}/insights/{insightId}').onDelete((data, context) => {

    //get the id of the compliment that was deleted
    const insightId = context.params.insightId
      //get the userId of the user who deleted his compliment received
      const deleterUserId = context.params.userId
      const db = admin.firestore()

      //get a reference to the whatsNewDoc version of the compliment Deleted
      const WhatsNewDocsToDeleteRef = db.collectionGroup('whatsNew')
          .where('id', '==', `${insightId}`)
          //not required to check for the secondary but doing it for safety just in case of doc id overlap
          .where('primaryProfileUid', '==', `${deleterUserId}`)

      return WhatsNewDocsToDeleteRef.get().then(
          async (querySnapshot: { docs: DocumentSnapshot[] }) => {
              await Promise.all(querySnapshot.docs.map((whatsNewItem) => {
                  //get the document reference path of that document
                  const whatsNewDocPath = whatsNewItem.ref.path
                  //delete all the docs with that document reference
                  return db.doc(whatsNewDocPath).delete()
              }))
          })
  })