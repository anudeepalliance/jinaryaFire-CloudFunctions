// Just import the functions from other files
import * as functions from 'firebase-functions'
const admin = require('firebase-admin')
admin.initializeApp()

//export the functions in other files, callable https functions 
//dont work if they are in other files hence they are declared in this file
export { newUserSignUp } from './userCreated'
export { userDeleted } from './userDeleted'


//-----------------------------------------------------------------------------------------------------------------------------------
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
        uid: context.auth.uid
      });
    
  })
  //-----------------------------------------------------------------------------------------------------------------------------------

  
  
  
  
  //-----------------------------------------------------------------------------------------------------------------------------------
  //A test http callable function (adding a request)
exports.addRequest = functions.https.onCall((data, context) => {

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

    return admin.firestore().collection('requests').add({
      text: data.text,
      upvotes: 0
    });

  });
  //-----------------------------------------------------------------------------------------------------------------------------------