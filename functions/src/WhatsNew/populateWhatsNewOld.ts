import * as functions from 'firebase-functions'
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore'
const admin = require('firebase-admin')


//Populate the WhatsNewSubColl of the user as less than 20 unRead items
//are present currently in the user's WhatsNewSubColl
export const populateWhatsNew = functions.region('asia-east2').https.onCall((populateWhatsNewData, context) => {

  const db = admin.firestore()
  const noOfFollowing: number = populateWhatsNewData.noOfFollowing
  const documentLimit = 10

  //check if request came from an authenticated user
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'only authenticated users can send feedback'
    )
  }

  //create userDocRef as this will be used frequently
  const userDocRef = db.collection('Users').doc(context.auth.uid)
  console.log(`noOfFollowing is ${noOfFollowing}`)
  console.log(`executing getTopInterestedPeopleAndTheirData function`)
  //There is no main block just execute functions
  return getTopInterestedPeopleAndTheirData()

  //get the top 50 interestPeople
  async function getTopInterestedPeopleAndTheirData() {
    const interestedPeople: InterestedPerson[] = []
    await userDocRef.collection('following')
      .orderBy('interestMeter', 'desc')
      .limit(50)
      .get().then((interestedPersons: DocumentSnapshot[]) => {

          interestedPersons.forEach(person => {
            console.log(`interestedPerson is ${person.data()?.userName}`)
            //create a new Interested Person and add it to the interestedPeople[]
            const interestedPerson = new InterestedPerson(
              person.data()?.uid,
              person.data()?.userName,
              person.data()?.interestMeter,
              true
            )
            interestedPeople.push(interestedPerson)
          })
          //get the data for all those people
          return getTheData(interestedPeople)
        })
  }

  //get the next 50 interestedPeople
  async function getTheNext50InterestedPeopleAndTheirData(lastPersonInterestedMeter: number | null) {
    const interestedPeople: InterestedPerson[] = []
    //save the next 50 interestedPeople as we need to get data just for these 50 people
    const nextFiftyInterestedPeople: InterestedPerson[] = []
    userDocRef.collection('following')
      .where('interestMeter', '<', lastPersonInterestedMeter)
      .orderBy('interestMeter', 'desc')
      .limit(50)
      .get().then(
        async (interestedPersons: DocumentSnapshot[]) => {

           interestedPersons.forEach(person => {
            //create a new Interested Person and add it to the interestedPeople[]
            const interestedPerson = new InterestedPerson(
              person.data()?.uid,
              person.data()?.userName,
              person.data()?.interestMeter,
              true
            )
            //push to this main array as we need that for comparision
            interestedPeople.push(interestedPerson)
            //push to this secondary array as we need to get the data just for these people
            nextFiftyInterestedPeople.push(interestedPerson)
          })
          //get the data for these next 50 interestedPeople
          await getTheData(nextFiftyInterestedPeople)
        })
  }

  async function getTheData(theInterestedPeople: InterestedPerson[]) {

    const getNoOfCompsAdded = await getCompsReceived(theInterestedPeople)
    const getNoOfInsightsAdded = await getTheLatestInsights(theInterestedPeople)
    await checkIfWhatsNewObjectsAreSufficient(getNoOfCompsAdded, getNoOfInsightsAdded, theInterestedPeople)
    
  }

  //get the latest comps received by these interestedPeople
  async function getCompsReceived(theInterestedPeople: InterestedPerson[]) {

    const whatsNewObjects: WhatsNewObject[] = []

    console.log(`no of interested people to get compsReceived from is ${theInterestedPeople.length}`)

    theInterestedPeople.forEach(async (person) => {

      let documentsSnapshot = null
      const latestCompReceivedTime = await getLatestCompReceivedTimeInRecord(person.uid)

      if (latestCompReceivedTime === 0) {
        documentsSnapshot = await db.collection('Users').doc(person.uid).collection('complimentsReceived')
          .orderBy('receivedTime', 'desc')
          .limit(documentLimit)
          .get()
      } else {
        documentsSnapshot = await db.collection('Users').doc(person.uid).collection('complimentsReceived')
          .where('receivedTime', '>', latestCompReceivedTime)
          .orderBy('receivedTime', 'desc')
          .limit(documentLimit)
          .get()
      }

      console.log(`compsReceived documentsSnapshot length is ${documentsSnapshot.length}`)

      if (documentsSnapshot.empty) {
        console.log(`${person.userName} has no compsReceived`)
        return
      }

      console.log(`compliment documentsSnapshot of ${person.userName} is greater than 0`)
      await documentsSnapshot.forEach((newCompReceived: { receiverUid: string; receiverUserName: string; complimentsReceivedContent: string | null; hasImage: boolean | null; senderUid: string | null; senderUserName: string | null; noOfLikes: number | null; receivedTime: number | null; complimentId: string | null} ) => {
        //Add each new Compliment to the WhatsNewObjects Array
        const whatsNewDoc = new WhatsNewObject(
          newCompReceived.receiverUid,
          newCompReceived.receiverUserName,
          true,
          newCompReceived.complimentsReceivedContent,
          newCompReceived.hasImage,
          newCompReceived.senderUid,
          newCompReceived.senderUserName,
          newCompReceived.noOfLikes,
          newCompReceived.receivedTime,
          newCompReceived.complimentId,
          'PERSON_COMPLIMENT_RECEIVED'
        )

        whatsNewObjects.push(whatsNewDoc)

      })

      console.log(`no of comps queried for ${person.userName}is ${whatsNewObjects.length}`)

    })

    return whatsNewObjects
  }

  //get the latest insights added by these interestedPeople
  async function getTheLatestInsights(theInterestedPeople: InterestedPerson[]) {

    const whatsNewObjects: WhatsNewObject[] = []

    console.log(`no of interested people to get insightsAdded is ${theInterestedPeople.length}`)

      theInterestedPeople.forEach(async person => {

        let documentsSnapshot = null

        const latestInsightAddedTime = await getLatestInsightAddedTimeInRecord(person.uid)

        if ( latestInsightAddedTime === 0 ) {
          documentsSnapshot = await db.collection('Users').doc(person.uid).collection('insights')
          .orderBy('addedAt', 'desc')
          .limit(documentLimit)
          .get()
        } else {
          documentsSnapshot = await db.collection('Users').doc(person.uid).collection('insights')
          .where('addedAt', '>', latestInsightAddedTime)
          .orderBy('addedAt', 'desc')
          .limit(documentLimit)
          .get()
        }

        console.log(`insights added documentsSnapshot length is ${documentsSnapshot.length}`)

        if (documentsSnapshot.empty) {
          console.log(`${person.userName} has no insights added`)
          return
        }

        console.log(`insights added documentsSnapshot of ${person.userName} is greater than 0`)
        await documentsSnapshot.forEach((newInsightAdded: { insightOwnerUid: string; userName: string; insightContent: string | null; hasImage: boolean | null; senderUid: string | null; senderUserName: string | null; noOfLikes: number | null; addedAt: number | null; insightId: string | null }) => {
          //Add each new Compliment to the WhatsNewObjects Array
          const whatsNewDoc = new WhatsNewObject(
            newInsightAdded.insightOwnerUid,
            newInsightAdded.userName,
            true,
            newInsightAdded.insightContent,
            newInsightAdded.hasImage,
            null,
            null,
            newInsightAdded.noOfLikes,
            newInsightAdded.addedAt,
            newInsightAdded.insightId,
            'PERSON_INSIGHT_ADDED'
          )

          whatsNewObjects.push(whatsNewDoc)

        })

        console.log(`no of insights + comps queried for ${person.userName} is ${whatsNewObjects.length}`)

      })

      return whatsNewObjects

  }

  async function checkIfWhatsNewObjectsAreSufficient(getNoOfCompsAdded: WhatsNewObject[], getNoOfInsightsAdded: WhatsNewObject[], interestedPeople : InterestedPerson[]) {

    const noOfWhatsNewObjects = getNoOfCompsAdded.length + getNoOfInsightsAdded.length
    const whatsNewObjects = getNoOfCompsAdded
    getNoOfInsightsAdded.forEach( insightAdded => {
      whatsNewObjects.push(insightAdded)
    })

    console.log(`no of whats new items is ${noOfWhatsNewObjects}`)
    //check if whatsNewObjects are less than 80 and there more followedPeople to get data from
    if ( noOfWhatsNewObjects < 80 && interestedPeople.length < noOfFollowing ) {
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
      whatsNewObjects.forEach(async whatsNewDoc => {
        console.log(`Adding ${whatsNewDoc.id} to the whatsNewSubColl`)
        await userDocRef.collection('whatsNew').doc(whatsNewDoc.id).set(whatsNewDoc)
      })
      console.log(`executing the increment method`)
      await incrementsTheTotalNoItemsAndUnReadItems(noOfWhatsNewObjects)
    }
  }

  async function incrementsTheTotalNoItemsAndUnReadItems(noOfWhatsNewObjects : number) {
    console.log(`incrementing the values by : ${noOfWhatsNewObjects}`)
    await userDocRef.collection('whatsNew').doc('noOfUnReadItems').update({
      noOfUnReadItems: admin.firestore.FieldValue.increment(10)
    })
    await userDocRef.collection('whatsNew').doc('totalNoOfItems').update({
      totalNoOfItems: admin.firestore.FieldValue.increment(10)
    })
  }



  async function getLatestCompReceivedTimeInRecord(personUid: string): Promise<number> {
    const documentSnapshot = await userDocRef.collection('whatsNew')
      .where('contentType', '==', 'PERSON_COMPLIMENT_RECEIVED')
      .where('primaryProfileUid', '==', personUid)
      .orderBy('timeStamp', 'desc')
      .limit(1)
      .get()
 
      if ( documentSnapshot.exists ) {
        console.log(`the latestComp in record is ${documentSnapshot.data()}`)
        return documentSnapshot.data()?.timeStamp
      } else {
        console.log(`the latestComp does not exist in record`)
        return 0
      }
  }

  async function getLatestInsightAddedTimeInRecord(personUid: string): Promise<number> {
    const documentSnapshot = await userDocRef.collection('whatsNew')
      .where('contentType', '==', 'PERSON_INSIGHT_ADDED')
      .where('primaryProfileUid', '==', personUid)
      .orderBy('timeStamp', 'desc')
      .limit(1)
      .get()

      if ( documentSnapshot.exists ) {
        console.log(`the latestInsight in record is ${documentSnapshot.data()}`)
        return documentSnapshot.data()?.timeStamp
      } else {
        console.log(`the latestInsight does not exist in record`)
        return 0
      }
  }


  //End of the CF function
})

