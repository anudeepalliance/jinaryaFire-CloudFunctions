import * as functions from 'firebase-functions'
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore'
const admin = require('firebase-admin')

//When a user has made a deactivate request more than 30 days ago then delete all the user data permanently
export const deleteDeactivatedUsers = functions.runWith({maxInstances: 1}).region('asia-south1')
    .pubsub.schedule('every 43200 minutes').onRun((context) => {

        //thirty days in millis.
        // const thirtyDaysInMillis = 86400000
        const thirtyDaysInMillis = 5000
        //get the 30day window
        const thirtyDayWindow = Date.now() - thirtyDaysInMillis
        const db = admin.firestore()
        const storage = admin.storage().bucket()

        return deleteTheDeactivatedUsers()

        async function deleteTheDeactivatedUsers() {
            //get all the deactivateAccount requests which are more than 30 days old, Firestore will not hold on to the delete requests,
            //so there is no deleted field in the request as opposed to Mongo, the request will just be deleted once all user data is deleted
            await db.collection('UserFeedback').doc('Reports').collection('DeactivateAccountRequests')
                .where('dateOfRequest', '<', thirtyDayWindow).get().then(async (deleteAccountRequests: DocumentSnapshot[]) => {

                    //loop through each request
                    deleteAccountRequests.forEach(async deleteAccountRequest => {

                        //get the deleteAccountUid
                        const deleteAccountUid = deleteAccountRequest.data()?.uid

                        //delete the follow requests made to the user
                        await deleteFollowRequestsMadeToUser(deleteAccountUid)

                        //delete the follow requests made by the user
                        await deleteFollowRequestsMadeByUser(deleteAccountUid)

                        //delete the user as follower in all user Followers collection
                        await deleteUserAsFollower(deleteAccountUid)

                        //delete all the followers of the user
                        await deleteAllUserFollowers(deleteAccountUid)

                        //delete the user as followed in all user Following collection
                        await deleteUserAsFollowed(deleteAccountUid)

                        //delete the followedPeople followed by the user
                        await deleteAllPeopleFollowedByUser(deleteAccountUid)

                        //delete all blocked sub collection
                        await deleteAllUserBlockedDocs(deleteAccountUid)

                        //delete the people blocked by user
                        await deletePeopleBlockedByUser(deleteAccountUid)

                        //delete the profile Photos of the user
                        await deleteProfilePhotosOfUser(deleteAccountUid)

                        //delete all insight images of the user
                        await deleteAllInsightImagesOfUser(deleteAccountUid)

                        //delete the deactivated user doc 
                        const deactivatedUserDocRef = db.collection('UserFeedback').doc('Reports')
                            .collection('DeactivatedUsers').doc(deleteAccountUid)
                        await deactivatedUserDocRef.delete()

                        //delete the auto accept followers collection
                        const autoAcceptFollowersRef = db.collection('Users').doc(deleteAccountUid).collection('autoAcceptFollowers').doc(deleteAccountUid)
                        await autoAcceptFollowersRef.delete()

                        //delete the notificationToken doc
                        const notificationTokenDocRef = db.collection('Users').doc(deleteAccountUid).collection('notificationToken').doc('theNotificationToken')
                        await notificationTokenDocRef.delete()

                        //delete the deactivateAccountRequest, keep this to last since 
                        //this function might stop in the middle due to out of memory exceptions
                        await deleteDeactivatedUserRequest(deleteAccountUid)
                    })
                })
        }

        async function deleteFollowRequestsMadeToUser(deleteAccountUid: String) {
            await db.collectionGroup('followRequests')
                .where('followRequestedUid', '==', deleteAccountUid)
                .get().then(async (followRequests: DocumentSnapshot[]) => {
                    followRequests.forEach(async followRequest => {
                        await followRequest.ref.delete()
                    })
                })
        }

        async function deleteFollowRequestsMadeByUser(deleteAccountUid: String) {
            await db.collectionGroup('followRequests')
                .where('followerUid', '==', deleteAccountUid)
                .get().then(async (followRequests: DocumentSnapshot[]) => {
                    followRequests.forEach(async followRequest => {
                        await followRequest.ref.delete()
                    })
                })
        }

        async function deleteUserAsFollower(deleteAccountUid: String) {
            await db.collectionGroup('followers')
                .where('followerUid', '==', deleteAccountUid)
                .get().then(async (followers: DocumentSnapshot[]) => {
                    followers.forEach(async follower => {
                        await follower.ref.delete()
                    })
                })
        }

        async function deleteAllUserFollowers(deleteAccountUid: String) {
            await db.collection('Users').doc(deleteAccountUid).collection('followers')
                .get().then(async (followers: DocumentSnapshot[]) => {
                    followers.forEach(async follower => {
                        await follower.ref.delete()
                    })
                })
        }

        async function deleteUserAsFollowed(deleteAccountUid: String) {
            await db.collectionGroup('following')
                .where('followedUid', '==', deleteAccountUid)
                .get().then(async (followedPersons: DocumentSnapshot[]) => {
                    followedPersons.forEach(async followedPerson => {
                        await followedPerson.ref.delete()
                    })
                })
        }

        async function deleteAllPeopleFollowedByUser(deleteAccountUid: String) {
            await db.collection('Users').doc(deleteAccountUid).collection('following')
                .get().then(async (followedPersons: DocumentSnapshot[]) => {
                    followedPersons.forEach(async followedPerson => {
                        await followedPerson.ref.delete()
                    })
                })
        }

        async function deleteAllUserBlockedDocs(deleteAccountUid: String) {
            await db.collectionGroup('blocked')
                .where('blockedUid', '==', deleteAccountUid)
                .get().then(async (blockedPersons: DocumentSnapshot[]) => {
                    blockedPersons.forEach(async blockedPerson => {
                        await blockedPerson.ref.delete()
                    })
                })
        }

        async function deletePeopleBlockedByUser(deleteAccountUid: String) {
            await db.collection('Users').doc(deleteAccountUid).collection('blocked')
                .get().then(async (blockedPersons: DocumentSnapshot[]) => {
                    blockedPersons.forEach(async blockedPerson => {
                        await blockedPerson.ref.delete()
                    })
                })
        }

        async function deleteDeactivatedUserRequest(deleteAccountUid: String) {
            const deactiveAccountRequestDocRef = db.collection('UserFeedback').doc('Reports')
                .collection('DeactivateAccountRequests').doc(deleteAccountUid)
            await deactiveAccountRequestDocRef.delete()
        }

        async function deleteProfilePhotosOfUser(deleteAccountUid: String) {
            //delete the profile photos
            storage.deleteFiles({
                prefix: `Users/${deleteAccountUid}/profilePhotos/`
            }, function (err: Error) {
                if (!err) {
                    console.log(`All Profile photos in the directory have been deleted.`)
                }
            })
        }

        async function deleteAllInsightImagesOfUser(deleteAccountUid: String) {
            storage.deleteFiles({
                prefix: `Users/${deleteAccountUid}/insights/`
            }, function (err: Error) {
                if (!err) {
                    console.log(`All Insight photos in the directory have been deleted.`)
                }
            })
        }


    })