const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orders/order');

router.post('/placeOrder', orderController.createOrder);
router.post('/createStripeSession', orderController.createStripeCheckoutSession);
router.get('/:id', orderController.getOrderById);
router.get('/', orderController.getAllOrders);
router.put('/:id', orderController.updateOrderStatus);
router.delete('/:id', orderController.deleteOrder);

module.exports = router;
