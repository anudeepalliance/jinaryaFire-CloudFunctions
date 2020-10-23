import * as functions from 'firebase-functions'
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore'
const admin = require('firebase-admin')

//When a user updates his userDoc like name or UserName then this updated info needs to be
//reflected in the complimentSentNumbers coll of all users who have sent this person a compliment
export const updateUserInfoAtComplimentsSentNumbers = functions.region('asia-south1').firestore.document
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

            const userComplimentsSentNumbersDocs = admin.firestore().collectionGroup('complimentsSentNumbers')
                .where('uid', '==', `${updatersUserId}`)

            async function updateUserDetails() {
                await userComplimentsSentNumbersDocs.get().then(async (userDocs: DocumentSnapshot[]) => {
                    userDocs.forEach(async userDoc => {
                        const userDocPath = userDoc.ref.path
                        await admin.firestore().doc(userDocPath).update({
                            name: newName,
                            nameLowerCase: newNameLowerCase,
                            userName: newUserName,
                        })
                    })

                })
            }


            return updateUserDetails()

        }

    })