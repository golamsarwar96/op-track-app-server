require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

//Middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.i16dm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const usersCollection = client.db("optrackDB").collection("users");
    const workSheetCollection = client.db("optrackDB").collection("worksheets");

    //User Related Query
    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user?.email };

      //1. Check if the use is already inside the database
      const isExist = await usersCollection.findOne(query);

      if (isExist) {
        return res.send(isExist);
      }

      //2. New users input who are completely new in the server.
      const result = await usersCollection.insertOne({
        ...user,
        timestamp: Date.now(),
      });

      res.send(result);
    });

    //Work Sheet related query
    app.post("/work-sheet", async (req, res) => {
      const workSheet = req.body;
      const result = await workSheetCollection.insertOne(workSheet);
      res.send(result);
    });

    app.get("/work-sheet/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const result = await workSheetCollection.find(query).toArray();
      res.send(result);
    });

    //Worksheet update method
    app.put("/update-query/:id", async (req, res) => {
      const id = req.params.id;
      const queryData = req.body;
      const updated = {
        $set: queryData,
      };
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const result = await workSheetCollection.updateOne(
        query,
        updated,
        options
      );
      // console.log(result);
      res.send(result);
    });

    //wordSheet Delete
    app.delete("/work-sheet/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await workSheetCollection.deleteOne(query);
      res.send(result);
    });

    //get user role
    app.get("/users/role/:email", async (req, res) => {
      const email = req.params.email;
      const result = await usersCollection.findOne({ email });
      res.send({ role: result?.role });
    });

    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });

    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello from server");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
