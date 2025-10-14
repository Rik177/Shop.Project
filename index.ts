require('dotenv').config();

import { Express } from "express";
import { Connection } from "mysql2/promise";
import { initDataBase } from "./Server/services/db";
import { initServer } from "./Server/services/server";
import ShopAPI from "./Shop.API";
import ShopAdmin from "./Shop.Admin";
import path from "path";
import express from "express";

export let server: Express;
export let connection: Connection;

async function launchApplication() {
  server = initServer();
  connection = await initDataBase();

  initRouter();
}

function initRouter() {
  const shopApi = ShopAPI(connection);
  server.use("/api", shopApi);

  const shopAdmin = ShopAdmin();
  server.use("/admin", shopAdmin);

  const clientDist = path.resolve(__dirname, "Shop.Client", "dist");
  server.use(express.static(clientDist));

  server.get("*", (req, res) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/admin")) return res.end();
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

launchApplication();