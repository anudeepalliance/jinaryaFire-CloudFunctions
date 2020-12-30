import * as functions from 'firebase-functions'

export const logDataSentByClient = functions.region('asia-south1').https.onCall((listOfInterestedUids, context) => {

    return logTheData()


    async function logTheData() {

        for ( const uid of listOfInterestedUids ) {
            console.log(`uid is ${uid.toString()}`)
        }
    }

})