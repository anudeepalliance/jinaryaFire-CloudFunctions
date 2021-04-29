import * as functions from 'firebase-functions'
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore'
const admin = require('firebase-admin')
const utilityFunctions = require('frequentFunctions')

//When a followed cancels a followRequest, a Ktor fun is called to replicated at MDB
//The same has to be replicated at Firestore
//1. delete the exisiting follow request made by users to the followed

export const cancelFollowRequest = functions.region('asia-south1').https.onCall((cancelFollowRequestData, context) => {

        //check if request came from an authenticated user
        if (!context.auth) {
            throw new functions.https.HttpsError(
                'unauthenticated',
                'only authenticated users can block'
            )
        }

        const db = admin.firestore()
        const followerUid = context.auth.uid
        const followedUid = cancelFollowRequestData.uid
        
        return deleteExisitingFollowRequest()

        async function deleteExisitingFollowRequest() {
            await db.collection('Users').doc(followedUid).collection('followRequests')
            .doc(followerUid).delete()
        }
})