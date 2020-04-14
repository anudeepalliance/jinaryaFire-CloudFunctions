import * as functions from 'firebase-functions'
const admin = require('firebase-admin')


export const onUserDocUpdate = functions.region('asia-east2').firestore.document
('Users/{userId}').onUpdate((change, context) => {
    const upDatedUserData = change.after.data()

    const newName = upDatedUserData?.name
    const profilePhotoChosen = upDatedUserData?.profilePhotoChosen
    const updatersUserId = upDatedUserData?.uid
    const newUserName = upDatedUserData?.userName

    // const userDoc = change.after.ref.parent
    const userFollowersCollection = admin.firestore()
    .collection('Users').doc(updatersUserId).collection('Followers')
    // const userFollowerCollection = userDoc.collection("Followers")


    return userFollowersCollection.get().then((querySnapshot: { documents: any }) => {
        const promises = querySnapshot.documents.map((doc: any) => {
            const followerUid = doc.uid
            return admin.firestore().collection('Users').doc(followerUid)
            .collection('FollowingPeople').doc(updatersUserId)
            .set({
                name: newName, 
                userName: newUserName,
                profilePhotoChosen: profilePhotoChosen,
                uid: updatersUserId
            })
        })
        return Promise.all(promises)
    })

})