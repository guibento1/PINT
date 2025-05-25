const path = require('path');

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
        const uploadBlobResponse = await blobClient.upload(fileBuffer, fileBuffer.length);

        console.log(`Uploaded image to blob "${blobName}" successfully.`, uploadBlobResponse);

        return blobClient.url;
    } catch (error) {
        console.error('Error uploading image to Azure Blob Storage:', error.message);
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

module.exports = { uploadFile, generateSASUrl };
