import express from "express";
import mpesaRoutes from "./routes/mpesaRoutes.js";

const app = express();

app.use(express.json());

app.use("/api/mpesa", mpesaRoutes);

export default app;