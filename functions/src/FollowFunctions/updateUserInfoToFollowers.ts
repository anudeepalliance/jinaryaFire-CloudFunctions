import * as functions from 'firebase-functions'
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore'
const admin = require('firebase-admin')

//When a user updates his userDoc like name or UserName then this updated info needs to be
//reflected in the user's followers' following doc of all the other users that are a follower of this user 
export const updateUserInfoToTheFollowers = functions.region('asia-east2').firestore.document
    ('Users/{userId}').onUpdate((change, context) => {

        const upDatedUserData = change.after.data()

        const newName = upDatedUserData?.name
        const newLowerCaseName = upDatedUserData?.nameLowerCase
        const updatersUserId = upDatedUserData?.uid
        const newUserName = upDatedUserData?.userName
        const newBio = upDatedUserData?.bio
        const newInsightsAdded = upDatedUserData?.insightsAdded

        const userFollowersColl = admin.firestore().collection('Users').doc(updatersUserId).collection('followers')

        return userFollowersColl.get().then((querySnapshot: { docs: DocumentSnapshot[] }) => {
            querySnapshot.docs.map((doc) => {
                //get the followerUid
                const followerUid = doc.id
                //go to the following Doc in the follower's following sub collection
                const updatersDocAtFollower = admin.firestore().collection('Users').doc(followerUid).collection('following')
                    .doc(updatersUserId)
                return updatersDocAtFollower.update({
                    name: newName,
                    nameLowerCase: newLowerCaseName,
                    uid: updatersUserId,
                    userName: newUserName,
                    bio: newBio,
                    insightsAdded: newInsightsAdded
                })
            })

        })
    })