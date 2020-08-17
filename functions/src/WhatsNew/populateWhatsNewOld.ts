// import * as functions from 'firebase-functions'
// import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore'
// const admin = require('firebase-admin')
// // const utilityFunctions = require('frequentFunctions')
// // const globalClasses = require('globalClasses')


// //Populate the WhatsNewSubColl of the user as less than 20 unRead items
// //are present currently in the user's WhatsNewSubColl
// export const populateWhatsNew = functions.region('asia-east2').https.onCall((populateWhatsNewData, context) => {

//   const db = admin.firestore()
//   const interestedPeople: InterestedPerson[] = []
//   const whatsNewObjects: WhatsNewObject[] = []
//   const noOfFollowing: number = populateWhatsNewData.noOfFollowing
//   const documentLimit = 10

//   //check if request came from an authenticated user
//   if (!context.auth) {
//     throw new functions.https.HttpsError(
//       'unauthenticated',
//       'only authenticated users can send feedback'
//     )
//   }

//   //create userDocRef as this will be used frequently
//   const userDocRef = db.collection('Users').doc(context.auth.uid)
//   console.log(`noOfFollowing is ${noOfFollowing}`)
//   console.log(`executing getTopInterestedPeopleAndTheirData function`)
//   //There is no main block just execute functions
//   return getTopInterestedPeopleAndTheirData()

//   //get the top 50 interestPeople
//   async function getTopInterestedPeopleAndTheirData() {
//     userDocRef.collection('following')
//       .orderBy('interestMeter', 'desc')
//       .limit(50)
//       .get().then(
//         async (interestedPersons: DocumentSnapshot[]) => {

//           interestedPersons.forEach(person => {
//             console.log(`interestedPerson is ${person.data()?.userName}`)
//             //create a new Interested Person and add it to the interestedPeople[]
//             const interestedPerson = new InterestedPerson(
//               person.data()?.uid,
//               person.data()?.userName,
//               person.data()?.interestMeter,
//               true
//             )
//             interestedPeople.push(interestedPerson)
//           })
//           //get the data for all those people
//           await getTheData(interestedPeople)
//         })
//   }

//   //get the next 50 interestedPeople
//   async function getTheNext50InterestedPeopleAndTheirData(lastPersonInterestedMeter: number | null) {
//     //save the next 50 interestedPeople as we need to get data just for these 50 people
//     const nextFiftyInterestedPeople: InterestedPerson[] = []
//     userDocRef.collection('following')
//       .where('interestMeter', '<', lastPersonInterestedMeter)
//       .orderBy('interestMeter', 'desc')
//       .limit(50)
//       .get().then(
//         async (interestedPersons: DocumentSnapshot[]) => {

//            interestedPersons.forEach(person => {
//             //create a new Interested Person and add it to the interestedPeople[]
//             const interestedPerson = new InterestedPerson(
//               person.data()?.uid,
//               person.data()?.userName,
//               person.data()?.interestMeter,
//               true
//             )
//             //push to this main array as we need that for comparision
//             interestedPeople.push(interestedPerson)
//             //push to this secondary array as we need to get the data just for these people
//             nextFiftyInterestedPeople.push(interestedPerson)
//           })
//           //get the data for these next 50 interestedPeople
//           await getTheData(nextFiftyInterestedPeople)
//         })
//   }

//   //get the Data for the interestedPeople in the argument
//   async function getTheData(theInterestedPeople: InterestedPerson[]) {
//     console.log(`no of interested people to get comps and insights is ${theInterestedPeople.length}`)
//     await getTheLatestCompliments(theInterestedPeople)
//     console.log(`noOfComps queried is ${whatsNewObjects.length}`)
//     await getTheLatestInsights(theInterestedPeople)
//     console.log(`noOfComps + noOfInsights queried is ${whatsNewObjects.length}`)
//     //check if whatsNewObjects are less than 80 and there more followedPeople to get data from
//     if ( whatsNewObjects.length < 80 && interestedPeople.length < noOfFollowing ) {
//       console.log(`whatsNewItems is less than 80 and there are more followingPeople left to query`)
//       //Get the interest meter of the last person in the Array and query the next 50 people & their data
//       const lastInterestedPerson = interestedPeople[interestedPeople.length - 1]
//       await getTheNext50InterestedPeopleAndTheirData(lastInterestedPerson.interestMeter)
//     } 
//     //If there are sufficient WhatsNewObjects or if all followedPeople data has been queried then
//     //just add it to the user's WhatsNewSub Coll
//     else {
//       console.log(`whatsNewItems is sufficient or there are no more followedPeople left`)
//       //loop through each WhatsNewObject in the Array and add it the WhatsNewDoc
//       whatsNewObjects.forEach(async whatsNewDoc => {
//         console.log(`Adding ${whatsNewDoc.id} to the whatsNewSubColl`)
//         return userDocRef.collection('whatsNew').doc(whatsNewDoc.id).set(whatsNewDoc)
//       })
//       console.log(`executing the increment method`)
//       await incrementsTheTotalNoItemsAndUnReadItems()
//     }
//   }

