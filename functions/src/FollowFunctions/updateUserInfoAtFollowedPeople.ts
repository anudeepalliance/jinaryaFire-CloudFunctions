import * as functions from 'firebase-functions'
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore'
const admin = require('firebase-admin')

//When a user updates his userDoc like name or UserName then this updated info needs to be
//reflected in the user's followeds' followers sub coll of all the other users that he is following
export const updateUserInfoAtTheFollowedPeople = functions.region('asia-east2').firestore.document
    ('Users/{userId}').onUpdate((change, context) => {

        const upDatedUserData = change.after.data()

        const newName = upDatedUserData?.name
        const newNameLowerCase = upDatedUserData?.nameLowerCase
        const updatersUserId = upDatedUserData?.uid
        const newUserName = upDatedUserData?.userName
        const newBio = upDatedUserData?.bio
        const newInsightsAdded = upDatedUserData?.insightsAdded

        const updaterFollowingColl = admin.firestore().collection('Users').doc(updatersUserId).collection('following')

        return updaterFollowingColl.get().then((querySnapshot: { docs: DocumentSnapshot[] }) => {
            querySnapshot.docs.map((doc) => {
                //get the followed uid
                const followedUid = doc.id
                //go to the follower Doc in the followed's followers sub collection
                const updatersDocAtFollowed = admin.firestore().collection('Users').doc(followedUid).collection('followers')
                    .doc(updatersUserId)
                return updatersDocAtFollowed.update({
                    name: newName,
                    nameLowerCase: newNameLowerCase,
                    uid: updatersUserId,
                    userName: newUserName,
                    bio: newBio,
                    insightsAdded: newInsightsAdded
                })
            })

        })
    })