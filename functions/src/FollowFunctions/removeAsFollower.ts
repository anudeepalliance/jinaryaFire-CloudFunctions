import * as functions from 'firebase-functions'
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore'
const admin = require('firebase-admin')
const utilityFunctions = require('frequentFunctions')

//When a client does not want a person to follow him then call this fun 
//1. Remove the person as a follower to the user
//2. Remove the user as a FollowedPerson at the Follower

export const removeAsFollower = functions.region('asia-south1').https.onCall((removeAsFollowerData, context) => {

    //check if request came from an authenticated user
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'only authenticated users can block'
        )
    }

    const db = admin.firestore()

    //get follower and followee Uids for identification
    const followerUid = removeAsFollowerData.uid
    const followedUid = context.auth.uid

    return removeTheFollowedAndFollowerDocs()


    async function removeTheFollowedAndFollowerDocs() {

        //remove the follower doc from the followed person follower sub coll
        await db.collection('Users').doc(followedUid).collection('followers')
            .doc(followerUid).delete()

        //remove the following doc from the follower person following sub coll
        await db.collection('Users').doc(followerUid).collection('following')
            .doc(followedUid).delete()

    }


})