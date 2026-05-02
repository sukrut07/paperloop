import pinataSDK from '@pinata/sdk';
import dotenv from 'dotenv';

dotenv.config();

const pinata = new pinataSDK(
  process.env.PINATA_API_KEY,
  process.env.PINATA_SECRET_API_KEY
);

export const uploadToIPFS = async (data: any) => {
  try {
    const result = await pinata.pinJSONToIPFS(data);
    return result.IpfsHash;
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    throw error;
  }
};

export const uploadFileToIPFS = async (fileStream: any) => {
  try {
    const result = await pinata.pinFileToIPFS(fileStream);
    return result.IpfsHash;
  } catch (error) {
    console.error('Error uploading file to IPFS:', error);
    throw error;
  }
};
