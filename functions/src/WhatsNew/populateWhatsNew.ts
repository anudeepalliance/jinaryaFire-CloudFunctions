import * as functions from 'firebase-functions'
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore'
const admin = require('firebase-admin')
const utilityFunctions =  require('frequentFunctions')


//Populate the WhatsNewSubColl of the user as less than 20 unRead items
//are present currently in his WhatsNewSubColl
export const populateTheWhatsNew = functions.region('asia-east2').https.onCall((complimentData, context) => {

    

})