//   async function getTheLatestCompliments(theInterestedPeople: InterestedPerson[]) {

//     theInterestedPeople.forEach(async person => {

//       let latestCompsReceivedDocRef = null
//       const latestCompReceivedTime = await getLatestCompReceivedTimeInRecord(person.uid)
//       //assign a query based on the nullability of the existing compReceived in the WhatsNewSub Coll
//       if (latestCompReceivedTime !== 0) {
//         //if compReceived exists in recored then get the later comps
//         latestCompsReceivedDocRef = db.collection('Users').doc(person.uid).collection('complimentsReceived')
//           .where('receivedTime', '>', latestCompReceivedTime)
//           .limit(documentLimit)
//       } else {
//         //if compReceived does not exist in recored then just get latest 10 comps
//         latestCompsReceivedDocRef = db.collection('Users').doc(person.uid).collection('complimentsReceived')
//           .orderBy('receivedTime', 'desc')
//           .limit(documentLimit)
//       }

//       if ( latestCompReceivedTime !== 0 ) {

//       } else {
        
//       }
//       const documentsSnapshot = await db.collection('Users').doc(person.uid).collection('complimentsReceived')
//       .orderBy('receivedTime', 'desc')
//       .limit(documentLimit)
//       .get()

//       if ( documentsSnapshot.length > 0 ) {
//         console.log(`compliment documentsSnapshot of ${person.userName}is greater than 0`)
//         await documentsSnapshot.data()?.forEach((newCompReceived: { receiverUid: string; receiverUserName: string; complimentsReceivedContent: string | null; hasImage: boolean | null; senderUid: string | null; senderUserName: string | null; noOfLikes: number | null; receivedTime: number | null; complimentId: string | null }) => {
//           //Add each new Compliment to the WhatsNewObjects Array
//           const whatsNewDoc = new WhatsNewObject(
//             newCompReceived.receiverUid,
//             newCompReceived.receiverUserName,
//             true,
//             newCompReceived.complimentsReceivedContent,
//             newCompReceived.hasImage,
//             newCompReceived.senderUid,
//             newCompReceived.senderUserName,
//             newCompReceived.noOfLikes,
//             newCompReceived.receivedTime,
//             newCompReceived.complimentId,
//             'PERSON_COMPLIMENT_RECEIVED'
//           )

//           whatsNewObjects.push(whatsNewDoc)
          
//         })
//       }


//       //get the latestCompsReceived by this person
//       latestCompsReceivedDocRef.get().then(async (newCompsReceived: DocumentSnapshot[]) => {


//           .then(async (newCompsReceived: DocumentSnapshot[]) => {

//         newCompsReceived.forEach(newCompReceived => {

//           //Add each new Compliment to the WhatsNewObjects Array
//           const whatsNewDoc = new WhatsNewObject(
//             newCompReceived.data()?.receiverUid,
//             newCompReceived.data()?.receiverUserName,
//             true,
//             newCompReceived.data()?.complimentsReceivedContent,
//             newCompReceived.data()?.hasImage,
//             newCompReceived.data()?.senderUid,
//             newCompReceived.data()?.senderUserName,
//             newCompReceived.data()?.noOfLikes,
//             newCompReceived.data()?.receivedTime,
//             newCompReceived.data()?.complimentId,
//             'PERSON_COMPLIMENT_RECEIVED'
//           )

//           whatsNewObjects.push(whatsNewDoc)

//         })

//       })
//     })

//   }

//   async function getTheLatestInsights(theInterestedPeople: InterestedPerson[]) {

//     theInterestedPeople.forEach(async person => {
//       let latestInsightAddedDocRef = null
//       const latestInsightAddedTime = await getLatestInsightAddedTimeInRecord(person.uid)
//       //assign a query based on the nullability of the existing insightsAdded in the WhatsNewSub Coll
//       if (latestInsightAddedTime !== 0) {
//         //if insightsAdded exists in record then get the later insights
//         latestInsightAddedDocRef = db.collection('Users').doc(person.uid).collection('insights')
//           .where('addedAt', '>', latestInsightAddedTime)
//           .limit(documentLimit)
//       } else {
//         //if insightsAdded does not exist in record then just get latest 10 insights
//         latestInsightAddedDocRef = db.collection('Users').doc(person.uid).collection('insights')
//           .orderBy('addedAt', 'desc')
//           .limit(documentLimit)
//       }

