import * as functions from 'firebase-functions'
const admin = require('firebase-admin')
admin.initializeApp()


// auth trigger (user deleted)
export const userDeleted = functions.auth.user().onDelete( user => {
    const doc = admin.firestore().collection('userFunction').doc(user.uid)
    return doc.delete()
})