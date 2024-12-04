module.exports = async function (app) {
    try {
        // Import route modules
        const routes = {
            authRouter: require('./auth'),
            productRouter: require('./product'),
            recommendationRouter: require('./recommendation'), // Corrected naming for consistency
            contactUsRouter: require('./contactUs') // Corrected naming for consistency
        };

        // Define the base version for the API
        const base_version = '/api/v1/';

        // Register routes with the app
        app.use(`${base_version}authentication`, routes.authRouter);
        app.use(`${base_version}product`, routes.productRouter);
        app.use(`${base_version}recommendation`, routes.recommendationRouter);
        app.use(`${base_version}contactUs`, routes.contactUsRouter);

        console.log("Routes initialized successfully");
    } catch (err) {
        console.error("ERROR initializing routes:", err);
    }
};