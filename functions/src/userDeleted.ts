import * as functions from 'firebase-functions'
const admin = require('firebase-admin')
admin.initializeApp()


// auth trigger (user deleted)
export const userDeleted = functions.region('asia-east2').auth.user().onDelete( user => {
    const doc = admin.firestore().collection('userFunction').doc(user.uid)
    return doc.delete()
})