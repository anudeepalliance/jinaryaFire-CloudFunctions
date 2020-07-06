import * as functions from 'firebase-functions'
const admin = require('firebase-admin')

//When client un-follows a user, it calls a background FS triggered function to remove the client
//from the unfollowed's followers sub collection
export const removeUserAsTheFollower = functions.region('asia-east2').firestore.document
  ('Users/{unFollowerUserId}/following/{unFollowedUserId}').onDelete((data, context) => {

    const unFollowerUserId = context.params.unFollowerUserId
    const unFollowedUserId = context.params.unFollowedUserId

    //UnFollower needs to be deleted from the UnFollowed's followers sub collection
    const p = admin.firestore()
      .collection('Users').doc(unFollowedUserId).collection('followers').doc(unFollowerUserId).delete()
    //run all the promises
    return Promise.all(p)

  })