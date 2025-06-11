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

const deleteFromCloudinary = async (publicId, resource_type="image") => {
    try {
        if(!publicId) return null; // If no public ID is provided, return null
        // if (!publicId) {
        //     console.warn("deleteFromCloudinary called with null publicId");
        //     return null;
        // }
        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: resource_type, // Automatically detect the resource type
        });
        console.log("File deleted successfully from Cloudinary:", result);
        return result; // Return the result containing the deletion status
    } catch (error) {
        console.error("Error deleting file from Cloudinary:", error);
        return null; // Return null in case of an error
    }
}

export { uploadOnCloudinary, deleteFromCloudinary };