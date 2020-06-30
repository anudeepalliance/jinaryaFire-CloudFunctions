import * as functions from 'firebase-functions'
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore'
const admin = require('firebase-admin')

//When a user updates his userDoc with name or UserName then this updated info needs to be
//reflected in all the compliments Sent Docs by this person, this will run only if name or userName was changed
export const updateTheUserDetailsAtCompsSent = functions.region('asia-east2').firestore.document
    ('Users/{userId}').onUpdate((change, context) => {

        const upDatedUserData = change.after.data()
        const oldUserData = change.before.data()
        const updaterUid = context.params.userId

        //The updated user details
        const newName: String = upDatedUserData?.name
        const newUserName: String = upDatedUserData?.userName

        //The old user details
        const oldName: String = oldUserData?.name
        const oldUserName: String = oldUserData?.userName

        //check if either userName or Name was changed as these are only fields that needs to be updated
        //at the compliments sent docs, not interested in bio field
        if (newName == oldName && newUserName == oldUserName) {
            console.log('The user did not update his userName or Name so returning from this function');
            return Promise
        } else {

            //get the comps sent by the updater
            const compsSentByUpdaterDocs = admin.firestore().collectionGroup('complimentsReceived')
                .where('senderUid', '==', `${updaterUid}`)

            return compsSentByUpdaterDocs.get().then(
                async (querySnapshot: { docs: DocumentSnapshot[] }) => {
                    await Promise.all(querySnapshot.docs.map((doc) => {
                        //get a string representation of the documentPath and use that to update the doc
                        const compsSentDocPath = doc.ref.path
                        //get a DB reference to the compsSent by the updater
                        const compSentByUpdater = admin.firestore().doc(compsSentDocPath)
                        return compSentByUpdater.update({
                            senderName: newName,
                            senderUserName: newUserName,
                        })

                    })
                    )

                })
        }

    })