var morgan = require("morgan");
var bodyParser = require("body-parser");
module.exports = async function (app, express) {
  try {
    app.use(morgan("dev"));
    app.use((req, res, next) => {
      res.header("Access-Control-Allow-Origin", "*");
      res.header(
        "Access-Control-Allow-Headers",
        "x-www-form-urlencoded, Origin, X-Requested-With, Content-Type, Accept, Authorization, *"
      );
      // res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS, DELETE')
      if (req.method === "OPTIONS") {
        res.header(
          "Access-Control-Allow-Methods",
          "GET, PUT, POST, PATCH, DELETE, OPTIONS"
        );
        res.setHeader("Access-Control-Allow-Credentials", true);
        return res.status(200).json({});
      }
      next();
    });
    app.use(bodyParser.json({ limit: "50mb" }));
    app.use(
      bodyParser.urlencoded({
        limit: "50mb",
        extended: true,
        parameterLimit: 1000000,
      })
    );
    app.use(express.json());
    // app.use(express.urlencoded({ extended: true }));
    app.use("/uploads", express.static("uploads"));

    // route imports
    require("../routes/index")(app);
    // DB connections
    require("../db/mongo_connection")();
  } catch (err) {
    console.log("Cannot connect to the database", err);
  }
};
