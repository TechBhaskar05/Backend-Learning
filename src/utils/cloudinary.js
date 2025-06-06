import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath)  return null; // If no file path is provided, return null
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'auto', // Automatically detect the resource type (image, video, etc.)
        })
        //file has been uploaded successfully
        console.log("File uploaded successfully to Cloudinary:", response.url);
        fs.unlinkSync(localFilePath); // Delete the file from local storage after upload
        // console.log("response: ", response);// For understanding the response structure
        
        return response; // Return the response containing the Cloudinary URL and other details
    } catch (error) {
        fs.unlinkSync(localFilePath); // Delete the file from local storage even if upload fails
        console.error("Error uploading file to Cloudinary:", error);
        return null; // Return null in case of an error
    }
}

export { uploadOnCloudinary };