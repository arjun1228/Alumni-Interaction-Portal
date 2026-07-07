import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.resolve(__dirname, '../uploads');

// Synchronously ensure uploads directory is initialized
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;
const isCloudinaryConfigured = !!(cloudName && apiKey && apiSecret && cloudName !== 'your_cloud_name');

if (isCloudinaryConfigured) {
    console.log(`✅ Cloudinary configured — cloud_name: ${cloudName}`);
} else {
    console.warn('⚠️ Cloudinary credentials missing. Image uploads will fall back to local disk storage.');
}

export const uploadMedia = (fileBuffer, filename) => {
    return new Promise((resolve, reject) => {
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
        const apiKey = process.env.CLOUDINARY_API_KEY;
        const apiSecret = process.env.CLOUDINARY_API_SECRET;

        // Check if Cloudinary is configured
        const isCloudinaryConfigured = cloudName && apiKey && apiSecret && cloudName !== 'your_cloud_name';

        if (isCloudinaryConfigured) {
            cloudinary.config({
                cloud_name: cloudName,
                api_key: apiKey,
                api_secret: apiSecret
            });

            // Extract public ID from filename
            const cleanName = path.parse(filename).name.replace(/[^a-zA-Z0-9]/g, '_');

            const stream = cloudinary.uploader.upload_stream(
                { folder: 'alumniconnect', public_id: `${cleanName}-${Date.now()}` },
                (error, result) => {
                    if (error) {
                        console.warn('⚠️ Cloudinary stream upload failed, falling back to local storage:', error.message);
                        saveLocal(fileBuffer, filename).then(resolve).catch(reject);
                    } else {
                        resolve({ url: result.secure_url });
                    }
                }
            );
            stream.end(fileBuffer);
        } else {
            saveLocal(fileBuffer, filename).then(resolve).catch(reject);
        }
    });
};

const saveLocal = async (fileBuffer, filename) => {
    try {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(filename);
        const base = path.basename(filename, ext).replace(/[^a-zA-Z0-9]/g, '_');
        const finalFilename = `${base}-${uniqueSuffix}${ext}`;
        const filePath = path.join(UPLOADS_DIR, finalFilename);

        await fs.promises.writeFile(filePath, fileBuffer);
        return { url: `/uploads/${finalFilename}` };
    } catch (err) {
        console.error('❌ Failed to save file locally:', err);
        throw err;
    }
};
