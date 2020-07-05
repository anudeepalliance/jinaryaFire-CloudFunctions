import * as functions from 'firebase-functions'
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore'
const admin = require('firebase-admin')

//When a user UnFollows another user then set the compsReceived from the UnFollowed person
//following status field to false so that comp receiver has the updated comp received doc
export const markTheUnFollowedCompsReceivedToFalse = functions.region('asia-east2').firestore.document
    ('Users/{userId}/following/{followedUid}').onDelete((data, context) => {

        //get blocker's and blocked's Uids for identification
        const unFollowerUid = context.params.userId
        const unFollowedUid = context.params.followedUid

        //Get all the compliment received documents from the unFollowed user
        const unFollowedPersonCompsReceivedDocs = admin.firestore().collection('Users').doc(unFollowerUid).collection('complimentsReceived')
            .where('senderUid', '==', unFollowedUid)

        return unFollowedPersonCompsReceivedDocs.get().then(
            async (querySnapshot: DocumentSnapshot[]) => {
                await Promise.all(querySnapshot.map((doc) => {
                    //get a reference to the document
                    const complimentDocRef = doc.ref
                    return complimentDocRef.update({
                        followingStatus: false
                    })
                })
                )
            })
    })