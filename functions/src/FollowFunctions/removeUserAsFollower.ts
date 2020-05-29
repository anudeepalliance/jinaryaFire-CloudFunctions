import * as functions from 'firebase-functions'
const admin = require('firebase-admin')

//When client un-follows a user, it calls a background FS triggered function to remove follower(the client)
//from the unfollowed's followers sub collection
export const removeUserAsTheFollower = functions.region('asia-east2').firestore.document
  ('Users/{unFollowerUserId}/following/{unFolloweeUserId}').onDelete((data, context) => {

  const unFollowerUserId = context.params.unFollowerUserId
  const unFollowedUserId = context.params.unFolloweeUserId


  const promises = []
  //UnFollower user needs to be deleted from the UnFollowed's followers sub collection
  const p =  admin.firestore()
  .collection('Users').doc(unFollowedUserId).collection('followers').doc(unFollowerUserId).delete()
  promises.push(p)
  //UnFollowed lost a follower so reduce the number of followers at his ProfileInfo Doc
  const p1 = admin.firestore().collection('Users').doc(unFollowedUserId).collection('ProfileInfo').doc(unFollowedUserId).update({
    noOfFollowers : admin.firestore.FieldValue.increment(-1)
  })
  promises.push(p1)
  //run all the promises
  return Promise.all(promises)

})