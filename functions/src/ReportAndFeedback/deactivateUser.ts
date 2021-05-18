import * as functions from 'firebase-functions'
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore'
const admin = require('firebase-admin')

//When a follower doc is added to the User's followers sub coll then
//increase noOfFollowers field by 1 the profileInfo doc
export const deactivateUser = functions.region('asia-south1').firestore.document
    ('UserFeedback/Reports/DeactivateAccountRequests/{deactivateRequestedUid}').onCreate((data, context) => {

        //get the uid of the user who made this request
        const deactivateRequestUid = context.params.deactivateRequestedUid
        const db = admin.firestore()
        const userDocAtUsersColl = db.collection('Users').doc(deactivateRequestUid)

        return deactiveTheUser()

        async function deactiveTheUser() {
            //get the user doc
            await userDocAtUsersColl.get().then(async (userDoc: DocumentSnapshot) => {
                //create a deactivate user from the user retrieved
                const deactivateUserObject = {
                    uid: userDoc.data()?.uid,
                    userName: userDoc.data()?.userName,
                    name: userDoc.data()?.name
                }
                //insert the user to the deactivatedUsers Collection
                await db.collection('UserFeedback')
                    .doc('Reports')
                    .collection('DeactivatedUsers')
                    .doc(deactivateUserObject.uid)
                    .set(deactivateUserObject)
                //delete the user doc from the Users Collection
                await userDocAtUsersColl.delete()
            })
        }

    })