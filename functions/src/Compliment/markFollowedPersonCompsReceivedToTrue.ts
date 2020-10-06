import * as functions from 'firebase-functions'
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore'
const admin = require('firebase-admin')

//When a user follows another user then set the compsReceived from the followed person
//following status field to true so that comp receiver has the updated comp received doc
export const markFollowedPersonCompsReceivedToTrue = functions.region('asia-east2').firestore.document
    ('Users/{userId}/following/{followedUid}').onCreate((data, context) => {

        //get blocker's and blocked's Uids for identification
        const followerUid = context.params.userId
        const followedUid = context.params.followedUid

        //Get all the compliment received documents from the followed user
        const followedPersonCompsReceivedDocs = admin.firestore().collection('Users').doc(followerUid).collection('complimentsReceived')
            .where('senderUid', '==', followedUid)

        async function markAllFollowingStatusToTrue() {
            await followedPersonCompsReceivedDocs.get().then(async ( compReceivedDocs: DocumentSnapshot[]) => {

                compReceivedDocs.forEach(async compReceivedDoc => {
                    const complimentId = compReceivedDoc.data()?.complimentId
                    await admin.firestore().collection('Users').doc(followerUid).collection('complimentsReceived')
                        .doc(complimentId).update({
                            followingStatus: true
                        })
                })
            })
        }

        return markAllFollowingStatusToTrue()

            
    })