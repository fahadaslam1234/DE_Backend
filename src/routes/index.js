const { route } = require('./recommendation');

module.exports = async function (app) {
    try {
        // Import route modules
        const routes = {
            authRouter: require('./auth'),
            productRouter: require('./product'),
            recommendationRouter: require('./recommendation'),
            contactUsRouter: require('./contactUs'), 
            dermConnectRouter: require('./dermConnect'),
            diseasePredictorRouter: require('./diseasePredictor'),
            ordersRouter: require("./orders")
        };

        // Define the base version for the API
        const base_version = '/api/v1/';

        // Register routes with the app
        app.use(`${base_version}authentication`, routes.authRouter);
        app.use(`${base_version}product`, routes.productRouter);
        app.use(`${base_version}recommendation`, routes.recommendationRouter);
        app.use(`${base_version}contactUs`, routes.contactUsRouter);
        app.use(`${base_version}dermConnect`, routes.dermConnectRouter);
        app.use(`${base_version}diseasePredictor`, routes.diseasePredictorRouter);
        app.use(`${base_version}orders`, routes.ordersRouter);


        console.log("Routes initialized successfully");
    } catch (err) {
        console.error("ERROR initializing routes:", err);
    }
};