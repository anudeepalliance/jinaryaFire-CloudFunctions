import * as functions from 'firebase-functions'
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore'
const admin = require('firebase-admin')

//When a user follows another user then set the compsReceived from the followed person
//following status field to true so that comp receiver has the updated comp received doc
export const markTheFollowedPersonCompsReceivedToTrue = functions.region('asia-east2').firestore.document
    ('Users/{userId}/following/{followedUid}').onCreate((data, context) => {

        //get blocker's and blocked's Uids for identification
        const followerUid = context.params.userId
        const followedUid = context.params.followedUid

        //Get all the compliment received documents from the followed user
        const followedPersonCompsReceivedDocs = admin.firestore().collection('Users').doc(followerUid).collection('complimentsReceived')
            .where('senderUid', '==', followedUid)

        return followedPersonCompsReceivedDocs.get().then(
            async (querySnapshot: DocumentSnapshot[] ) => {
                await Promise.all(querySnapshot.map((doc) => {
                    //get a reference to the document
                    const complimentDocRef = doc.ref
                    return complimentDocRef.update({
                        followingStatus: true
                    })
                })
                )
            })
    })