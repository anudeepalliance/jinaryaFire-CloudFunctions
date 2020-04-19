import * as functions from 'firebase-functions'
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore'
const admin = require('firebase-admin')


export const onUserDocUpdate = functions.region('asia-east2').firestore.document
('Users/{userId}').onUpdate((change, context) => {

const upDatedUserData = change.after.data()

const newName = upDatedUserData?.name
const profilePhotoChosen = upDatedUserData?.profilePhotoChosen
const updatersUserId = upDatedUserData?.uid
const newUserName = upDatedUserData?.userName

// const userDoc = change.after.ref.parent
const followerColl = admin.firestore().collection('Users').doc(updatersUserId).collection('following')

//This is where I am stuck, I have the updated document info but how do
//I find the other documents at firestore that needs updation with this 
//updated information of the user

return followerColl.get().then((querySnapshot: { docs: DocumentSnapshot[] }) => {
    const promises = querySnapshot.docs.map((doc) => {
        const followerUid = doc.id
        return admin.firestore().collection('Users').doc(followerUid).collection('followers')
        .doc(updatersUserId).set({
            name: newName, 
            userName: newUserName,
            profilePhotoChosen: profilePhotoChosen,
            uid: updatersUserId
        })
    })
    return Promise.all(promises)
    })
})





//     return admin.firestore()
//     .collection('Users').doc('{followeeUserId}')
//     .collection('Followers').doc(updatersUserId)
//     .set({
//     name: newName, 
//     userName: newUserName,
//     profilePhotoChosen: profilePhotoChosen,
//     uid: updatersUserId
//   })