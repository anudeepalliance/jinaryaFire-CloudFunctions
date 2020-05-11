import * as functions from 'firebase-functions'
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore'
const admin = require('firebase-admin')

//When a user updates his userDoc like name or UserName then this updated info needs to be
//reflected in the user's followees' followers sub coll of all the other users that he is following
export const updateUserInfoAtTheComplimentLikes = functions.region('asia-east2').firestore.document
('Users/{userId}').onUpdate((change, context) => {

const upDatedUserData = change.after.data()

const newName = upDatedUserData?.name
const newNameLowerCase = upDatedUserData?.nameLowerCase
const updatersUserId = upDatedUserData?.uid
const newUserName = upDatedUserData?.userName
const newprofilePhotoChosenBoolean = upDatedUserData?.profilePhotoChosen

const userComplimentLikedUserDocs = admin.firestore().collectionGroup('complimentLikes').where('uid', '==',`${updatersUserId}`)

return userComplimentLikedUserDocs.get().then((querySnapshot: { docs: DocumentSnapshot[] }) => {
    const promises = querySnapshot.docs.map((doc) => {
        //get a string representation of the documentPath and use that to update the doc
        const complimentLikerDocPath = doc.ref.path
        return admin.firestore().doc(complimentLikerDocPath).set({
            name: newName,
            nameLowerCase: newNameLowerCase,
            userName: newUserName,
            uid: updatersUserId,
            profilePhotoChosen : newprofilePhotoChosenBoolean
        })
    })
    return Promise.all(promises)
    })
    
})