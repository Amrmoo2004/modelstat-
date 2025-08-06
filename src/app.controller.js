import  express from 'express';
import { connectDB } from "./modules/DB/db.connection.js";
import { globalErrorHandler } from './modules/utilities/response/response.js';
import  authcontroller from './modules/auth/auth.controller.js';
import categorycontroller from './modules/category/category.controller.js';
import usercontroller from './modules/user/user.controller.js';
import productcontroller from "./modules/products/products.controller.js"
import * as dotenv from 'dotenv';
import path from 'path';
import cors from 'cors';
import compression from 'compression';



// Load .env file from root directory
dotenv.config({  });


const app = express();  
app.use
app.use(cors())
app.use(compression());
const port = process.env.PORT 
export const bootstrap =async () => {
app.get('/', (req, res) => {
  res.send('API is working!'); 
});
  await connectDB();

    app.use(express.json());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")))
    app.use('/categories', categorycontroller);
    app.use('/products', productcontroller);

  app.use('/auth', authcontroller);
   app.use('/user', usercontroller);

   app.use (globalErrorHandler);
// app.use(asynchandler)
app.use('/upload', (req, res) => {
  res.json({
    success: true,
    files: req.uploadResults
  });
});
  return app.listen(port, () => {
    console.log(`🚀 Server is running at http://localhost:${port}`);
  });
};