//       //get the latestCompsReceived by this person
//       latestInsightAddedDocRef.get().then(async (newInsightsAdded: DocumentSnapshot[]) => {

//         if (newInsightsAdded.length > 0) {

//           newInsightsAdded.forEach(newInsightAdded => {

//             //Add each new Compliment to the WhatsNewObjects Array
//             const whatsNewDoc = new WhatsNewObject(
//               newInsightAdded.data()?.insightOwnerUid,
//               newInsightAdded.data()?.person.userName,
//               true,
//               newInsightAdded.data()?.insightContent,
//               newInsightAdded.data()?.hasImage,
//               null,
//               null,
//               newInsightAdded.data()?.noOfLikes,
//               newInsightAdded.data()?.addedAt,
//               newInsightAdded.data()?.insightId,
//               'PERSON_INSIGHT_ADDED'
//             )

//             whatsNewObjects.push(whatsNewDoc)

//           })
//         } else {

//           //Add a poke for Insights doc
//           const whatsNewDoc = new WhatsNewObject(
//             person.uid,
//             person.userName,
//             false,
//             null,
//             null,
//             null,
//             null,
//             null,
//             null,
//             null,
//             'POKE_FOR_INSIGHTS'
//           )

//           whatsNewObjects.push(whatsNewDoc)

//         }

//       })

//     })

//   }

//   async function incrementsTheTotalNoItemsAndUnReadItems() {
//     const totalNoOfItemsAdded = whatsNewObjects.length
//     await userDocRef.collection('whatsNew').doc('noOfUnReadItems').update({
//       noOfUnReadItems: admin.firestore.FieldValue.increment(totalNoOfItemsAdded)
//     })
//     await userDocRef.collection('whatsNew').doc('totalNoOfItems').update({
//       totalNoOfItems: admin.firestore.FieldValue.increment(totalNoOfItemsAdded)
//     })
//   }

//   async function getLatestCompReceivedTimeInRecord(personUid: string): Promise<number> {
//     const documentSnapshot = await userDocRef.collection('whatsNew')
//       .where('contentType', '==', 'PERSON_COMPLIMENT_RECEIVED')
//       .where('primaryProfileUid', '==', personUid)
//       .orderBy('timeStamp', 'desc')
//       .limit(1)
//       .get()

//       if ( documentSnapshot.exists ) {
//         console.log(`the latestComp in record is ${documentSnapshot.data()}`)
//         return documentSnapshot.data()?.timeStamp
//       } else {
//         console.log(`the latestComp does not exist in record`)
//         return 0
//       }
    
//   }

//   async function getLatestInsightAddedTimeInRecord(personUid: string): Promise<number> {
//     const documentSnapshot = await userDocRef.collection('whatsNew')
//       .where('contentType', '==', 'PERSON_INSIGHT_ADDED')
//       .where('primaryProfileUid', '==', personUid)
//       .orderBy('timeStamp', 'desc')
//       .limit(1)
//       .get()

//       if ( documentSnapshot.exists ) {
//         console.log(`the latestInsight in record is ${documentSnapshot.data()}`)
//         return documentSnapshot.data()?.timeStamp
//       } else {
//         console.log(`the latestInsight does not exist in record`)
//         return 0
//       }
//   }


//   //End of the CF function
// })

// // Define the classes required for this function
// class InterestedPerson {

//   uid: string
//   userName: string
//   interestMeter: number
//   contentAvailable: boolean

//   constructor(
//     theUid: string,
//     theUserName: string,
//     theInterestMeter: number,
//     theContentAvailable: boolean) {

//     this.uid = theUid
//     this.userName = theUserName
//     this.interestMeter = theInterestMeter
//     this.contentAvailable = theContentAvailable
//   }

// }

// class WhatsNewObject {

//   primaryProfileUid: string
//   primaryProfileUserName: string
//   contentAvailable: boolean
//   content: string | null
//   hasImage: boolean | null
//   secondaryProfileUid: string | null
//   secondaryProfileUsrName: string | null
//   noOfLIkes: number | null
//   timeStamp: number | null
//   id: string | null
//   contentType: string

//   constructor(
//     primaryProfileUid: string,
//     primaryProfileUserName: string,
//     contentAvailable: boolean,
//     content: string | null,
//     hasImage: boolean | null,
//     secondaryProfileUid: string | null,
//     secondaryProfileUsrName: string | null,
//     noOfLIkes: number | null,
//     timeStamp: number | null,
//     id: string | null,
//     contentType: string
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