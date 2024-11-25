// const express = require('express');
// const router = express.Router();

// const authRoutes = require('./auth');
// const productRoutes = require('./product');
// const recommendationRoutes = require('./recommendation'); // Add this line

// router.use('/auth', authRoutes);
// router.use('/products', productRoutes);
// router.use('/recommend', recommendationRoutes); // Ensure this path matches your Postman request

// module.exports = router;

module.exports = async function (app) {
    try {
        let routes = {
            authRouter: require('./auth'),
            productRouter: require('./product'),
            recommendationRoutes: require('./recommendation'),
        }
        let base_version = '/api/v1'
        app.use(`${base_version}/authentication/`, routes.authRouter);
        app.use(`${base_version}/product`, routes.productRouter)    
        app.use(`${base_version}/recommendation`, routes.recommendationRoutes)  
    } catch (err) {
        console.log("ERROR: ", err)
    }
}
