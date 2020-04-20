import * as functions from 'firebase-functions'
const admin = require('firebase-admin')

//When a user updates his userDoc like name or UserName then this updated info needs to be
//reflected in the user's followees' followers sub coll of all the other users that he is following
export const addTheNewFolloweFsTriggered = functions.region('asia-east2').firestore.document
('Users/{followerUserId}/following/{followeeUserId}').onCreate((data, context) => {

const followeeUid = context.params.followeeUserId
const followerUid = context.params.followerUserId
let followerName : string = ""
let followerUserName : string = ""

//Follower user details that needs to be duplicated to the Followee's following Sub Coll
admin.firestore().collection('Users').doc(followerUid).get().then((doc:{ exists: any; data: () => any }) => {

        followerName = doc.data().name
        followerUserName = doc.data().userName
})

let followerData = {
    name: followerName,
    uid: followerUid,
    userName: followerUserName
  };

const followeeFollowersFollowerUidDoc = admin.firestore().collection('Users').doc(followeeUid).collection('followers').doc(followerUid)

return followeeFollowersFollowerUidDoc.set(followerData)
   

})