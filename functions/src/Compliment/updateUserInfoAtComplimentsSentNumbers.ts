import * as functions from 'firebase-functions'
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore'
const admin = require('firebase-admin')

//When a user updates his userDoc like name or UserName then this updated info needs to be
//reflected in the complimentSentNumbers coll of all users who have sent this person a compliment
export const updateUserInfoAtTheComplimentsSentNumbers = functions.region('asia-east2').firestore.document
    ('Users/{userId}').onUpdate((change, context) => {

        const upDatedUserData = change.after.data()

        const newName = upDatedUserData?.name
        const newNameLowerCase = upDatedUserData?.nameLowerCase
        const updatersUserId = upDatedUserData?.uid
        const newUserName = upDatedUserData?.userName
        const newBio = upDatedUserData?.bio
        const newInsightsAdded = upDatedUserData?.insightsAdded

        const userComplimentsSentNumbersDocs = admin.firestore().collectionGroup('complimentsSentNumbers').where('uid', '==', `${updatersUserId}`)

        return userComplimentsSentNumbersDocs.get().then(
            async (querySnapshot: { docs: DocumentSnapshot[] }) => {
                await Promise.all(querySnapshot.docs.map((doc) => {
                    //get a string representation of the documentPath and use that to update the doc
                    const complimentsSentNumbersDocPath = doc.ref.path
                    //get a DB representation of the documentPath and use that to update the doc
                    const userAtCompSentNumbers = admin.firestore().doc(complimentsSentNumbersDocPath)
                    return userAtCompSentNumbers.update({
                        name: newName,
                        nameLowerCase: newNameLowerCase,
                        userName: newUserName,
                        bio: newBio,
                        insightsAdded: newInsightsAdded
                    })
                })
                )
            })
    })