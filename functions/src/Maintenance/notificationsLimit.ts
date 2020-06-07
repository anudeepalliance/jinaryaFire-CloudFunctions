import * as functions from 'firebase-functions'
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore'
const admin = require('firebase-admin')

//When a new notification Doc is added to the Notificatons Sub Coll
//Check for the notificationNumbers Doc, if it is 100 then delete the oldest notificationDoc
export const deleteThe101thNotificationDoc = functions.region('asia-east2').firestore.document
('Users/{userId}/Notifications').onCreate((data, context) => {



    //get the notification token of the followed to identify & send notification to his device
    return admin.firestore().collection('Users').doc(context.params.userId).collection('Notifications')
    .doc('noOfNotifications').get().then((noOfNotifications: { exists: any; data: () => any }) => {

        if ( noOfNotifications.exists() ) {
            const notificationsNumber = noOfNotifications.data().noOfNotifications
        }
    
        const batch = admin.firestore().batch()

const userComplimentLikedUserDocs = admin.firestore().collectionGroup('complimentLikes').where('uid', '==',`${updatersUserId}`)

    return userComplimentLikedUserDocs.get().then((querySnapshot: { docs: DocumentSnapshot[] }) => {
        querySnapshot.docs.map((doc) => {
        //get a string representation of the documentPath and use that to update the doc
        const complimentLikerDocPath = doc.ref.path
        //get a DB reference to the userDoc at complimentLike
        const userAtComplimentLike = admin.firestore().doc(complimentLikerDocPath)
        return batch.update(userAtComplimentLike,{
            name: newName,
            nameLowerCase: newNameLowerCase,
            userName: newUserName,
            uid: updatersUserId,
            profilePhotoChosen : newprofilePhotoChosenBoolean
        })
    })
    
    return batch.commit()
    
    })

})