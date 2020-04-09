import * as functions from 'firebase-functions'
const admin = require('firebase-admin')
    
    // http callable function (adding a request)
    export const addRequest121 = functions.https.onCall((data, context) => {
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