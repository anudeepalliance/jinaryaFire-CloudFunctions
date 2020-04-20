import * as functions from 'firebase-functions'
const admin = require('firebase-admin')

//When client un-follows a user, it calls a background FS triggered function to remove follower(the client)
//from the unfollowee's followers sub collection
export const removeUserAsTheFollower = functions.region('asia-east2').firestore.document
  ('Users/{unFollowerUserId}/following/{unFolloweeUserId}').onDelete((data, context) => {

  const unFollowerUserId = context.params.unFollowerUserId
  const unFolloweeUserId = context.params.unFolloweeUserId

  //UnFollower user needs to be deleted from the UnFollowee's followers sub collection
  return admin.firestore()
  .collection('Users').doc(unFolloweeUserId).collection('followers').doc(unFollowerUserId)
  .delete()
        
})