import * as functions from 'firebase-functions'
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore'
const admin = require('firebase-admin')

//When a user updates his userDoc like name or UserName then this updated info needs to be
//reflected in the user's followees' followers sub coll of all the other users that he is following
export const updateUserInfoToTheFollowees = functions.region('asia-east2').firestore.document
('Users/{userId}').onUpdate((change, context) => {

const upDatedUserData = change.after.data()

const newName = upDatedUserData?.name
const updatersUserId = upDatedUserData?.uid
const newUserName = upDatedUserData?.userName

const userFollowingColl = admin.firestore().collection('Users').doc(updatersUserId).collection('following')

return userFollowingColl.get().then((querySnapshot: { docs: DocumentSnapshot[] }) => {
    const promises = querySnapshot.docs.map((doc) => {
        const followeeUid = doc.id
        return admin.firestore().collection('Users').doc(followeeUid).collection('followers')
        .doc(updatersUserId).set({
            name: newName, 
            userName: newUserName,
            uid: updatersUserId
        })
    })
    return Promise.all(promises)
    })
})