const path = require("path");
const crypto = require("crypto");
const Mailgun = require("mailgun.js");
const formData = require("form-data");
const axios = require("axios");
const { GoogleAuth } = require("google-auth-library");
const logger = require("./logger");
const firebaseAdmin = require("../config/firebaseAdmin.js");

var initModels = require("./models/init-models.js");
var db = require("./database.js");
var models = initModels(db);

require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

function isLink(str) {
  try {
    new URL(str);
    return true;
  } catch (error) {
    return false;
  }
}

const {
  BlobServiceClient,
  StorageSharedKeyCredential,
  BlobClient,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
} = require("@azure/storage-blob");

const accountName = process.env.AZURESTORAGE_ACCOUNTNAME;
const accountKey = process.env.AZURESTORAGE_KEY;

if (!accountName || !accountKey) {
  logger.warn(
    "Azure Storage account name or key is missing. Blob operations may fail."
  );
}

const sharedKeyCredential = new StorageSharedKeyCredential(
  accountName,
  accountKey
);
const blobServiceClient = new BlobServiceClient(
  `https://${accountName}.blob.core.windows.net`,
  sharedKeyCredential
);

async function uploadFile(fileBuffer, blobName, containerName) {
  try {
    logger.debug(
      `Attempting to upload blob "${blobName}" to container "${containerName}".`
    );
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobClient = containerClient.getBlockBlobClient(blobName);
    const uploadBlobResponse = await blobClient.upload(
      fileBuffer,
      fileBuffer.length,
      {}
    );

    logger.info(
      `Uploaded image to blob "${blobName}" in container "${containerName}" successfully.`,
      {
        eTag: uploadBlobResponse.eTag,
        lastModified: uploadBlobResponse.lastModified,
        blobUrl: blobClient.url,
      }
    );

    return blobClient.url;
  } catch (error) {
    logger.error(
      `Error uploading image to Azure Blob Storage: ${error.message}`,
      {
        blobName,
        containerName,
        stack: error.stack,
      }
    );
    throw error;
  }
}

async function updateFile(
  file,
  container,
  existingBlob = null,
  allowedFileExtensions = null
) {
  if (!file || !file.buffer || !file.originalname) {
    logger.warn("Invalid file object provided for updateFile function.", {
      file: file || "null",
    });
    throw new Error("Invalid file object");
  }

  try {
    if (existingBlob !== null) {
      logger.info(
        `Attempting to delete existing blob: "${existingBlob}" from container "${container}" for update.`
      );
      try {
        await deleteFile(existingBlob, container);
        logger.info(`Successfully deleted existing blob: "${existingBlob}".`);
      } catch (error) {
        logger.error(
          `Error deleting existing file "${existingBlob}" during update process: ${error.message}`,
          {
            blobToDelete: existingBlob,
            container,
            stack: error.stack,
          }
        );
        throw error;
      }
    }

    const fileBuffer = file.buffer;
    const originalFileName = file.originalname;
    const fileExtension = path.extname(originalFileName).toLowerCase();

    if (
      allowedFileExtensions != null &&
      !allowedFileExtensions.includes(fileExtension)
    ) {
      logger.warn(
        `Attempted to upload file with disallowed extension: "${fileExtension}".`,
        {
          originalFileName,
          allowedExtensions: allowedFileExtensions,
        }
      );
      throw new Error(
        `Profile Pic must be one of the following: ${allowedFileExtensions.join(
          ", "
        )}`
      );
    }

    const blobName =
      crypto.randomBytes(16).toString("hex").slice(0, 16) + fileExtension;
    logger.debug(
      `Generated new blob name: "${blobName}" for file: "${originalFileName}".`
    );

    try {
      await uploadFile(fileBuffer, blobName, container);
      logger.info(
        `Successfully uploaded new file "${blobName}" during update.`
      );
    } catch (error) {
      logger.error(
        `Error uploading new file "${blobName}" during update process: ${error.message}`,
        {
          originalFileName,
          container,
          stack: error.stack,
        }
      );
      throw error;
    }

    return blobName;
  } catch (error) {
    logger.error(`General error in updateFile function: ${error.message}`, {
      fileName: file.originalname,
      container,
      existingBlob,
      stack: error.stack,
    });
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
    logger.debug(
      `Attempting to delete blob "${blobName}" from container "${containerName}".`
    );
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobClient = containerClient.getBlockBlobClient(blobName);

    const deleteBlobResponse = await blobClient.delete({
      conditions: {
        permanentDelete: true,
      },
    });
    logger.info(
      `Successfully deleted blob "${blobName}" from container "${containerName}".`,
      {
        requestId: deleteBlobResponse.requestId,
      }
    );
  } catch (error) {
    logger.error(
      `Error permanently deleting blob "${blobName}" from Azure Blob Storage: ${error.message}`,
      {
        blobName,
        containerName,
        stack: error.stack,
      }
    );
    throw error;
  }
}

