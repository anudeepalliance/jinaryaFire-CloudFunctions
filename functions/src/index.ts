// Just import the functions from other files
import * as functions from 'firebase-functions'
const admin = require('firebase-admin')
admin.initializeApp()

//export the functions in other files, callable https functions 
//dont work if they are in other files hence they are declared in this file
export { newUserSignUp } from './userCreated'
export { userDeleted } from './userDeleted'
// export { newFollowerGained1 } from './newFollowerGained'


//(1)-----------------------------------------------------------------------------------------------------------------------------------
//Add Follower Function: This  takes in a Follower User and a Followee Uid 
//to add a Follower to the Followee's follower sub collection
exports.newFollowerGained = functions.region('asia-east2').https.onCall((data, context) => {
    
  if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated', 
        'only authenticated users can add requests'
      );
    }

    const followerPersonName = data.text
    const followerPersonUserName = data.userName
    const followerPersonProfilePhotoChosen = data.profilePhotoChosen
    const followerPersonUid = context.auth.uid
    const followeePersonUid = data.followeePersonUid

    return admin.firestore()
    .collection('Users').doc(`${followeePersonUid}`)
    .collection('Followers').doc(`${followerPersonUid}`)
    .set( {
      name: followerPersonName,
      userName: followerPersonUserName,
      profilePhotoChosen: followerPersonProfilePhotoChosen,
      uid: followerPersonUid
    });
  
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