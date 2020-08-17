// import * as functions from 'firebase-functions'
// import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore'
// const admin = require('firebase-admin')
// const utilityFunctions = require('frequentFunctions')
// const globalClasses = require('globalClasses')


// //Populate the WhatsNewSubColl of the user as less than 20 unRead items
// //are present currently in the user's WhatsNewSubColl
// export const populateWhatsNewOld = functions.region('asia-east2').https.onCall((whatsNewCollData, context) => {

//   const db = admin.firestore()
//   const interestedPeople: InterestedPerson[] = []
//   const whatsNewObjects: WhatsNewObject[] = []
//   let noOfFollowedPeople: number = whatsNewCollData.data()?.noOfFollowedPeople
//   const documentLimit = 10

//   //check if request came from an authenticated user
//   if (!context.auth) {
//     throw new functions.https.HttpsError(
//       'unauthenticated',
//       'only authenticated users can send feedback'
//     )
//   }

//   const userDocRef = db.collection('Users').doc(context.auth.uid)

//   //get the top 50 interestPersons
//   return userDocRef.collection('following')
//     .orderBy('interestMeter')
//     .limit(50)
//     .get().then((interestedPersons: DocumentSnapshot[]) => {

//       //Loop through each interestedPerson
//       interestedPersons.forEach(person => {
//         //create a new Interested Person and add it to the interestedPeople[]
//         const interestedPerson = new InterestedPerson(person.data()?.uid, true)
//         interestedPeople.push(interestedPerson)

//         //Execute only if the length of the WhatsNewObjects array is less than 80
//         if (whatsNewObjects.length < 80) {
//           //get the latest compReceived of this person in the current WhatsNewSubColl
//           return userDocRef.collection('whatsNew').doc()
//             .where('contentType', '==', 'PERSON_COMPLIMENT_RECEIVED')
//             .where('primaryProfileUid', '==', person.data()?.uid)
//             .orderBy('timeStamp', 'desc')
//             .limit(1)
//             .get().then((latestCompReceivedDoc: DocumentSnapshot) => {

//               const latestCompReceivedInRecord = latestCompReceivedDoc
//               let latestCompsReceivedDocRef = null

//               //get the latest insightAdded by this person in the current WhatsNewSubColl
//               return userDocRef.collection('whatsNew').doc()
//                 .where('contentType', '==', 'PERSON_INSIGHT_ADDED')
//                 .where('primaryProfileUid', '==', person.data()?.uid)
//                 .orderBy('timeStamp', 'desc')
//                 .limit(1).get().then((latestInsightAddedDoc: DocumentSnapshot) => {

//                   const latestInsightAddedInRecord = userDocRef
//                   let latestInsightAddedDocRef = null


//                   //assign a query based on the nullability of the
//                   //existing compReceived in the WhatsNewSub Coll
//                   if (latestCompReceivedInRecord != null) {
//                     //if compReceived exists in recored then get the later comps
//                     latestCompsReceivedDocRef = db.collection('Users').doc(person.data()?.uid).collection('complimentsReceived')
//                       .where('receivedTime', '>', latestCompReceivedInRecord.data()?.receivedTime)
//                       .limit(documentLimit)
//                   } else {
//                     //if compReceived does not exist in recored then just get latest 10 comps
//                     latestCompsReceivedDocRef = db.collection('Users').doc(person.data()?.uid).collection('complimentsReceived')
//                       .orderBy('receivedTime', 'desc')
//                       .limit(documentLimit)
//                   }
//                   //get the latestCompsReceived by this person
//                   return latestCompsReceivedDocRef.get().then((newCompsReceived: DocumentSnapshot[]) => {

//                     newCompsReceived.forEach(newCompReceived => {

//                       //Add each new Compliment to the WhatsNewObjects Array
//                       const whatsNewDoc = new WhatsNewObject(
//                         newCompReceived.data()?.receivedUid,
//                         newCompReceived.data()?.receiverUserName,
//                         true,
//                         newCompReceived.data()?.complimentsReceivedContent,
//                         newCompReceived.data()?.hasImage,
//                         newCompReceived.data()?.senderUid,
//                         newCompReceived.data()?.senderUserName,
//                         newCompReceived.data()?.noOfLikes,
//                         newCompReceived.data()?.receivedTime,
//                         newCompReceived.data()?.complimentId,
//                         'PERSON_COMPLIMENT_RECEIVED'
//                       )

