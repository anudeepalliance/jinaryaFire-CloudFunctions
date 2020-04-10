// Just import the functions from other files
import * as functions from 'firebase-functions'
const admin = require('firebase-admin')
admin.initializeApp()

//export the functions in other files, callable https functions 
//dont work if they are in other files hence they are declared in this file
export { newUserSignUp } from './userCreated'
export { userDeleted } from './userDeleted'
// export { newFollowerGained1 } from './newFollowerGained'

exports.newFollowerGained1 = functions.region('asia-east2').firestore
.document('Users/{userId}/FollowingPeople/{FolloweePersonUid}')
.onCreate((snap, context) => {

    //Need followee's uid to decide which user's followers sub-collection to update
    const followeePersonUid = context.params.FolloweePersonUid
    
    //get the follower details
    const followerPersonUid = context.params.userId
    const followerPersonName = context.params.name
    // const followerPersonProfilePhotoChosen = context.params.profilePhotoChosen
    // const followerPersonUserName = context.params.userName
  

    return admin.firestore()
    .collection('Users').doc(`${followeePersonUid}`)
    .collection('Followers').doc(`${followerPersonUid}`)
    .set( {
      name: followerPersonName,
      userName: "followerPersonUserName",
      profilePhotoChosen: "followerPersonProfilePhotoChosen",
      uid: followerPersonUid
    })

      // const followerName = snap.data().age
      
      // const followerUserName = newValue.userName
      // const followerUid = personUid
      // const followerProfilePhotoChosen = newValue.profilePhotoChosen

      // // access a particular field as you would any JS property
      // const name = newValue.name;

      // perform desired operations ...
    })


//(1)-----------------------------------------------------------------------------------------------------------------------------------
//Send Feedback Function: This  takes in user feedback and adds to a Firestore database as an admin
exports.sendFeedback = functions.region('asia-east2').https.onCall((data, context) => {
    
    if (!context.auth) {
        throw new functions.https.HttpsError(
          'unauthenticated', 
          'only authenticated users can add requests'
        );
      }

      if (data.text.length > 30) {
        throw new functions.https.HttpsError(
          'invalid-argument', 
          'request must be no more than 30 characters long'
        );
      }

      return admin.firestore().collection('Feedback').add({
        feedback: data.text,
        uid: context.auth.uid,
        date : data.date,
        no_of_items : data.no_of_items,
        no_of_compliments_sent : data.no_of_compliments_sent,
        no_of_insights_added : data.no_of_insights_added,
        no_of_followers : data.no_of_followers,
        no_of_following : data.no_of_following
      });
    
  })
//-----------------------------------------------------------------------------------------------------------------------------------








//(2)-----------------------------------------------------------------------------------------------------------------------------------
//A test http callable function (adding a request)
// exports.addRequest = functions.https.onCall((data, context) => {

//     if (!context.auth) {
//       throw new functions.https.HttpsError(
//         'unauthenticated', 
//         'only authenticated users can add requests'
//       );
//     }

//     if (data.text.length > 30) {
//       throw new functions.https.HttpsError(
//         'invalid-argument', 
//         'request must be no more than 30 characters long'
//       );
//     }

//     return admin.firestore().collection('requests').add({
//       text: data.text,
//       upvotes: 0
//     });

//   });
  //-----------------------------------------------------------------------------------------------------------------------------------