import * as functions from 'firebase-functions'
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore'
const admin = require('firebase-admin')
const utilityFunctions = require('frequentFunctions')

//When client followes a user, a firestore .onCreate() background function is triggered to 
//1.Check if the follower is blocked by the followed
//2.If yes then thrown an error
//3.If not then check if followed is autoAccepting Followers
//4.If Yes then add the follower doc to the followed's followes sub coll
//and add Followed to Following sub coll of follower
//5.If Not then create and add follow request in the followed's follow requests sub coll
export const addNewFollower = functions.region('asia-south1').https.onCall((followedPersonData, context) => {

  //check if request came from an authenticated user
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'only authenticated users can block'
    )
  }

  const db = admin.firestore()
  //get follower and followee Uids for identification
  const followedUid = followedPersonData.uid
  const followedName = followedPersonData.name
  const followedUserName = followedPersonData.userName
  //for identification and notification payload data (Intent Extras for client)
  const followerUid = context.auth.uid

  return addFollowerOrMakeFollowRequest()

  async function addFollowerOrMakeFollowRequest() {


    //get the autoAcceptFollowers variable of the followed
    await db.collection('Users').doc(followedUid).collection('autoAcceptFollowers')
      .doc(followedUid).get().then(async (autoAcceptFollowers: DocumentSnapshot) => {

        //continue with the follow logic since followed is auto accepting followers
        if (autoAcceptFollowers.exists && autoAcceptFollowers.data()?.autoAcceptFollowers === true) {

          console.log(`user is auto accepting followers, add the follower`)


          // Check if follower is blocked by the followed, if yes then throw an error
          await db.collection('Users').doc(followedUid).collection('blocked')
            .doc(followerUid).get().then(async (blockedFollower: DocumentSnapshot) => {
              //check if blockedFollower person exists and also check if currently blocked status is true
              if (blockedFollower.exists && blockedFollower.data()?.currentlyBlocked === true) {
                //print a message to console that follower was not added
                throw new functions.https.HttpsError(
                  'unauthenticated',
                  'cannot add follower, follower is blocked by followed'
                )
              }

              //Find out if Followed is following the Follower already
              await db.collection('Users').doc(followedUid).collection('following')
                .doc(followerUid).get().then(async (followerPerson: DocumentSnapshot) => {

                  //Get Follower user details that needs to be duplicated to the Followed's follower Sub Coll
                  //And also added to the notification Payload data
                  await db.collection('Users').doc(followerUid).get().then(async (followerUserDoc: DocumentSnapshot) => {

                    //The FollowerPerson object which will be pushed to the followers sub collection of followed
                    const followerData = {
                      followerUid: followerUid,
                      name: followerUserDoc.data()!.name,
                      userName: followerUserDoc.data()!.userName,
                      followedYouAt: Date.now(),
                      followingBack: followerPerson.exists,
                      followedUid: followedUid,  
                    }

                    const followedPerson = {
                      followedUid: followedUid,
                      name: followedName,
                      userName: followedUserName,
                      noOfComplimentsSent: 0,
                      interestMeter: Date.now(),
                      randomId: utilityFunctions.randomId(),
                      followerUid: followerUid
                    }

                    //Add the follower to the followee sub-collection
                    await db.collection('Users').doc(followedUid).collection('followers').doc(followerUid).set(followerData)
                    //Add the followed to the following sub-collection of the follower
                    await db.collection('Users').doc(followerUid).collection('following').doc(followedUid).set(followedPerson)

                  })

                })

            })
        }         
        //followed not auto accepting followers, create a follow request and add it to firestore
        else {
          console.log(`user is not auto accepting followers, make a follow request`)
          const followRequest = {
            followRequestedUid: followedUid,
            followerUid: followerUid
          }
        
           
          //Add the followRequestedUid to the followRequests sub-collection of the followed
          await db.collection('Users').doc(followedUid).collection('followRequests').doc(followerUid).set(followRequest)

        }

      })
  }

})