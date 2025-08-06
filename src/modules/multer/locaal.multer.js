import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ImageUploader = multer({
   storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const productId = req.params.id || req.query.productId;
      
  const productFolder = path.join(`./uploads/product_Images/${productId}`);
  
      if (!fs.existsSync(productFolder)) {
        fs.mkdirSync(productFolder, { recursive: true });
      }
      
      cb(null, productFolder);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `img-${Date.now()}${ext}`);
    }
  }), 
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    cb(null, allowedTypes.includes(file.mimetype));
  },
  limits: { fileSize: 15 * 1024 * 1024 } 
}); 