const mailgun = new Mailgun(formData);

const client = mailgun.client({
  username: "api",
  key: process.env.MAILGUN_APIKEY,
  url: "https://api.eu.mailgun.net",
});

if (!process.env.MAILGUN_APIKEY || !process.env.MAILGUN_DOMAIN) {
  logger.warn("Mailgun API key or domain is missing. Email sending may fail.");
}

async function sendEmail(data) {
  try {
    data.from = `TheSoftSkill Team <noreply@${process.env.MAILGUN_DOMAIN}>`;
    logger.info(
      `Attempting to send email to: "${data.to}" with subject: "${data.subject}"`
    );
    const response = await client.messages.create(
      process.env.MAILGUN_DOMAIN,
      data
    );
    logger.info(`Email sent successfully to: "${data.to}".`, {
      id: response.id,
      message: response.message,
    });
    return response;
  } catch (error) {
    logger.error(
      `Error sending email to: "${data.to}" with subject: "${data.subject}": ${error.message}`,
      {
        recipient: data.to,
        subject: data.subject,
        errorDetails: error.response ? error.response.data : error.message,
        stack: error.stack,
      }
    );
    throw error;
  }
}

// Firebase

async function getGoogleAuthToken() {
  const serviceAccountJsonString = process.env.GOOGLE_OAUTH2_KEY;

  if (!serviceAccountJsonString) {
    logger.error(
      "GOOGLE_OAUTH2_KEY environment variable is not set. Cannot obtain Google Auth Token."
    );
    throw new Error(
      "GOOGLE_SERVICE_ACCOUNT_JSON environment variable is not set."
    );
  }

  try {
    const credentials = JSON.parse(serviceAccountJsonString);
    const auth = new GoogleAuth({
      credentials: credentials,
      scopes: "https://www.googleapis.com/auth/firebase.messaging",
    });

    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();
    logger.debug("Successfully obtained Google OAuth2 Access Token.");
    return accessToken.token;
  } catch (error) {
    logger.error(
      `Error parsing Google Service Account JSON or getting auth token: ${error.message}`,
      {
        stack: error.stack,
      }
    );
    throw error;
  }
}

async function sendNotification(topic, title, body, imageUrl = null) {
  try {
    const topicFormated = "canal_" + topic;

    const message = {
      notification: {
        title,
        body,
        ...(imageUrl && { imageUrl }),
      },
      topic: topicFormated,
    };

    logger.debug("FCM message payload:", message);

    const response = await firebaseAdmin.messaging().send(message);

    console.log(response);

    logger.info(`FCM notification sent successfully to topic: "${topic}".`, {
      messageId: response,
    });

    const insertData = {
      canal: topic,
      titulo: title,
      conteudo: body,
    };

    const createdRow = await models.historiconotificacoes.create(insertData);

    return response;
  } catch (error) {
    logger.error(
      `Error sending FCM notification to topic "${topic}": ${error.message}`,
      {
        topic,
        title,
        body,
        stack: error.stack,
      }
    );
  }
}

async function sendNotificationToUtilizador(
  utilizador,
  title,
  body,
  imageUrl = null
) {
  try {
    let utilizadorDeviceTokens = await models.utilizadordispositivos.findAll({
      where: { utilizador },
    });
    const tokens = utilizadorDeviceTokens
      .map((t) => t.dispositivo)
      .filter(Boolean);

    if (!Array.isArray(tokens) || tokens.length === 0) {
      logger.warn("No device tokens found for utilizador", { utilizador });
      return { successCount: 0, failureCount: 0 };
    }

    if (typeof title !== "string" || typeof body !== "string") {
      logger.warn("Invalid input data types for FCM notification.", {
        title,
        body,
      });
      throw new Error("Invalid input data types");
    }

    const insertData = {
      utilizador,
      titulo: title,
      conteudo: body,
    };
    await models.historiconotificacoesprivadas.create(insertData);

    let successCount = 0;
    let failureCount = 0;
    const invalidTokens = [];

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const message = {
        notification: {
          title,
          body,
          ...(imageUrl && { imageUrl }),
        },
        token,
      };
      try {
        await firebaseAdmin.messaging().send(message);
        successCount++;
      } catch (error) {
        const errorCode = error && error.code;
        if (
          errorCode === "messaging/registration-token-not-registered" ||
          errorCode === "messaging/invalid-registration-token"
        ) {
          invalidTokens.push(token);
        }
        logger.error(
          `Error sending notification to token "${token}": ${error.message}`,
          {
            token,
            title,
            body,
            errorCode,
          }
        );
        failureCount++;
      }
    }

    if (invalidTokens.length > 0) {
      await models.utilizadordispositivos.destroy({
        where: { dispositivo: invalidTokens },
      });
      logger.info(`Removed invalid tokens: ${invalidTokens.join(", ")}`);
    }

    logger.info(
      `FCM notifications sent to devices. Successes: ${successCount}, Failures: ${failureCount}`
    );
    return {
      successCount,
      failureCount,
    };
  } catch (error) {
    logger.error(`Error sending FCM notification: ${error.message}`, {
      title,
      body,
      stack: error.stack,
    });
    throw error;
  }
}

