import * as functions from 'firebase-functions'
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore'
const admin = require('firebase-admin')

//When a user updates his userDoc like name or UserName then this updated info needs to be
//reflected in the user's followeds' followers sub coll of all the other users that he is following
export const updateUserInfoAtFollowedPeople = functions.region('asia-east2').firestore.document
    ('Users/{userId}').onUpdate((change, context) => {

        const upDatedUserData = change.after.data()
        const oldUserData = change.before.data()

        //The old user details
        const oldName: String = oldUserData?.name
        const oldUserName: String = oldUserData?.userName

        const newName = upDatedUserData?.name
        const newNameLowerCase = upDatedUserData?.nameLowerCase
        const updatersUserId = upDatedUserData?.uid
        const newUserName = upDatedUserData?.userName

        //check if either userName or Name was changed as these are only fields that needs to be updated
        //at the compliments sent docs, not interested in insightsAdded field
        if (newName === oldName && newUserName === oldUserName) {
            console.log('The user did not update his userName or Name so returning from this function');
            return Promise
        } else {

            const updaterFollowingColl = admin.firestore().collection('Users').doc(updatersUserId).collection('following')

            async function updateUserDetails() {
                await updaterFollowingColl.get().then(async (followedUserDocs: DocumentSnapshot[]) => {

                    followedUserDocs.forEach(async followedUserDoc => {
                        const followedUid = followedUserDoc.data()?.uid
                        await admin.firestore().collection('Users').doc(followedUid).collection('followers').doc(updatersUserId).update({
                            name: newName,
                            nameLowerCase: newNameLowerCase,
                            userName: newUserName
                        })
                    })
                })
            }

            return updateUserDetails()
        }
    })