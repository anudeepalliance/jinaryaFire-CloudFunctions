import * as functions from 'firebase-functions'
const admin = require('firebase-admin')
admin.initializeApp()


// auth trigger (new user signup)
export const newUserSignUp = functions.auth.user().onCreate(user => {
    return admin.firestore().collection('userFunction').doc(user.uid).set( {
        email: user.email,
        followers: [],
    })
  })