//                       whatsNewObjects.push(whatsNewDoc)

//                     })

//                     //assign a query based on the nullability of the
//                     //existing insightsAdded in the WhatsNewSub Coll
//                     if (latestInsightAddedInRecord != null) {
//                       //if insightsAdded exists in recored then get the later insights
//                       latestInsightAddedDocRef = db.collection('Users').doc(person.data()?.uid).collection('insights')
//                         .where('addedAt', '>', latestInsightAddedInRecord.data()?.addedAt)
//                         .limit(documentLimit)
//                     } else {
//                       //if insightsAdded does not exist in recored then just get latest 10 insights
//                       latestInsightAddedDocRef = db.collection('Users').doc(person.data()?.uid).collection('insights')
//                         .orderBy('addedAt', 'desc')
//                         .limit(documentLimit)
//                     }

//                     //get the latest InsightsAdded by this person
//                     return latestInsightAddedDocRef.get().then((newInsightsAdded: DocumentSnapshot[]) => {

//                       //push insights to WhatsNewObjects Array only if insights are available
//                       if (newInsightsAdded.length > 0) {

//                         newInsightsAdded.forEach(newInsightAdded => {

//                           //Add each new Compliment to the WhatsNewObjects Array
//                           const whatsNewDoc = new WhatsNewObject(
//                             newInsightAdded.data()?.insightOwnerUid,
//                             person.data()?.userName,
//                             true,
//                             newInsightAdded.data()?.insightContent,
//                             newInsightAdded.data()?.hasImage,
//                             null,
//                             null,
//                             newInsightAdded.data()?.noOfLikes,
//                             newInsightAdded.data()?.addedAt,
//                             newInsightAdded.data()?.insightId,
//                             'PERSON_INSIGHT_ADDED'
//                           )

//                           whatsNewObjects.push(whatsNewDoc)

//                         })

//                       } else {

//                         //Add a poke for Insights doc
//                         const whatsNewDoc = new WhatsNewObject(
//                           person.data()?.uid,
//                           person.data()?.userName,
//                           false,
//                           null,
//                           null,
//                           null,
//                           null,
//                           null,
//                           null,
//                           null,
//                           'POKE_FOR_INSIGHTS'
//                         )

//                         whatsNewObjects.push(whatsNewDoc)

//                       }

//                     })


//                   })

//                 })

//             })

//         }

//       })

//     })

// })

// // Define the classes required for this function
// class InterestedPerson {

//   uid: String
//   contentAvailable: boolean

//   constructor(
//     theUid: String,
//     theContentAvailable: boolean) {

//     this.uid = theUid
//     this.contentAvailable = theContentAvailable

//   }
// }

// class WhatsNewObject {

//   primaryProfileUid: String
//   primaryProfileUserName: String
//   contentAvailable: boolean
//   content: String | null
//   hasImage: boolean | null
//   secondaryProfileUid: String | null
//   secondaryProfileUsrName: String | null
//   noOfLIkes: number | null
//   timeStamp: number | null
//   id: String | null
//   contentType: String

//   constructor(
//     primaryProfileUid: String,
//     primaryProfileUserName: String,
//     contentAvailable: boolean,
//     content: String | null,
//     hasImage: boolean | null,
//     secondaryProfileUid: String | null,
//     secondaryProfileUsrName: String | null,
//     noOfLIkes: number | null,
//     timeStamp: number | null,
//     id: String | null,
//     contentType: String
//   ) {

//     this.primaryProfileUid = primaryProfileUid
//     this.primaryProfileUserName = primaryProfileUserName
//     this.contentAvailable = contentAvailable
//     this.content = content
//     this.hasImage = hasImage
//     this.secondaryProfileUid = secondaryProfileUid
//     this.secondaryProfileUsrName = secondaryProfileUsrName
//     this.noOfLIkes = noOfLIkes
//     this.timeStamp = timeStamp
//     this.id = id
//     this.contentType = contentType
//   }

// }