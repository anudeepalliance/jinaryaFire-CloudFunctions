import * as functions from 'firebase-functions'
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore'
const admin = require('firebase-admin')


export const updateUserInfoToTheFollowers = functions.region('asia-east2').firestore.document
('Users/{userId}').onUpdate((change, context) => {

const upDatedUserData = change.after.data()

const newName = upDatedUserData?.name
const updatersUserId = upDatedUserData?.uid
const newUserName = upDatedUserData?.userName

const userFollowersColl = admin.firestore().collection('Users').doc(updatersUserId).collection('followers')

return userFollowersColl.get().then((querySnapshot: { docs: DocumentSnapshot[] }) => {
    const promises = querySnapshot.docs.map((doc) => {
        const followerUid = doc.id
        return admin.firestore().collection('Users').doc(followerUid).collection('following')
        .doc(updatersUserId).set({
            name: newName, 
            userName: newUserName,
            uid: updatersUserId
        })
    })
    return Promise.all(promises)
    })
})