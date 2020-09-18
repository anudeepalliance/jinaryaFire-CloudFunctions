import * as functions from 'firebase-functions'
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore'
const admin = require('firebase-admin')

//When the totalNoOfItem field is updated in the WhatsNewRecords SubColl then run this function
//to see if the totalNoOfItems is > 99, if so then delete all the read items in the WhatsNewCollection and decrement
//the totalNoOfItems field, The function will get to a point where all items are unRead in WhatsNewColl so it wont
//delete and update the value, this will avoid the infinite loop of this function
export const whatsNewCollectionMaintenance = functions.region('asia-east2').firestore.document
    ('Users/{userId}/whatsNewRecords/totalNoOfWhatsNewItems').onUpdate(async (change, context) => {

        const updatedData = change.after.data()
        const db = admin.firestore()
        const userId = context.params.userId
        const userDocRef = db.collection('Users').doc(userId)
        const currentTotalNoOfItems = updatedData?.totalNoOfWhatsNewItems
        const maxDocsInWhatsNewThreshold = 4
        //this is a global variable so no need add this is an input parameter in the 
        //deleteAndDecrementTheData(excessDocs) function
        let noOfWhatsNewDocsDeleted = 0

        if (currentTotalNoOfItems > maxDocsInWhatsNewThreshold) {
            const excessDocs = currentTotalNoOfItems - maxDocsInWhatsNewThreshold
            console.log(`There are ${excessDocs} excess documents in the collection`)
            return deleteAndDecrementTheData(excessDocs)

        } else {
            console.log(`no of whatsNewItems is equal to or less than 99`)
            return
        }

        async function deleteAndDecrementTheData(excessDocs : number) {
            await deleteExcessReadWhatsNewItems(excessDocs)
            await deleteAllUnFollowedWhatsNewItems()
            await decrementTheTotalNoItems()
        }


        async function deleteExcessReadWhatsNewItems(excessDocs : number) {
            await userDocRef.collection('whatsNew')
            .where('hasRead', '==', true)
            .orderBy('timestamp', 'asc')
            .limit(excessDocs)
            .get().then((readWhatsNewItems: DocumentSnapshot[]) => {
                readWhatsNewItems.forEach(async readWhatsNewItem => {
                    await userDocRef.collection('whatsNew').doc(readWhatsNewItem.data()?.id).delete()
                    noOfWhatsNewDocsDeleted++
                })
                
            })
        }

        async function deleteAllUnFollowedWhatsNewItems() {
            await userDocRef.collection('whatsNew')
                .where('isFollowing', '==', true)
                .get().then((unFollowedWhatsNewItems: DocumentSnapshot[]) => {
                    unFollowedWhatsNewItems.forEach(async unFollowedWhatsNewItem => {
                        await userDocRef.collection('whatsew').doc(unFollowedWhatsNewItem.data()?.id).delete()
                        noOfWhatsNewDocsDeleted++
                    })
                })
        }

        async function decrementTheTotalNoItems() {
            await userDocRef.collection('whatsNewRecords').doc('totalNoOfWhatsNewItems').update({
                totalNoOfWhatsNewItems: admin.firestore.FieldValue.increment(-noOfWhatsNewDocsDeleted)
            })
            console.log(`noOfWhatsNewDocs is bigger than the threshold and deleted ${noOfWhatsNewDocsDeleted} whatsNewItems`)
        }

    })