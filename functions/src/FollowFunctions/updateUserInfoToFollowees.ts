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
const newprofilePhotoChosenBoolean = upDatedUserData?.profilePhotoChosen

const userFollowingColl = admin.firestore().collection('Users').doc(updatersUserId).collection('following')

return userFollowingColl.get().then((querySnapshot: { docs: DocumentSnapshot[] }) => {
    const promises = querySnapshot.docs.map((doc) => {
        //get the followee uid
        const followeeUid = doc.id
        //go to the follower Doc in the followee's followers sub collection
        return admin.firestore().collection('Users').doc(followeeUid).collection('followers')
        .doc(updatersUserId).update({
            name: newName, 
            userName: newUserName,
            uid: updatersUserId,
            profilePhotoChosen : newprofilePhotoChosenBoolean
        })
    })
    return Promise.all(promises)
    })
})