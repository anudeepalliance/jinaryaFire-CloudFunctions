// import * as functions from 'firebase-functions'
// const admin = require('firebase-admin')

// //When client followes a user by adding a Person to his Following Sub Collection,
// //A background firestore triggered function is called to add the follower Doc to the
// //Followee's Follower Sub Collection
// export const newFollowerGained = 
// functions.region('asia-east2').document('Users/{userId}/following/{followeeUid}')
// .onCreate((snap, context)) => {

// const followerUid = context.params.userId
// const followeeUid = context.params.followeeUid

//       return admin.firestore()
//       .collection('Users').doc(followeeUid).collection('followers').doc('followerUid')
//       .add({          
//         followers: admin.firestore.FieldValue.arrayUnion(followerUid)
//         name: snap.data().
//         }) 

//   })
  