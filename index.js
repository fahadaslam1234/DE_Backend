const express = require("express");
require("dotenv").config({ path: "./src/env/.env" });
const app = express();
require("./src/config/config")(app, express);
const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`listening on port ${port}`));

  