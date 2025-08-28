import { Router } from "express";
import * as offers from "./offers.services.js";
import { authUser } from "../middleware/authentaction.js";
import checkTokenRevoked from "../middleware/Check Tokens.js";
import { isAuthorized } from "../middleware/allowed.js";

const router = Router();
router.post('/:id/apply', 
  authUser, 
  isAuthorized(["admin", "Admin", "system"]), 
  checkTokenRevoked, 
  offers.addOrUpdateOffer
);

router.delete('/:id/remove/:offerId',
  authUser,
  isAuthorized(["admin", "Admin", "system"]), 
  checkTokenRevoked,
  offers.removeOffer
);

router.get('/product-offers/:id', offers.getProductOffers);
router.get('/offer-details/:id/:offerId', offers.getOfferById);
router.get('/products-with-offers', offers.getProductsWithActiveOffers);

router.patch('/:id/update/:offerId',
  authUser,
  isAuthorized(["admin", "Admin", "system"]), 
  checkTokenRevoked, 
  offers.updateOffer
);

router.post('/bulk-apply',
  authUser,
  isAuthorized(["admin", "Admin", "system"]), 
  checkTokenRevoked, 
  offers.applyBulkOffers
);


export default router;