import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import data from "./data.js";
import path from "path";
import { fileURLToPath } from "url";

const log = console.log;
const PORT = 5000;

const app = express();
app.use(cors("http://localhost:3000"));
app.use(express.json());

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:3000"],
  },
});

// to get list of products
app.get("/api/", (req, res) => {
  res.send({ message: "", data, status: 1 });
});
// to get single products
app.get("/api/:id", (req, res) => {
  const id = req.params.id;
  res.send({
    message: "",
    data: data.find((val) => val.id === Number(id)),
    status: 1,
  });
});
// hold bidding object
const product = {};
app.post("/api/check", (req, res) => {
  // console.info(product);
  const { id, user } = req.body;
  if (product[id]) {
    // console.info(product);
    res.send({ data: product[id] });
  } else {
    res.send({ message: "Bidding has not been started for this product" });
  }
});

io.on("connection", (socket) => {
  // console.info(socket?.id);
  socket.on("bid:get_detail", (payload) => {
    // const val = data.find((val) => val.id === Number(payload));
    data.map((value) => {
      product[value.id] = {
        cost: value?.cost,
        user: product[value.id]?.user ? "" : socket.id,
      };
    });
    // product[value.id]?.cost : val?.cost
    // console.info(product[payload]);
    // console.log(product);
    // product[payload] = {
    //   cost: product[payload]?.cost ? product[payload]?.cost : val?.cost,
    //   user: product[payload]?.user ? "" : socket.id,
    // };
    socket.emit("bid:cost", btoa(JSON.stringify(product)));
  });
  socket.on("bid:add", ({ id, value }) => {
    const val = data.find((value) => value.id === Number(id));
    // console.log(value, id);
    const currentVal = product[id]?.cost ? product[id]?.cost : val?.cost;
    // console.info({ value, currentVal });
    if (value > currentVal) {
      product[id] = {
        cost: value,
        user: socket.id,
      };
      console.info(product);

      socket.broadcast.emit("bid:cost", btoa(JSON.stringify(product)));
    }
  });
});
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "./public")));
app.get("/*", (req, res) => {
  res.sendFile(path.join(__dirname, "./public", "index.html"));
});
httpServer.listen(PORT, () => log(`App started on port ${PORT}`));
