import * as functions from 'firebase-functions'
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore'
const admin = require('firebase-admin')

//When a user updates his userDoc like name or UserName then this updated info needs to be
//reflected in the complimentlikes coll of all the compliments that he has liked
export const updateUserInfoAtTheComplimentLikes = functions.region('asia-east2').firestore.document
    ('Users/{userId}').onUpdate((change, context) => {

        const upDatedUserData = change.after.data()

        const newName = upDatedUserData?.name
        const newNameLowerCase = upDatedUserData?.nameLowerCase
        const updatersUserId = upDatedUserData?.uid
        const newUserName = upDatedUserData?.userName
        const newBio = upDatedUserData?.bio

        const userComplimentLikedUserDocs = admin.firestore().collectionGroup('complimentLikes').where('uid', '==', `${updatersUserId}`)

        return userComplimentLikedUserDocs.get().then(
            async (querySnapshot: DocumentSnapshot[]) => {
                await Promise.all(querySnapshot.map((doc) => {
                    //get a string representation of the documentPath and use that to update the doc
                    const complimentLikerDocPath = doc.ref.path
                    //get a DB reference to the userDoc at complimentLike
                    const userAtComplimentLike = admin.firestore().doc(complimentLikerDocPath)
                    return userAtComplimentLike.update({
                        name: newName,
                        nameLowerCase: newNameLowerCase,
                        userName: newUserName,
                        uid: updatersUserId,
                        bio: newBio
                    })

                })
                )

            })

    })