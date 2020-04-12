// exports.newFollowerGained1 = functions.region('asia-east2').firestore
// .document('Users/{userId}/FollowingPeople/{FolloweePersonUid}')
// .onCreate((snap, context) => {

//     //Need followee's uid to decide which user's followers sub-collection to update
//     const followeePersonUid = context.params.FolloweePersonUid
    
//     //get the follower details
//     const followerPersonUid = context.params.userId
//     const followerPersonName = context.params.name
//     // const followerPersonProfilePhotoChosen = context.params.profilePhotoChosen
//     // const followerPersonUserName = context.params.userName
  

//     return admin.firestore()
//     .collection('Users').doc(`${followeePersonUid}`)
//     .collection('Followers').doc(`${followerPersonUid}`)
//     .set( {
//       name: followerPersonName,
//       userName: "followerPersonUserName",
//       profilePhotoChosen: "followerPersonProfilePhotoChosen",
//       uid: followerPersonUid
//     })

//       // const followerName = snap.data().age
      
//       // const followerUserName = newValue.userName
//       // const followerUid = personUid
//       // const followerProfilePhotoChosen = newValue.profilePhotoChosen

//       // // access a particular field as you would any JS property
//       // const name = newValue.name;

//       // perform desired operations ...
//     })