import * as functions from 'firebase-functions'
const admin = require('firebase-admin')

// export function reportUser() 
  export const reportTheContent = functions.region('asia-east2').https.onCall((userReportContentData, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated', 
        'only authenticated users can send feedback'
      )
    } 

     //A random id for the report document is generated here everytime a report is filed
     //instead of using a uid of the reporter or reportee so that if a user reports
     //multiple times then the previous report  document should not be distrubed
    return admin.firestore().collection('ReportContent').add({
        //grab all the fields from the data sent by the client and add it to Firestore Doc
        content : userReportContentData.content,
        ownerUid : userReportContentData.ownerUid,
        receiverUid : userReportContentData.receiverUid,
        sentTime : userReportContentData.sentTime,
        contentCategory : userReportContentData.contentCategory,
        noOfLikes : userReportContentData.noOfLikes,
        noOfViews : userReportContentData.noOfViews,
        contentId : userReportContentData.contentId,
        reportedTime : userReportContentData.reportedTime,
        reportCategory : userReportContentData.reportCategory
     })
    
    
  })