async function subscribeToCanal(deviceTokens, topic) {
  const topicFormated = "canal_" + topic;
  // Aceita string ou array
  const tokens = Array.isArray(deviceTokens) ? deviceTokens : [deviceTokens];
  if (tokens.length === 0) return true;
  try {
    const response = await firebaseAdmin
      .messaging()
      .subscribeToTopic(tokens, topicFormated);
    const success = !response.errors || response.errors.length === 0;
    logger.info(`Subscribed token(s) to topic "${topicFormated}".`, {
      success,
      tokens,
    });
    return success;
  } catch (error) {
    logger.error(
      `Error subscribing tokens to topic "${topicFormated}": ${error.message}`,
      {
        tokens,
        stack: error.stack,
      }
    );
    throw error;
  }
}

async function subscribeUtilizadorToCanal(utilizador, topic) {
  try {
    let utilizadorDeviceTokens = await models.utilizadordispositivos.findAll({
      where: { utilizador },
    });

    for (const utilizadorDeviceToken of utilizadorDeviceTokens) {
      try {
        const success = await subscribeToCanal(
          utilizadorDeviceToken.dispositivo,
          topic
        );
        if (!success) {
          utilizadorDeviceToken.destroy();
        }
      } catch (error) {
        logger.error(
          `Error sending notification to token "${token}": ${error.message}`,
          {
            token,
            stack: error.stack,
          }
        );
      }
    }

    logger.info(`Utilizador subscrito no topico.`);
  } catch (error) {
    logger.error(`Error sending FCM notification: ${error.message}`, {
      stack: error.stack,
    });
    throw error;
  }
}

async function unsubscribeFromCanal(deviceTokens, topic) {
  const topicFormated = "canal_" + topic;
  const tokens = Array.isArray(deviceTokens) ? deviceTokens : [deviceTokens];
  if (tokens.length === 0) return true;
  try {
    const response = await firebaseAdmin
      .messaging()
      .unsubscribeFromTopic(tokens, topicFormated);
    const success = !response.errors || response.errors.length === 0;
    logger.info(`Unsubscribed token(s) from topic "${topic}".`, {
      success,
      tokens,
    });
    return success;
  } catch (error) {
    logger.error(
      `Error unsubscribing tokens from topic "${topic}": ${error.message}`,
      {
        tokens,
        stack: error.stack,
      }
    );
    throw error;
  }
}

async function unsubscribeUtilizadorToCanal(utilizador, topic) {
  try {
    let utilizadorDeviceTokens = await models.utilizadordispositivos.findAll({
      where: { utilizador },
    });

    for (const utilizadorDeviceToken of utilizadorDeviceTokens) {
      try {
        const success = await unsubscribeFromCanal(
          utilizadorDeviceToken.dispositivo,
          topic
        );
        if (!success) {
          utilizadorDeviceToken.destroy();
        }
      } catch (error) {
        logger.error(
          `Error sending notification to token "${token}": ${error.message}`,
          {
            token,
            stack: error.stack,
          }
        );
        failureCount++;
      }
    }

    logger.info(`Utilizador desinscrito no topico.`);
  } catch (error) {
    logger.error(`Error sending FCM notification: ${error.message}`, {
      stack: error.stack,
    });
    throw error;
  }
}

module.exports = {
  isLink,
  uploadFile,
  deleteFile,
  updateFile,
  generateSASUrl,
  sendEmail,
  sendNotification,
  sendNotificationToUtilizador,
  subscribeToCanal,
  unsubscribeFromCanal,
  subscribeUtilizadorToCanal,
  unsubscribeUtilizadorToCanal,
};
