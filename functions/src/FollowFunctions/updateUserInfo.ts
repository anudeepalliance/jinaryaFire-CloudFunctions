import * as functions from 'firebase-functions'
const admin = require('firebase-admin')


export const onUserDocUpdate = functions.region('asia-east2').firestore.document
('Users/{userId}').onUpdate((change, context) => {

    const upDatedUserData = change.after.data()

const newName = upDatedUserData?.name
const profilePhotoChosen = upDatedUserData?.profilePhotoChosen
const updatersUserId = upDatedUserData?.uid
const newUserName = upDatedUserData?.userName

const userDoc = change.after.ref.parent
const followerColl = admin.firestore().collection('Users').document(userDoc).collection("followers")

//This is where I am stuck, I have the updated document info but how do
//I find the other documents at firestore that needs updation with this 
//updated information of the user

return followerColl.get().then(((querySnapshot: { documents: any[] }) => {
    const promises = querySnapshot.documents.map((doc) => {
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
    }))
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

})