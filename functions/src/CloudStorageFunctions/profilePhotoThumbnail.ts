'use strict'
const functions = require('firebase-functions')
const admin = require('firebase-admin')
const spawn = require('child-process-promise').spawn;
const path = require('path')
const os = require('os')
const fs = require('fs')


export const profilePhotoMakeThumbnail = functions.region('asia-east2').storage.object()
.onFinalize(async (object: { bucket: any; name: any; contentType: any; }) => {
  
  //The Storage bucket in Cloud Storage that contains the file
  const cloudStorageFileBucket = object.bucket
  //File path in the Storage bucket
  const cloudStorageRawImageFilePath = object.name
  //Get the File content type (it has to be an image which we will check later)
  const rawImageContentType = object.contentType
   // Number of times metadata has been generated. New Images/Objects will have a value of 1
  // const metageneration = object.metageneration
  
  const folderPath = cloudStorageRawImageFilePath.toString()
  const photoOwnerUid = 
    folderPath.substring(folderPath.indexOf("/") + 1, folderPath.lastIndexOf("/"))

  //Exit if this is triggered on a file that is not an image
  if (!rawImageContentType.startsWith('image/')) {
    console.log('This is not an image.')
    return false
  }

  //Get the file name

  const fileName = path.basename(cloudStorageRawImageFilePath)
  //Exit if the image is already a thumbnail
  if (fileName.startsWith('thumb')) {
    console.log('Already a Thumbnail.')
    return false
  }
  

  
  //Initiate an admin access to the storage bucket
  const bucket = admin.storage().bucket(cloudStorageFileBucket)
  //Create a temporary filePath with the temporary directory and a filName
  //same as the source Image fileName
  //os.tmpdir() probably creates the temporary directory and path.join
  //must be joining the temp dir with the fileName
  const tempFilePath = path.join(os.tmpdir(), fileName)
  //create a metada JSON object which is just a contentType field that has
  //been extracted previously
  const metadata = {
    contentType: rawImageContentType
  }

  // Download the Image file from the storage bucket to the temporary filePath
  //which is in the temporary directoy
  await bucket.file(cloudStorageRawImageFilePath).download({destination: tempFilePath})
  console.log('Image downloaded locally to', tempFilePath)
  console.log(`the uid of the photo Owner is ${photoOwnerUid}`)

  //Generate a thumbnail using ImageMagick with its path as the temporary filePath
  await spawn('convert', [tempFilePath, '-thumbnail', '100x100>', tempFilePath])
  console.log('Thumbnail created at', tempFilePath)
  //Add a prefix called 'thumb_' to thumbnail file name, the final name has to be the same as the 
  //one in the client as the client looks for the file with the Filename
  const thumbFileName = `thumb_100x100_${fileName}`
  
  //Get a reference to a FilePath that this thumbnail file needs to be uploaded to,
  const thumbFilePath = path.join(
    //It needs to be uploaded to the Cloud Storage directory which is the same as the Raw Image
    //So get that directory
    path.dirname(cloudStorageRawImageFilePath), 
    //Append the fileName to the directory so it becomes a filePath
    thumbFileName)
  
    await bucket.upload(tempFilePath, {
      destination: thumbFilePath, metadata: metadata,
    })

  // // Upload the thumbnail to the thumbFilePath created above
  // const uploadTask = await bucket.upload(tempFilePath, {
  //   destination: thumbFilePath, metadata: metadata,
  // })

  // const downloadUrl = uploadTask[0].metada.mediaLink
  // admin.firestore().collection('Users').doc(photoOwnerUid).update({
  //   thumbnailUrl : downloadUrl.toString()
  // })

  //get a string url reference to the thumbnail Image
  // const thumbnailPath = `profilePhotos/${photoOwnerUid}/thumb_100x100_profilePhoto`
  //push the Download Url of this thumbnail image to the user doc of the owner
  // await bucket.file(thumbFileName).getSignedUrl({
  //   action: 'read',
  //   expires: '03-09-2491'
  // }).then((signedUrls: { toString: () => any; }[]) => {
  //     return admin.firestore().collection('Users').doc(photoOwnerUid).update({
  //       thumbnailUrl : signedUrls[0].toString()
  //     })
  //   })

  // Once the thumbnail has been uploaded delete the local file to free up disk space
  return fs.unlinkSync(tempFilePath)

})