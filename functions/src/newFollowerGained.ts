import * as functions from 'firebase-functions'
const admin = require('firebase-admin')


export const newFollowerGained1 = functions.firestore
.document('Users/{userId}/FollowingPeople/{FolloweePersonUid}')
.onCreate((snap, context) => {
      // Get an object representing the document
      // e.g. {'name': 'Marie', 'age': 66}
      const followerPersonUid = context.params.userId
      const followeePersonUid = context.params.FolloweePersonUid
      const newValue = snap.data()

      console.log(`${newValue}`)

      return admin.firestore().
      document(`Users/${followeePersonUid}/Followers/${followerPersonUid}`)
      .add( {
        test: "You gained a new follower"
    })

      // const followerName = snap.data().age
      
      // const followerUserName = newValue.userName
      // const followerUid = personUid
      // const followerProfilePhotoChosen = newValue.profilePhotoChosen

      // // access a particular field as you would any JS property
      // const name = newValue.name;

      // perform desired operations ...
    })