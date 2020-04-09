import * as functions from 'firebase-functions'
const admin = require('firebase-admin')

// export function sendFeedback() 
  export const sendFeedback121 = functions.region('asia-east2').https.onCall((data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated', 
        'only authenticated users can add requests'
      )
    }
    if (data.text.length > 30) {
      throw new functions.https.HttpsError(
        'invalid-argument', 
        'request must be no more than 30 characters long'
      )
    }
    return admin.firestore().collection('Feedback').add({
      Feedback : data.feedback,
      uid: context.auth.uid
    })
  })
