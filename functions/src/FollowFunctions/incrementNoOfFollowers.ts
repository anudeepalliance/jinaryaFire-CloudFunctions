import * as functions from 'firebase-functions'
const admin = require('firebase-admin')

//When a follower doc is added to the User's followers sub coll then
//increase noOfFollowers field by 1 the profileInfo doc
export const incrementNoOfFollowers = functions.region('asia-south1').firestore.document
    ('Users/{userId}/followers/{followerUid}').onCreate((data, context) => {

        return admin.firestore().collection('Users').doc(context.params.userId).collection('ProfileInfo').doc(context.params.userId).update({
            noOfFollowers: admin.firestore.FieldValue.increment(1)
        })

    })