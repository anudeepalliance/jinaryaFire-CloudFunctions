import * as functions from 'firebase-functions'
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore'
const admin = require('firebase-admin')
const utilityFunctions = require('frequentFunctions')

//When a followed accepts a followRequest, a Ktor fun is called to replicated at MDB
//The same has to be replicated at Firestore
//1. check for the follow request
//2. add the follower to the followed ( mimic the same changes as in addNewFollower)
//3. delete the follow request
export const acceptFollowRequest = functions.region('asia-south1').https.onCall((acceptFollowRequestData, context) => {

    //check if request came from an authenticated user
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'only authenticated users can block'
        )
    }

    const db = admin.firestore()
    //get follower details
    const followerUid = acceptFollowRequestData.followerUid
    const followerName = acceptFollowRequestData.followerName
    const followerUserName = acceptFollowRequestData.followerUserName
    //get followed details
    const followedUid = context.auth.uid
    const followedName = acceptFollowRequestData.followedName
    const followedUserName = acceptFollowRequestData.followedUserName


    return addFollowerOrMakeFollowRequest()

    async function addFollowerOrMakeFollowRequest() {

        //get the follow request
        await db.collection('Users').doc(followedUid).collection('followRequests')
            .doc(followerUid).get().then(async (followRequest: DocumentSnapshot) => {

                //check if the follow request exists
                if (followRequest.exists) {

                    const followRequestFollowerUid = followRequest.data()!.followerUid

                    //create a followed person from the http request data
                    const followedPerson = {
                        followedUid: followedUid,
                        name: followedName,
                        userName: followedUserName,
                        noOfComplimentsSent: 0,
                        interestMeter: Date.now(),
                        randomId: utilityFunctions.randomId(),
                        followerUid: followRequestFollowerUid
                    }

                    //add the followed to the following sub coll of the follower
                    await db.collection('Users').doc(followRequestFollowerUid).collection('following').doc(followedUid).set(followedPerson)


                    //Find out if Followed is following the Follower already
                    await db.collection('Users').doc(followedUid).collection('following')
                        .doc(followRequestFollowerUid).get().then(async (followerPerson: DocumentSnapshot) => {

                            //create a follower person from the http request data
                            const followerData = {
                                name: followerName,
                                nameLowerCase: followerName.toLowerCase().toString(),
                                userName: followerUserName,
                                uid: followRequestFollowerUid,
                                followedYouAt: Date.now(),
                                //is the followed following back the follower,
                                followingBack: followerPerson.exists,
                            }

                            //add the follower to the followers sub coll of the followed
                            await db.collection('Users').doc(followedUid).collection('followers').doc(followRequestFollowerUid).set(followerData)
                        })

                    //delete the follow request since its accepted now
                    await db.collection('Users').doc(followedUid).collection('followRequests')
                        .doc(followRequestFollowerUid).delete()

                }
                //follow request does not exist, throw an error
                else {
                    throw new functions.https.HttpsError(
                        'unauthenticated',
                        'follow request does not exist'
                    )
                }

            })

    }

})