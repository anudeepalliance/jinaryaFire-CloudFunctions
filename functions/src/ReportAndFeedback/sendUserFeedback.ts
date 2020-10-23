import * as functions from 'firebase-functions'
const admin = require('firebase-admin')

// export function sendFeedback() 
  export const sendUserFeedback = functions.region('asia-east2').https.onCall((userFeedbackData, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated', 
        'only authenticated users can send feedback'
      )
    } else if (userFeedbackData.feedback.length > 30) {
      throw new functions.https.HttpsError(
        'invalid-argument', 
        'request must be no more than 30 characters long'
      )
     } 

     //A random id for the feedback document is generated here everytime a feedback 
     //is given instead of using a uid of the user so that if a user submits multiple feedbacks
     //then the previous feedback document should not be distrubed
    return admin.firestore().collection('Feedback').add({
        feedback : userFeedbackData.feedback,
        date: userFeedbackData.date,
        no_of_items: userFeedbackData.no_of_items,
        no_of_compliments_sent: userFeedbackData.no_of_compliments_sent,
        no_of_insights_added: userFeedbackData.no_of_insights_added,
        no_of_followers: userFeedbackData.no_of_followers,
        no_of_following: userFeedbackData.no_of_following,
        uid: context.auth.uid
     })
    
    
  })
