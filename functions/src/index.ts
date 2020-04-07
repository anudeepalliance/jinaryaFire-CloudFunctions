import * as functions from 'firebase-functions'
const admin = require('firebase-admin')
admin.initializeApp()

//Just checking once
// auth trigger (new user signup)
exports.newUserSignUp = functions.auth.user().onCreate(user => {
    return admin.firestore().collection('userFunction').doc(user.uid).set( {
        email: user.email,
        followers: [],
    })
  })

// auth trigger (user deleted)
exports.userDeleted = functions.auth.user().onDelete( user => {
    const doc = admin.firestore().collection('userFunction').doc(user.uid)
    return doc.delete()
})

// http callable function (adding a request)
//This is a test line
exports.sendFeedback = functions.https.onCall((data, context) => {
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