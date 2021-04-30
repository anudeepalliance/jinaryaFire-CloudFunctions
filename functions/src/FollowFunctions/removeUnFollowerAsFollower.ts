import * as functions from 'firebase-functions'
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore'
const admin = require('firebase-admin')

//When client un-follows a user, it calls a background FS triggered function to remove the client
//from the unfollowed's followers sub collection
export const removeUnFollowerAsFollower = functions.region('asia-south1').firestore.document
  ('Users/{unFollowerUid}/following/{unFollowedUid}').onDelete((data, context) => {

    const db = admin.firestore()
    const unFollowerUid = context.params.unFollowerUid
    const unFollowedUid = context.params.unFollowedUid
    //get reference to the follower's whatsNewSubColl
    const unFollowerWhatsNewColl = db.collection('Users').doc(unFollowerUid).collection('whatsNew')
    //get reference to the follower's noOfFollowedPersonUnReadWhatsNewItems
    const noOfFollowedPersonUnReadWhatsNewItemsDoc = db.collection('Users').doc(unFollowerUid).collection('whatsNewRecords').doc('noOfFollowedPersonUnReadWhatsNewItems')

    //find the followed person's whatsNew items and mark the following status as false, 
    //then decrement the noOfFollowedPersonUnReadWhatsNewItems
    //by one if that whatsItem's hasRead field is false as this is a doc that user need not read now
    async function markUnFollowedPersonWhatsNewItemsFollowingStatusToFalseAndDecrementNoOfUnReadItems() {
      await unFollowerWhatsNewColl
        .where('primaryProfileUid', '==', unFollowedUid)
        .get().then(
          async (unFollowedWhatsNewItems: DocumentSnapshot[]) => {
            //check if there are followedPerson's whatsNew items
            if (unFollowedWhatsNewItems !== null) {
              //loop through each item
              unFollowedWhatsNewItems.forEach(async unFollowedWhatsNewItem => {

                //update the following status to false
                await unFollowerWhatsNewColl.doc(unFollowedWhatsNewItem.data()?.id).update({
                  isFollowing: false
                })

                //if the whatsNewItem hasRead is false then decrement the noOfFollowedPersonUnReadWhatsNewItems
                if (unFollowedWhatsNewItem.data()?.hasRead === false) {
                  await noOfFollowedPersonUnReadWhatsNewItemsDoc.update({
                    noOfFollowedPersonUnReadWhatsNewItems: admin.firestore.FieldValue.increment(-1)
                  })
                }

              })
            } else {
              //print a message to console that no unFollowed Person whatsNewItems
              console.log('no unFollowed Person whatsNewItems available')
            }
          })
    }

    const promises = []
    //UnFollower needs to be deleted from the UnFollowed's followers sub collection
    const p = db.collection('Users').doc(unFollowedUid).collection('followers').doc(unFollowerUid).delete()
    promises.push(p)
    //save the async function as a promise
    const p1 = markUnFollowedPersonWhatsNewItemsFollowingStatusToFalseAndDecrementNoOfUnReadItems()
    promises.push(p1)
    //run all the promises
    return Promise.all(promises)

  })