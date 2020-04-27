import * as functions from 'firebase-functions'

const {Storage} = require('@google-cloud/storage');
const gcs = new Storage()

import { tmpdir } from 'os'
import { join, dirname } from 'path'

import * as sharp from 'sharp'
import * as fs from 'fs-extra'

//When an Image is upload to Cloud Storage which can only be the profilePhotos of users,
//generate thumbnail and save it back to the same folder in Cloud Storage
export const profilePhotoMakeThumbnail = functions.storage.object().onFinalize( async object => {
    //The storage bucket
    const bucket = gcs.bucket(object.bucket)
    //The file path of the image uploaded
    const filePath = object.name
    //The filName of the object, the pop() method removes the last elements from
    //an Array and returns it as String
    const fileName = filePath?.split('/').pop()
    //The directory of the bucket
    const bucketDir = dirname(filePath!!.toString())

    //Create a working directory in the temporary directory called 'thumbs'
    const workingDir = join(tmpdir(), 'thumbs')
    //Get the temporary filePath to the image that we will download and name it 'source.png'
    const timeSourceFilePath = join(workingDir, 'source.png')

    //Make a sanity check ensuring this isnt an image uploaded to cloud storage via this cloud
    //function itself which can end in an infinite loop of functions
    if ( fileName?.toString().includes('thumbnail') || !object.contentType?.includes('image') )  {
            console.log('exiting function as it is a thumbnail image or may not be an image at all')
            return false
    }

    //check if Thumbnail working directory exists in the function
    await fs.ensureDir(workingDir)

    //Download the source file from Cloud Storage
    await bucket.file(filePath).download({
        destination: timeSourceFilePath
    })

    //select the size for the resize
    const thumbnailSize = [64]

    //Define an upload promise
    const promise = thumbnailSize.map( async size => {
        
        //set the name for the thumbnail image
        const thumbName = `thumbnail${size}_${fileName}`
        //set the place to where the thumbnail should be saved which is the working Directory
        const thumbPath = join(workingDir, thumbName)

        //Now that name and save directory is defined, do the resizing
        await sharp(timeSourceFilePath).resize(size, size).toFile(thumbPath)

        //upload the thumbnail image from the working directory thumbpath to the 
        //Cloud storage directory bucketDir
        return bucket.upload(thumbPath, {
            destination: join(bucketDir, thumbName)
        })


    })

    //run the upload operations
    await Promise.all(promise)

    //Clean up remove the tmp/thumbs from the filesystem
    return fs.remove(workingDir)
})
