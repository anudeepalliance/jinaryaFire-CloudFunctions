import * as functions from 'firebase-functions'
const admin = require('firebase-admin')


// auth trigger (user deleted)
export const userDeleted = functions.region('asia-south1').auth.user().onDelete( user => {
    const doc = admin.firestore().collection('onUserCreate').doc(user.uid)
    return doc.delete()
})