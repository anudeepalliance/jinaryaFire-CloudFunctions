import * as functions from 'firebase-functions'
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore'
const admin = require('firebase-admin')

//When a follower doc is added to the User's followers sub coll then
//increase noOfFollowers field by 1 the profileInfo doc
export const reactivateUser = functions.region('asia-south1').firestore.document
('UserFeedback/Reports/DeactivateAccountRequests/{deactivateRequestedUid}').onDelete((data, context) => {

    const db = admin.firestore()
    //get the uid of the user who made this request
    const reactivateUid = context.params.deactivateRequestedUid
    //get the deactivatedUser Doc Ref
    const deactivatedUserDocRef = db.collection('UserFeedback')
        .doc('Reports')
        .collection('DeactivatedUsers')
        .doc(reactivateUid)


    return reactivateTheUser()

    async function reactivateTheUser() {
        //get the deactivated user doc
        await deactivatedUserDocRef.get().then(async (deactivatedUserDoc: DocumentSnapshot) => {
            //create a user from the doc retrieved
            const userObject = {
                uid: deactivatedUserDoc.data()?.uid,
                userName: deactivatedUserDoc.data()?.userName,
                name: deactivatedUserDoc.data()?.name
            }
            //insert the user to the users Collection
            await db.collection('Users')
                .doc(deactivatedUserDoc.data()?.uid)
                .set(userObject)
            //delete the user doc from the Deactivated Users Collection
            await deactivatedUserDocRef.delete()
        })
    }

})