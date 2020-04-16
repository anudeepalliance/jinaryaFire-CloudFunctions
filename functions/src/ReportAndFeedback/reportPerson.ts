import * as functions from 'firebase-functions'
const admin = require('firebase-admin')

// export function reportUser() 
  export const reportThePerson = functions.region('asia-east2').https.onCall((userReportData, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated', 
        'only authenticated users can send feedback'
      )
    } 

     //A random id for the report document is generated here everytime a report is filed
     //instead of using a uid of the reporter or reportee so that if a user reports
     //multiple times then the previous report  document should not be distrubed
    return admin.firestore().collection('UserReports').add({
        reporteeUid : userReportData.reporteeUid,
        reportCategory: userReportData.reportCategory,
        reporterUid: context.auth.uid,
        date: userReportData.date
     })
    
    
  })
