import * as functions from 'firebase-functions'
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore'
const admin = require('firebase-admin')

//When a user updates his userDoc like name or UserName then this updated info needs to be
//reflected in the user's followers' following doc of all the other users that are a follower of this user 
//which includes the insightsAdded variable as well if updated
export const updateUserInfoToFollowers = functions.region('asia-south1').firestore.document
    ('Users/{userId}').onUpdate((change, context) => {

        const upDatedUserData = change.after.data()

        const newName = upDatedUserData?.name
        const newLowerCaseName = upDatedUserData?.nameLowerCase
        const updatersUserId = upDatedUserData?.uid
        const newUserName = upDatedUserData?.userName
        const newInsightsAdded = upDatedUserData?.insightsAdded

        const userFollowersColl = admin.firestore().collection('Users').doc(updatersUserId).collection('followers')

        async function updateUserDetails() {
            await userFollowersColl.get().then(async (followerUserDocs: DocumentSnapshot[]) => {

                followerUserDocs.forEach(async followerUserDoc => {
                    const followedUid = followerUserDoc.data()?.uid
                    await admin.firestore().collection('Users').doc(followedUid).collection('following').doc(updatersUserId).update({
                        name: newName,
                        nameLowerCase: newLowerCaseName,
                        userName: newUserName,
                        insightsAdded: newInsightsAdded
                    })
                })
            })
        }

        return updateUserDetails()

    })