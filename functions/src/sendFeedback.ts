import * as functions from 'firebase-functions'
const admin = require('firebase-admin')
admin.initializeApp()

// http callable function (adding a request)
export const sendFeedback = functions.region('asia-east2').https.onCall((data, context) => {
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
    return admin.firestore().collection('feedback').add({
      Feedback : data.text,
      uid: context.auth.uid
    })
  })