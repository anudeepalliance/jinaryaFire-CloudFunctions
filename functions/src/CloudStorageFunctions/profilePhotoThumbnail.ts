'use strict';
const functions = require('firebase-functions');
const admin = require('firebase-admin');

// const {Storage} = require('@google-cloud/storage');
// const gcs = new Storage()
// import { join, dirname } from 'path'

// import * as sharp from 'sharp'
const fs = require('fs');
const spawn = require('child-process-promise').spawn;
const path = require('path');
const os = require('os');

//When an Image is upload to Cloud Storage which can only be the profilePhotos of users,
//generate thumbnail and save it back to the same folder in Cloud Storage
export const profilePhotoMakeThumbnail = functions.region('asia-east2').storage.object().onFinalize( async object => {
    // The Storage bucket that contains the file.
    const fileBucket = object.bucket; 
    // File path in the bucket.
    const filePath = object.name; 
    // File content type.
    const contentType = object.contentType; 
    // Number of times metadata has been generated. New objects have a value of 1.
    // const metageneration = object.metageneration; 
  
    // [START stopConditions]
    // Exit if this is triggered on a file that is not an image.
    if (!contentType?.startsWith('image/')) {
      return console.log('This is not an image.');
    }
  
    // Get the file name.
    const fileName = path.basename(filePath);
    // Exit if the image is already a thumbnail.
    if (fileName.startsWith('thumb_')) {
      return console.log('Already a Thumbnail.');
    }
    // [END stopConditions]
  
    // [START thumbnailGeneration]
    // Download file from bucket.
    const bucket = admin.storage().bucket(fileBucket);
    const tempFilePath = path.join(os.tmpdir(), fileName);
    const metadata = {
      contentType: contentType,
    };
    await bucket.file(filePath).download({destination: tempFilePath});
    console.log('Image downloaded locally to', tempFilePath);
    // Generate a thumbnail using ImageMagick.
    await spawn('convert', [tempFilePath, '-thumbnail', '200x200>', tempFilePath]);
    console.log('Thumbnail created at', tempFilePath);
    // We add a 'thumb_' prefix to thumbnails file name. That's where we'll upload the thumbnail.
    const thumbFileName = `thumb_${fileName}`;
    const thumbFilePath = path.join(path.dirname(filePath), thumbFileName);
    // Uploading the thumbnail.
    await bucket.upload(tempFilePath, {
      destination: thumbFilePath,
      metadata: metadata,
    });
    // Once the thumbnail has been uploaded delete the local file to free up disk space.
    return fs.unlinkSync(tempFilePath);
    // [END thumbnailGeneration]
})
