import  express from 'express';
import { connectDB } from "./modules/DB/db.connection.js";
import { globalErrorHandler } from './modules/utilities/response/response.js';
import  authcontroller from './modules/auth/auth.controller.js';
import categorycontroller from './modules/category/category.controller.js';
import usercontroller from './modules/user/user.controller.js';
import productcontroller from "./modules/products/products.controller.js"
import cartcontroller from './modules/cart/cart.controller.js'
import admincontroller from './modules/admin/admin.controller.js'
import checkoutcontroller from './modules/checkout/checkout.controller.js';
import * as dotenv from 'dotenv';
import path from 'path';
import cors from 'cors';
import compression from 'compression';
import MongoStore from 'connect-mongo';
import session from 'express-session';  
import cookieParser from 'cookie-parser';



dotenv.config({  });


const app = express();  
const corsOptions = {
origin:'*', // Allow all origins or specify your frontend URL
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true, // Required for cookies/sessions
  optionsSuccessStatus: 204
};
app.use(cors(corsOptions));
app.use(cookieParser());

app.use(session({
  store: MongoStore.create({ mongoUrl: process.env.URL_DATABASE }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 14 * 24 * 60 * 60 * 1000 // 14 days
  }
}));
app.use(express.json());
app.use(compression());

const port = process.env.PORT 
export const bootstrap =async () => {
app.get('/', (req, res) => {
  res.send('API is working!'); 
});
  await connectDB();


    app.use(express.json());
    app.use((req, res, next) => {
  req.socket.on('error', (err) => {
    console.error('Request socket error:', err);
  });
  next();
});
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")))
    app.use('/categories', categorycontroller);
    app.use('/products', productcontroller);

  app.use('/auth', authcontroller);
   app.use('/user', usercontroller);
   app.use('/cart',cartcontroller  );
   app.use ('/user',usercontroller)
app.use(express.urlencoded({ extended: true }));
app.use ('/admin',admincontroller)
app.use('/checkout', checkoutcontroller);
   app.use (globalErrorHandler);

  return app.listen(port, () => {
    console.log(`🚀 Server is running at http://localhost:${port}`);
  });
};