//The classes required for this function
class InterestedPerson {

  uid: string
  userName: string
  interestMeter: number
  contentAvailable: boolean

  constructor(
    theUid: string,
    theUserName: string,
    theInterestMeter: number,
    theContentAvailable: boolean) {

    this.uid = theUid
    this.userName = theUserName
    this.interestMeter = theInterestMeter
    this.contentAvailable = theContentAvailable
  }

}

class WhatsNewObject {

  primaryProfileUid: string
  primaryProfileUserName: string
  contentAvailable: boolean
  content: string | null
  hasImage: boolean | null
  secondaryProfileUid: string | null
  secondaryProfileUsrName: string | null
  noOfLIkes: number | null
  timeStamp: number | null
  id: string | null
  contentType: string

  constructor(
    primaryProfileUid: string,
    primaryProfileUserName: string,
    contentAvailable: boolean,
    content: string | null,
    hasImage: boolean | null,
    secondaryProfileUid: string | null,
    secondaryProfileUsrName: string | null,
    noOfLIkes: number | null,
    timeStamp: number | null,
    id: string | null,
    contentType: string
  ) {

    this.primaryProfileUid = primaryProfileUid
    this.primaryProfileUserName = primaryProfileUserName
    this.contentAvailable = contentAvailable
    this.content = content
    this.hasImage = hasImage
    this.secondaryProfileUid = secondaryProfileUid
    this.secondaryProfileUsrName = secondaryProfileUsrName
    this.noOfLIkes = noOfLIkes
    this.timeStamp = timeStamp
    this.id = id
    this.contentType = contentType
  }

}