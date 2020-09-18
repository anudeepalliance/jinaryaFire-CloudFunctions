import * as functions from 'firebase-functions'
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore'
const admin = require('firebase-admin')


//Populate the WhatsNewSubColl of the user as less than 20 unRead items
//are present currently in the user's WhatsNewSubColl
//1.Gets top 50 interested People
//2.If their comps and insights exist in the current WhatsNew SubColl then get
//content more recent than that
//3.If insights do not exist for a specific followed person then add a poke for insight doc
//for the person
//4.if content does not exist in the current WhatsNewSub Coll then
//just get recent 10 comps and insights
//5.If WhatsNew Items after this process is less than 80 and more followedPeople left then
//query the next 50 interested people and repeat this process until either whatsNewObjects is 80
//or there no more followedPeople to get content from
//6.Push the content to WhatsNewSubColl
//7.increment the WhatsNew record numbers by the noOfItems added
//8. check if sufficent noOfInterested people did not add insights to add poke_for_insights whatsNewDocs
//If yes then run a function to identify more followedPeople who do not have
// insights and add poke whatsNewDocs for those users
//NOTE: do not consider addition of poke_for_insights whatsNewDoc to the whatsNewDoc
//records for incrementing at this function or decrementing at client
export const populateWhatsNew = functions.region('asia-east2').https.onCall((populateWhatsNewData, context) => {

  const db = admin.firestore()
  const noOfFollowing: number = populateWhatsNewData.noOfFollowing
  const noOfInterestedPeopleToQuery = 10
  const documentLimit = 2
  const whatsNewObjects: any[] = []
  const interestedPeople: any[] = []
  let latestCompReceivedTimeInRecord = 0
  let latestInsightAddedInRecord = 0
  const maxNumberOfPokeForInsightDocs = 10

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
    await userDocRef.collection('following')
      .orderBy('interestMeter', 'desc')
      .limit(noOfInterestedPeopleToQuery)
      .get().then((interestedPersons: DocumentSnapshot[]) => {

        interestedPersons.forEach(person => {
          //create a new Interested Person and add it to the interestedPeople[]
          const interestedPerson = {
            uid: person.data()?.uid,
            userName: person.data()?.userName,
            name: person.data()?.name,
            interestMeter: person.data()?.interestMeter
          }
          interestedPeople.push(interestedPerson)
        })
        //get the data for all those people
        return getTheData(interestedPeople)
      })
  }

  //get the next 50 interestedPeople
  async function getTheNext50InterestedPeopleAndTheirData(lastPersonInterestedMeter: number) {
    //save the next 50 interestedPeople as we need to get data just for these 50 people
    const nextFiftyInterestedPeople: any[] = []
    await userDocRef.collection('following')
      .where('interestMeter', '<', lastPersonInterestedMeter)
      .orderBy('interestMeter', 'desc')
      .limit(noOfInterestedPeopleToQuery)
      .get().then(
        async (interestedPersons: DocumentSnapshot[]) => {

          interestedPersons.forEach(person => {
            //create a new Interested Person and add it to the interestedPeople[]
            const interestedPerson = {
              uid: person.data()?.uid,
              userName: person.data()?.userName,
              name: person.data()?.name,
              interestMeter: person.data()?.interestMeter
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
    //await keyword ensures every function is called only after the previous function has finished executing
    await getCompsReceived(theInterestedPeople)
    await getTheLatestInsights(theInterestedPeople)
    await checkIfWhatsNewObjectsAreSufficient()
    await getNoInsightFollowedPeople()
  }

  //get the latest comps received by these interestedPeople
  async function getCompsReceived(theInterestedPeople: any[]) {

    //the reference which is assigned dynamically based on whether comps exists in the current whatsNew SubColl
    let compsReceivedRef = null

    //do not theInterestedPeople.forEach(async (person) => { , as this syntax will be skipped in async functions
    for (const person of theInterestedPeople) {
 
      //get the latest complimentReceived time that exists in the current whatsNew collection
      await userDocRef.collection('whatsNew')
        .where('contentType', '==', 'PERSON_COMPLIMENT_RECEIVED')
        .where('primaryProfileUid', '==', person.uid)
        .orderBy('timestamp', 'desc')
        .limit(1)
        .get().then(async (latestCompsReceived: DocumentSnapshot[]) => {
          latestCompsReceived.forEach(latestCompReceived => {
            latestCompReceivedTimeInRecord = latestCompReceived.data()?.timestamp
          })

          //if comp does not exist then the value be 0 so just get recent comps
          if (latestCompReceivedTimeInRecord === 0) {
            console.log(`compliments for ${person.userName} does not exist in record`)
            compsReceivedRef = db.collection('Users').doc(person.uid).collection('complimentsReceived')
              // .where('senderUid', '>', userId)
              // .where('senderUid', '<', userId)
              // .orderBy('senderUid')
              .orderBy('receivedTime', 'desc')
              .limit(documentLimit)
          }
          
          //if comp exists then the the receivedTime value is assigned and get comps more recent than the receivedTime in the exisiting coll
          else {
            console.log(`compliments for ${person.userName} exists in record`)
            compsReceivedRef = await db.collection('Users').doc(person.uid).collection('complimentsReceived')
              // .where('senderUid', '>', userId)
              // .where('senderUid', '<', userId)
              // .orderBy('senderUid')
              .where('receivedTime', '>', latestCompReceivedTimeInRecord)
              .orderBy('receivedTime', 'desc')
              .limit(documentLimit)
          }

          //Now just query the comps and convert them into a custom object and add it to the WhatsNewObjects Array
          await compsReceivedRef.get().then((compReceived: DocumentSnapshot[]) => {

            compReceived.forEach(document => {
              //Add each new Compliment to the WhatsNewObjects Array
              const whatsNewDoc = {
                primaryProfileUid: document.data()?.receiverUid,
                primaryProfileUserName: document.data()?.receiverUserName,
                primaryProfileName: document.data()?.receiverName,
                content: document.data()?.complimentReceivedContent,
                contentQuestion: null,
                hasImage: document.data()?.hasImage,
                secondaryProfileUid: document.data()?.senderUid,
                secondaryProfileUserName: document.data()?.senderUserName,
                secondaryProfileName: document.data()?.senderName,
                noOfLikes: document.data()?.noOfLikes,
                userLiked: false,
                timestamp: document.data()?.receivedTime,
                id: document.data()?.complimentId,
                hasRead: false,
                isFollowing: true,
                contentType: 'PERSON_COMPLIMENT_RECEIVED'
              }

              whatsNewObjects.push(whatsNewDoc)
            })

          })

          console.log(`length of whatsNewObjects after adding ${person.userName}'s compsReceived is ${whatsNewObjects.length}`)


        })

    }
  }

  //get the latest insights added by these interestedPeople
  async function getTheLatestInsights(theInterestedPeople: any[]) {

    //the reference which is assigned dynamically based on whether insights exists in the current whatsNew SubColl
    let insightAddedRef = null

    //do not theInterestedPeople.forEach(async (person) => { , as this syntax will be skipped in async functions
    for (const person of theInterestedPeople) {

      //get the latest insight time that exists in the current whatsNew collection
      await userDocRef.collection('whatsNew')
        .where('contentType', '==', 'PERSON_INSIGHT_ADDED')
        .where('primaryProfileUid', '==', person.uid)
        .orderBy('timestamp', 'desc')
        .limit(1)
        .get().then(async (latestInsightsAdded: DocumentSnapshot[]) => {
          latestInsightsAdded.forEach(latestInsightAdded => {
            latestInsightAddedInRecord = latestInsightAdded.data()?.timestamp
          })

          //if insight does not exist then the value be 0 so just get recent insights
          if (latestInsightAddedInRecord === 0) { 
            console.log(`insights for ${person.userName} does not exist n record`)
            insightAddedRef = await db.collection('Users').doc(person.uid).collection('insights')
              .orderBy('addedAt', 'desc')
              .limit(documentLimit)
          }
          //if insight exists then the the addedTime value is assigned and get insights more recent than the addedTime in the exisiting coll
          else {
            console.log(`insights for ${person.userName} exists in record`)
            insightAddedRef = await db.collection('Users').doc(person.uid).collection('insights')
              .where('addedAt', '>', latestInsightAddedInRecord)
              .orderBy('addedAt', 'desc')
              .limit(documentLimit)
          }

          //Now just query the insights and convert them into a custom object and add it to the WhatsNewObjects Array
          await insightAddedRef.get().then((insightsAdded: DocumentSnapshot[]) => {

            insightsAdded.forEach(document => {
              //Add each new Insight to the WhatsNewObjects Array
              const whatsNewDoc = {
                primaryProfileUid: document.data()?.insightOwnerUid,
                primaryProfileUserName: person.userName,
                primaryProfileName: person.name,
                content: document.data()?.insightContent,
                contentQuestion: document.data()?.insightQuestion,
                hasImage: document.data()?.hasImage,
                secondaryProfileUid: null,
                secondaryProfileUserName: null,
                secondaryProfileName: null,
                noOfLikes: document.data()?.noOfLikes,
                userLiked: false,
                timestamp: document.data()?.addedAt,
                id: document.data()?.insightId,
                hasRead: false,
                isFollowing: true,
                contentType: 'PERSON_INSIGHT_ADDED'
              }

              whatsNewObjects.push(whatsNewDoc)
            })

          })

          console.log(`no of insights + comps queried for ${person.userName} is ${whatsNewObjects.length}`)

        })

    }
  }

  async function checkIfWhatsNewObjectsAreSufficient() {
    //get the length of the whatsNewObjects
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
    await userDocRef.collection('whatsNewRecords').doc('totalNoOfWhatsNewItems').update({
      totalNoOfWhatsNewItems: admin.firestore.FieldValue.increment(noOfWhatsNewObjects)
    })
    await userDocRef.collection('whatsNewRecords').doc('noOfFollowedPersonUnReadWhatsNewItems').update({
      noOfFollowedPersonUnReadWhatsNewItems: admin.firestore.FieldValue.increment(noOfWhatsNewObjects)
    })

  }

  //Get more NoInsightAdded FollowedPeople to add Poke for Insights WhatsNewDocs
  //1. get the interestedPeople in order of people who have not added insights
  //2. Check if the user has already poked that person
  //3. If not check the person's poke for insights doc already exisits in the user's whatsNewDoc
  //4. If not then create a poke for insights whatsNewDoc and add it to the user's whatsNewCollection
  async function getNoInsightFollowedPeople() {
    //rearrange the items in the interestedPeople Array to have insightAdded == false first
    interestedPeople.sort(
      function (a, b) {
        return a.insightsAdded > b.insightsAdded ? 1 : -1
      }
    )
    //get the number of interestedPeople
    const noOfInterestedPeople = interestedPeople.length
    //get the number of excessInterestedPeople
    const excessNoOfInterestedPeopleForInsightPokes = noOfInterestedPeople - maxNumberOfPokeForInsightDocs
    //Assign the interestedPeople used for whatsNewDocs into noOfInterestedPeopleForInsights Array
    const interestedPeopleForInsights = interestedPeople
    //Remove all the excess number of interestedPeople from the Array
    interestedPeopleForInsights.splice(maxNumberOfPokeForInsightDocs, excessNoOfInterestedPeopleForInsightPokes)

    for (const person of interestedPeopleForInsights) {

          const personUid = person.uid
          const personUserName = person.userName
          const personName = person.name

          //check if this user hasnt already been poked by the user
          await db.collection('Users').doc(personUid)
            .collection('pokersForInsights').doc(userId)
            .get().then((userAsPokerDoc: DocumentSnapshot) => {
              //check if the user is not a poker
              if (!userAsPokerDoc.exists) {
                console.log(`${personUserName} has not been poked by the user`)
                //check if this person's poke for insights doc doesnt exist in the user's whatsNewColl
                userDocRef.collection('whatsNew')
                  .doc(personUid)
                  .get().then(
                    async (pokePersonForInsightWhatsNewDoc: DocumentSnapshot) => {
                      //check if there is no exisiting poke for insight whatsNewDoc
                      if ( pokePersonForInsightWhatsNewDoc.exists ) {
                        console.log(`${personUserName}'s poke for insights doc already exists in the user's whatsNewColl`)
                      } else {
                        console.log(`${personUserName}'s poke for insights doc does not exist in the user's whatsNewColl`)
                        //doesnt exist in the user's whatsNewColl so add it to the user's whatsNewColl
                        //create a whatsNewObject for this person
                        const whatsNewDoc = {
                          primaryProfileUid: personUid,
                          primaryProfileUserName: personUserName,
                          primaryProfileName: personName,
                          content: null,
                          contentQuestion: null,
                          hasImage: false,
                          secondaryProfileUid: null,
                          secondaryProfileUserName: null,
                          secondaryProfileName: null,
                          noOfLikes: null,
                          userLiked: null,
                          timestamp: Date.now(),
                          id: person.uid,
                          hasRead: false,
                          isFollowing: true,
                          contentType: 'POKE_FOR_INSIGHTS'
                        }
  
                        //push this poke for Insight to whatsNewColl after the checks
                        await userDocRef.collection('whatsNew').doc(whatsNewDoc.id).set(whatsNewDoc)
                      }
                  })
              } else {
                console.log(`${personUserName} has been poked already by the user`)
              }
            })

        }

  }

})