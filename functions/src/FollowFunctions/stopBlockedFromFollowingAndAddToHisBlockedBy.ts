import * as functions from 'firebase-functions'
const admin = require('firebase-admin')

//When client blocks a person, Firestore triggers a background function to 
//1. remove blocker(himself) from the blocked person's following sub collection
//2. adds blocker to the blockedBy sub coll of the blocked
//3. removes blocked as a follower of the blocked
//4. remove blockeds whatsNewItems from the blockers WhatsNewSubColl
export const stopBlockedFromFollowingAndAddToTheHisBlockedBy = functions.region('asia-east2').firestore.document
  ('Users/{blockerUid}/blocked/{blockedUid}').onCreate(async (blockedData, context) => {

    const db = admin.firestore()
    const blockedUid = context.params.blockedUid
    const blockerUid = context.params.blockerUid


    // async function removeBlockedsWhatsNewItemsFromBlockersWhatsNewColl() {
    //   db.collection('Users').doc(blockerUid).collection('whatsNew')
    //     .where('primaryProfileUid', '==', blockedUid)
    //     .get().then(
    //       async (blockedPersonWhatsNewDocs: DocumentSnapshot[]) => {
    //         blockedPersonWhatsNewDocs.forEach(blockedPersonWhatsNewDoc => {
    //           return db.collection('Users').doc(blockerUid).collection('whatsNew')
    //             .doc(blockedPersonWhatsNewDoc.id).delete()
    //         })

    //       })
    // }

    const promises = []
    //Add Blocker to Blocked by Sub Collection of the Blocked
    //User need not know whom all he has been blocked by hence just the Uid is added for
    //Checking purposes in perope recycler views
    const p = db.collection('Users').doc(blockedUid).collection('blockedBy').doc(blockerUid).set({
      uid: blockerUid
    })
    promises.push(p)

    //Check if the blocked person is following the blocker, 
    const blockedFollowingDocRef = db.collection('Users').doc(blockedUid).collection('following').doc(blockerUid)
    const blockedFollowingDoc = await blockedFollowingDocRef.get()
    //if yes then stop following and reduce the noOfFollowing at blocked
    if (blockedFollowingDoc.exists) {
      //Stop the Blocked from following the Blocker
      const p1 = db.collection('Users').doc(blockedUid).collection('following').doc(blockerUid).delete()
      promises.push(p1)
      //Blocked has stopped following a user so reduce the noOfFollowing count in his ProfileInfo Doc
      const p2 = db.collection('Users').doc(blockedUid).collection('ProfileInfo').doc(blockedUid).update({
        noOfFollowing: admin.firestore.FieldValue.increment(-1)
      })
      promises.push(p2)
    }
    //Add the delete blockedPerson's whatsNewDocs async function as a promise
    // const p3 = removeBlockedsWhatsNewItemsFromBlockersWhatsNewColl()
    // promises.push(p3)
    
    //run all the promises
    return Promise.all(promises)

  })