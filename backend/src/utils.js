const path = require('path');
const crypto = require('crypto');
const Mailgun = require('mailgun.js');
const formData = require('form-data');
const axios = require('axios');
const { GoogleAuth } = require('google-auth-library');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { 
  BlobServiceClient, 
  StorageSharedKeyCredential, 
  BlobClient,
  generateBlobSASQueryParameters, 
  BlobSASPermissions } = require('@azure/storage-blob');


const accountName = process.env.AZURESTORAGE_ACCOUNTNAME; 
const accountKey = process.env.AZURESTORAGE_KEY;


const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
const blobServiceClient = new BlobServiceClient(`https://${accountName}.blob.core.windows.net`, sharedKeyCredential);

async function uploadFile(fileBuffer, blobName, containerName) {
    try {

        const containerClient = blobServiceClient.getContainerClient(containerName);
        const blobClient = containerClient.getBlockBlobClient(blobName);
        const uploadBlobResponse = await blobClient.upload(fileBuffer, fileBuffer.length,{});

        console.log(`Uploaded image to blob "${blobName}" successfully.`, uploadBlobResponse);

        return blobClient.url;
    } catch (error) {
        console.error('Error uploading image to Azure Blob Storage:', error.message);
        throw error;
    }
}


async function updateFile(file,  container, existingBlob = null, allowedFileExtensions = null) {


    if (!file || !file.buffer || !file.originalname) {
        throw 'Invalid file object';
    }

    try {
        if (existingBlob !== null) {
            try {
                await deleteFile(existingBlob, container);
            } catch (error) {
                console.error(`Error deleting existing file: ${error}`);
                throw error;
            }
        }

        const fileBuffer = file.buffer;
        const originalFileName = file.originalname;
        const fileExtension = path.extname(originalFileName).toLowerCase();

        if (allowedFileExtensions != null && !allowedFileExtensions.includes(fileExtension)) {
            throw `Profile Pic must be one of the following: ${allowedfileExtensions.join(", ")}`;
        }

        const blobName = crypto.randomBytes(16).toString('hex').slice(0, 16) + fileExtension;

        try {
            await uploadFile(fileBuffer, blobName, container);
        } catch (error) {
            console.error(`Error uploading file: ${error}`);
            throw error;
        }

        return blobName;
    } catch (error) {
        console.error(`Error uploading file: ${error}`);
        throw error;
    }
}

async function generateSASUrl(blobName, containerName) {

    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobClient = containerClient.getBlobClient(blobName);

    const permissions = BlobSASPermissions.parse("r"); 

    const expiresOn = new Date();
    expiresOn.setHours(expiresOn.getHours() + 1);  

    const sasToken = generateBlobSASQueryParameters(
        {
            containerName,
            blobName,
            permissions,
            expiresOn,
        },
        sharedKeyCredential
    ).toString();

    const sasUrl = `${blobClient.url}?${sasToken}`;
    return sasUrl; 

}

async function deleteFile(blobName, containerName) {
    try {
        const containerClient = blobServiceClient.getContainerClient(containerName);
        const blobClient = containerClient.getBlockBlobClient(blobName);

        const deleteBlobResponse = await blobClient.delete({
            conditions: {
                permanentDelete: true,
            },
        });

    } catch (error) {
        console.error('Error permanently deleting blob from Azure Blob Storage:', error.message);
        throw error;
    }
}




const mailgun = new Mailgun(formData);

const client = mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_APIKEY,
  url: 'https://api.eu.mailgun.net'
});

async function sendEmail(data) {

  data.from = `TheSoftSkill Team <noreply@${process.env.MAILGUN_DOMAIN}>`;
  const response = await client.messages.create(process.env.MAILGUN_DOMAIN, data);

}

// Firebase


async function getGoogleAuthToken() {

  const serviceAccountJsonString = process.env.GOOGLE_OAUTH2_KEY;

  if (!serviceAccountJsonString) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON environment variable is not set.');
  }

  const credentials = JSON.parse(serviceAccountJsonString);

  const auth = new GoogleAuth({
    credentials: credentials, 
    scopes: 'https://www.googleapis.com/auth/firebase.messaging',
  });

  const client = await auth.getClient();
  const accessToken = await client.getAccessToken();
  return accessToken.token;
}


async function sendFCMNotification(topic, title, body, imageUrl = null) {
  try {

    if (typeof topic !== 'string' || typeof title !== 'string' || typeof body !== 'string') {
      throw new Error('Invalid input data types');
    }

    const accessToken = await getGoogleAuthToken();
    const fcmEndpoint = `https://fcm.googleapis.com/v1/projects/thesoftskills-2025/messages:send`;

    const messagePayload = {
      message: {
        topic: topic,
        notification: {
          title: title,
          body: body,
        },
      },
    };

    //console.log(messagePayload);

    if (imageUrl) {
      messagePayload.message.notification.imageUrl = imageUrl;
    }

    const response = await axios.post(fcmEndpoint, messagePayload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error sending FCM notification:', error.response.data.error.details);
    throw error;
  }
}

module.exports = { uploadFile, deleteFile, updateFile, generateSASUrl, sendEmail, sendFCMNotification };
