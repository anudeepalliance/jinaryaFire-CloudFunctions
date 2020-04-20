import * as functions from 'firebase-functions'
const admin = require('firebase-admin')

//When a user updates his userDoc like name or UserName then this updated info needs to be
//reflected in the user's followees' followers sub coll of all the other users that he is following
export const addTheNewFollower = functions.region('asia-east2').firestore.document
  ('Users/{followerUserId}/following/{followeeUserId}').onCreate((data, context) => {

  const followeeUid = context.params.followeeUserId
  const followerUid = context.params.followerUserId

  //Follower user details that needs to be duplicated to the Followee's following Sub Coll
  admin.firestore().collection('Users').doc(followerUid).get().then((doc:{ exists: any; data: () => any }) => {

    let followerData = {
      name:  doc.data().name,
      uid: followerUid,
      userName: doc.data().userName
    }
        
    const followeeFollowersFollowerUidDoc = 
    admin.firestore().collection('Users').doc(followeeUid).collection('followers').doc(followerUid)
    return followeeFollowersFollowerUidDoc.set(followerData)
        
  })

})