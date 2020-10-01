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

        const userComplimentsSentNumbersDocs = admin.firestore().collectionGroup('complimentsSentNumbers')
            .where('uid', '==', `${updatersUserId}`)

        async function updateUserDetails() {
            await userComplimentsSentNumbersDocs.get().then(async (userDocs: DocumentSnapshot[]) => {
                userDocs.forEach(async userDoc => {
                    const userDocPath = userDoc.ref.path
                    await admin.firestire().doc(userDocPath).update({
                        name: newName,
                        nameLowerCase: newNameLowerCase,
                        userName: newUserName,
                        bio: newBio,
                        insightsAdded: newInsightsAdded
                    })
                })

            })
        }
        

        return updateUserDetails()
    
    })