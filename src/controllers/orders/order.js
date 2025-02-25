const Order = require('../../models/orders/order');
const Product = require('../../models/products/Products'); // Import Product Model
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { sendOrderConfirmationEmail } = require('../../helpers/utils');

// Create Order (Handles Multiple Products & Validates Product IDs)
exports.createOrder = async (req, res) => {
  try {
    const { name, email, phone, address, country, city, zip, shippingMethod, products, totalAmount } = req.body;

    // Validate that all required fields are present
    if (!name || !email || !phone || !address || !country || !city || !zip || !shippingMethod || !products || !totalAmount) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Validate Product IDs before placing the order
    const validatedProducts = await Promise.all(products.map(async (item) => {
      const product = await Product.findById(item._id);
      if (!product) {
        throw new Error(`Product ID ${item._id} not found`);
      }
      return { 
        _id: item._id,
        product_name: product.product_name,
        product_image: product.product_image,
        price: product.price,
        quantity: item.quantity
      };
    }));

    // Create a new order
    const order = new Order({
      name,
      email,
      phone,
      address,
      country,
      city,
      zip,
      shippingMethod,
      products: validatedProducts,
      totalAmount,
      paymentStatus: shippingMethod === 'cod' ? 'Pending' : 'Paid'
    });

    await order.save();

     // ✅ Send Order Confirmation Email
     await sendOrderConfirmationEmail(email, order);
    res.status(201).json({ success: true, message: 'Order placed successfully!', order });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Error placing order', error: error.message });
  }
};

// Create Stripe Checkout Session (Handles Multiple Products)
exports.createStripeCheckoutSession = async (req, res) => {
  try {
    const { products } = req.body;

    // Validate products array
    if (!products || products.length === 0) {
      return res.status(400).json({ success: false, message: 'No products provided' });
    }

    // Fetch full product details for Stripe checkout
    const lineItems = await Promise.all(products.map(async (item) => {
      const product = await Product.findById(item.productId);
      if (!product) {
        throw new Error(`Product ID ${item.productId} not found`);
      }

      return {
        price_data: {
          currency: 'usd',
          product_data: { name: product.product_name },
          unit_amount: parseInt(product.price) * 100
        },
        quantity: item.quantity
      };
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/order-success`,
      cancel_url: `${process.env.CLIENT_URL}/checkout`
    });

    res.json({ success: true, sessionId: session.id, url: session.url });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating payment session', error: error.message });
  }
};

// Get Order by ID (Populates Product Details)
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('products.productId', 'product_name product_image price');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    res.json({ success: true, order });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching order', error: error.message });
  }
};

// Get All Orders (With Product Details)
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('products.productId', 'product_name product_image price')
      .sort({ createdAt: -1 });

    res.json({ success: true, orders });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching orders', error: error.message });
  }
};

// Update Order Status (Mark as Paid for Stripe)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { paymentStatus } = req.body;

    // Validate request body
    if (!paymentStatus) {
      return res.status(400).json({ success: false, message: 'Payment status is required' });
    }

    const order = await Order.findByIdAndUpdate(req.params.id, { paymentStatus }, { new: true });

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    res.json({ success: true, message: 'Order updated successfully!', order });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating order', error: error.message });
  }
};

// Delete Order
exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    res.json({ success: true, message: 'Order deleted successfully!' });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting order', error: error.message });
  }
};
