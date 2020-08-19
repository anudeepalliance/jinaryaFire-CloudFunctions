import * as functions from 'firebase-functions'
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore'
const admin = require('firebase-admin')


//Populate the WhatsNewSubColl of the user as less than 20 unRead items
//are present currently in the user's WhatsNewSubColl
export const populateWhatsNew = functions.region('asia-east2').https.onCall((populateWhatsNewData, context) => {

  const db = admin.firestore()
  const noOfFollowing: number = populateWhatsNewData.noOfFollowing
  const documentLimit = 10
  const whatsNewObjects: any[] = []

  //check if request came from an authenticated user
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'only authenticated users can send feedback'
    )
  }

  const userId = context.auth.uid
  //create userDocRef as this will be used frequently
  const userDocRef = db.collection('Users').doc(userId)
  //There is no main block just execute functions
  return getTopInterestedPeopleAndTheirData()

  //get the top 50 interestPeople
  async function getTopInterestedPeopleAndTheirData() {
    const interestedPeople: any[] = []
    await userDocRef.collection('following')
      .orderBy('interestMeter', 'desc')
      .limit(50)
      .get().then((interestedPersons: DocumentSnapshot[]) => {

        interestedPersons.forEach(person => {
          //create a new Interested Person and add it to the interestedPeople[]
          const interestedPerson = {
            uid: person.data()?.uid,
            userName: person.data()?.userName,
            interestMeter: person.data()?.interestMeter,
            contentAvailable: true
          }
          interestedPeople.push(interestedPerson)
        })
        //get the data for all those people
        return getTheData(interestedPeople)
      })
  }

  //get the next 50 interestedPeople
  async function getTheNext50InterestedPeopleAndTheirData(lastPersonInterestedMeter: number) {
    const interestedPeople: any[] = []
    //save the next 50 interestedPeople as we need to get data just for these 50 people
    const nextFiftyInterestedPeople: any[] = []
    userDocRef.collection('following')
      .where('interestMeter', '<', lastPersonInterestedMeter)
      .orderBy('interestMeter', 'desc')
      .limit(50)
      .get().then(
        async (interestedPersons: DocumentSnapshot[]) => {

          interestedPersons.forEach(person => {
            //create a new Interested Person and add it to the interestedPeople[]
            const interestedPerson = {
              uid: person.data()?.uid,
              userName: person.data()?.userName,
              interestMeter: person.data()?.interestMeter,
              contentAvailable: true
            }
            //push to this main array as we need that for comparision
            interestedPeople.push(interestedPerson)
            //push to this secondary array as we need to get the data just for these people
            nextFiftyInterestedPeople.push(interestedPerson)
          })
          //get the data for these next 50 interestedPeople
          await getTheData(nextFiftyInterestedPeople)
        })
  }

  async function getTheData(theInterestedPeople: any[]) {
    await getCompsReceived(theInterestedPeople)
    await getTheLatestInsights(theInterestedPeople)
    await checkIfWhatsNewObjectsAreSufficient(theInterestedPeople)

  }

  //get the latest comps received by these interestedPeople
  async function getCompsReceived(theInterestedPeople: any[]) {

    let compsReceivedRef = null

    console.log(`no of interested people to get compsReceived from is ${theInterestedPeople.length}`)

    //do not  theInterestedPeople.forEach(async (person) => { , as this syntax will be skipped in async functions
    for (const person of theInterestedPeople) {

      //get the latest complimentReceived time that exists in the current whatsNew collection
      const latestCompReceivedTime = await getLatestCompReceivedTimeInRecord(person.uid)
      //if comp does not exist then the value be 0 so just get recent comps
      if (latestCompReceivedTime === 0) {
        console.log(`comps for ${person.userName} does not exist in record`)
        compsReceivedRef = db.collection('Users').doc(person.uid).collection('complimentsReceived')
          // .where('senderUid', '>', userId)
          // .where('senderUid', '<', userId)
          // .orderBy('senderUid')
          .orderBy('receivedTime', 'desc')
          .limit(documentLimit)

      }
      //if comp exists then the get comps more recent than the receivedTime of the exisiting comp
      else {
        console.log(`comps for ${person.userName} exists in record`)
        compsReceivedRef = await db.collection('Users').doc(person.uid).collection('complimentsReceived')
          .where('senderUid', '>', userId)
          .where('senderUid', '<', userId)
          .orderBy('senderUid')
          .where('receivedTime', '>', latestCompReceivedTime)
          .orderBy('receivedTime', 'desc')
          .limit(documentLimit)
      }


      await compsReceivedRef.get().then((compReceived: DocumentSnapshot[]) => {

        compReceived.forEach(document => {
          //Add each new Compliment to the WhatsNewObjects Array
          const whatsNewDoc = {
            primaryProfileUid: document.data()?.receiverUid,
            primaryProfileUserName: document.data()?.receiverUserName,
            content: document.data()?.complimentReceivedContent,
            contentQuestion: null,
            hasImage: document.data()?.hasImage,
            secondaryProfileUid: document.data()?.senderUid,
            secondaryProfileUserName: document.data()?.senderUserName,
            noOfLIkes: document.data()?.noOfLikes,
            timeStamp: document.data()?.receivedTime,
            id: document.data()?.complimentId,
            contentType: 'PERSON_COMPLIMENT_RECEIVED'
          }

          whatsNewObjects.push(whatsNewDoc)
        })

      })

      console.log(`length of whatsNewObjects after adding ${person.userName}'s compsReceived is ${whatsNewObjects.length}`)

    }

  }

  //get the latest insights added by these interestedPeople
  async function getTheLatestInsights(theInterestedPeople: any[]) {

    let insightAddedRef = null

    console.log(`no of interested people to get insightsAdded is ${theInterestedPeople.length}`)

      for ( const person of theInterestedPeople) {

        const latestInsightAddedTime = await getLatestInsightAddedTimeInRecord(person.uid)

        if ( latestInsightAddedTime === 0 ) {
          console.log(`insights for ${person.userName} does not exist in record`)
          insightAddedRef = await db.collection('Users').doc(person.uid).collection('insights')
          .orderBy('addedAt', 'desc')
          .limit(documentLimit)
        } else {
          console.log(`insights for ${person.userName} does not exist in record`)
          insightAddedRef = await db.collection('Users').doc(person.uid).collection('insights')
          .where('addedAt', '>', latestInsightAddedTime)
          .orderBy('addedAt', 'desc')
          .limit(documentLimit)
        }

        await insightAddedRef.get().then((insightsAdded: DocumentSnapshot[])=> {

          insightsAdded.forEach(document => {
            //Add each new Compliment to the WhatsNewObjects Array
            const whatsNewDoc  = {
              primaryProfileUid: document.data()?.insightOwnerUid,
              primaryProfileUserName: person.userName,
              content: document.data()?.insightContent,
              contentQuestion: document.data()?.insightQuestion,
              hasImage: document.data()?.hasImage,
              secondaryProfileUid: null,
              secondaryProfileUserName: null,
              noOfLIkes: document.data()?.noOfLikes,
              timeStamp: document.data()?.addedAt,
              id: document.data()?.insightId,
              contentType: 'PERSON_INSIGHT_ADDED'
          }
  
            whatsNewObjects.push(whatsNewDoc)
          })

        })

        console.log(`no of insights + comps queried for ${person.userName} is ${whatsNewObjects.length}`)

      }

  }

  async function checkIfWhatsNewObjectsAreSufficient(interestedPeople: any[]) {

    const noOfWhatsNewObjects = whatsNewObjects.length

    console.log(`no of whats new items is ${noOfWhatsNewObjects}`)
    //check if whatsNewObjects are less than 80 and there more followedPeople to get data from
    if (noOfWhatsNewObjects < 80 && interestedPeople.length < noOfFollowing) {
      console.log(`whatsNewItems is less than 80 and there are more followingPeople left to query`)
      //Get the interest meter of the last person in the Array and query the next 50 people & their data
      const lastInterestedPerson = interestedPeople[interestedPeople.length - 1]
      await getTheNext50InterestedPeopleAndTheirData(lastInterestedPerson.interestMeter)
    }
    //If there are sufficient WhatsNewObjects or if all followedPeople data has been queried then
    //just add it to the user's WhatsNewSub Coll
    else {
      console.log(`whatsNewItems is sufficient or there are no more followedPeople left`)
      //loop through each WhatsNewObject in the Array and add it the WhatsNewDoc
      for (const theWhatsNewDoc of whatsNewObjects) {
        await userDocRef.collection('whatsNew').doc(theWhatsNewDoc.id).set(theWhatsNewDoc)
      }
      await incrementTheTotalNoItemsAndUnReadItems(noOfWhatsNewObjects)
    }
  }



  async function incrementTheTotalNoItemsAndUnReadItems(noOfWhatsNewObjects: number) {
    await userDocRef.collection('ProfileInfo').doc(userId).update({
      noOfUnReadWhatsNewItems: admin.firestore.FieldValue.increment(noOfWhatsNewObjects)
    })
    await userDocRef.collection('ProfileInfo').doc(userId).update({
      totalNoOfWhatsNewItems: admin.firestore.FieldValue.increment(noOfWhatsNewObjects)
    })
  }

  //get the latest complimentReceived time that exists in the current whatsNew collection
  async function getLatestCompReceivedTimeInRecord(personUid: string): Promise<number> {
    let time = 0
    const documentsRef = userDocRef.collection('whatsNew')
      .where('contentType', '==', 'PERSON_COMPLIMENT_RECEIVED')
      .where('primaryProfileUid', '==', personUid)
      .orderBy('timeStamp', 'desc')
      .limit(1)
      
      await documentsRef.get().then((latestCompsReceived: DocumentSnapshot[]) => {
        latestCompsReceived.forEach(latestCompReceived => {
          console.log(`latest compliment for ${personUid} exists in record`)
          time = latestCompReceived.data()?.timeStamp
        })
      })

    return time
    
  }

  async function getLatestInsightAddedTimeInRecord(personUid: string): Promise<number> {
    let time = 0
    const documentsRef = userDocRef.collection('whatsNew')
      .where('contentType', '==', 'PERSON_INSIGHT_ADDED')
      .where('primaryProfileUid', '==', personUid)
      .orderBy('timeStamp', 'desc')
      .limit(1)

    await documentsRef.get().then((latestInsightsAdded: DocumentSnapshot[]) => {
      latestInsightsAdded.forEach(latestInsightAdded => {
        console.log(`latest insight for ${personUid} exists in record`)
        time = latestInsightAdded.data()?.timeStamp
      })
    })

    return time

  }


})