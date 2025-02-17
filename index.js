require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const stripe = require("stripe")(process.env.PAYMENT_SECRET_KEY);
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const corsOptions = {
  origin: [
    "https://op-track.web.app",
    "https://op-track.firebaseapp.com/",
    "http://localhost:5173",
  ],
  credentials: true,
  optionalSuccessStatus: 200,
};
//Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.i16dm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

//Verify Token Function
const verifyToken = (req, res, next) => {
  const token = req.cookies?.token;
  console.log(token);
  if (!token) {
    return res.status(401).send({ message: "Unauthorized Access" });
  }
  jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Unauthorized Access" });
    }
    req.user = decoded;
  });
  console.log(token);
  next();
};

async function run() {
  try {
    const usersCollection = client.db("optrackDB").collection("users");
    const workSheetCollection = client.db("optrackDB").collection("worksheets");
    const paymentCollection = client.db("optrackDB").collection("payment");
    const paymentReqCollection = client
      .db("optrackDB")
      .collection("paymentReq");

    //verifyAdmin Token
    const verifyAdmin = async (req, res, next) => {
      console.log(req.user, "From verifyToken");
      const email = req.user?.email;
      const query = { email };
      const result = await usersCollection.findOne(query);
      console.log(result);
      if (!result || result?.role !== "Admin")
        return res
          .status(403)
          .send({ message: "Unauthorized Access! Admin Only Actions" });
      next();
    };

    //verifyHR Token
    const verifyHR = async (req, res, next) => {
      console.log(req.user, "From verifyToken");
      const email = req.user?.email;
      const query = { email };
      const result = await usersCollection.findOne(query);
      console.log(result);
      if (!result || result?.role !== "HR")
        return res
          .status(403)
          .send({ message: "Unauthorized Access! Admin Only Actions" });
      next();
    };

    //Genarate JWT
    app.post("/jwt", async (req, res) => {
      const email = req.body;
      //create token
      const token = jwt.sign(email, process.env.SECRET_KEY, {
        expiresIn: "20d",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });

    //log out || clear cookie from browser
    app.get("/logout", async (req, res) => {
      res
        .clearCookie("token", {
          maxAge: 0,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });

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

    //get all users
    app.get("/users", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    //get a specific user // not this doesn't let me login
    app.get("/user/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await usersCollection.findOne(query);
      res.send(result);
    });

    //Employee Details
    app.get("/users/detail/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: new ObjectId(id) };
      const result = await usersCollection.findOne(query);
      res.send(result);
    });

    //Chart api
    app.get("/chart/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const result = await paymentCollection.find(query).toArray();
      res.send(result);
    });

    // Update the status of the user
    app.patch("/users/:id", async (req, res) => {
      const id = req.params.id;
      const { isVerified } = req.body;
      console.log(isVerified);
      const updated = {
        $set: { isVerified: isVerified },
      };

      const query = { _id: new ObjectId(id) };
      const result = await usersCollection.updateOne(query, updated);
      res.send(result);
    });

    //get user role
    app.get("/users/role/:email", async (req, res) => {
      const email = req.params.email;
      const result = await usersCollection.findOne({ email });
      res.send({ role: result?.role });
    });

    //Work Sheet related query
    app.post("/work-sheet", async (req, res) => {
      const workSheet = req.body;
      const result = await workSheetCollection.insertOne(workSheet);
      res.send(result);
    });

    //Get worksheet for specific user
    app.get("/work-sheet/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      // const decodedEmail = req.user?.email;
      // if (decodedEmail !== email)
      //   return res.status(401).send({ message: "Unauthorized Access" });

      const result = await workSheetCollection.find(query).toArray();
      res.send(result);
    });

    //Get  worksheet for all user
    app.get("/work-sheet", async (req, res) => {
      const result = await workSheetCollection.find().toArray();
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

    //Payment related APIs
    app.post("/payment-req", async (req, res) => {
      const paymentReq = req.body;
      console.log(paymentReq);
      const result = await paymentReqCollection.insertOne(paymentReq);
      res.send(result);
    });

    //Fetching all payment requests
    app.get("/payment-req", async (req, res) => {
      const result = await paymentReqCollection.find().toArray();
      res.send(result);
    });

    //Stripe Related API
    //Create Payment Intent
    app.post(
      "/create-payment-intent",

      async (req, res) => {
        const { employeeId } = req.body;
        console.log(employeeId);
        const employee = await usersCollection.findOne({
          _id: new ObjectId(employeeId),
        });
        console.log(employee.salary);
        const salaryToCent = employee.salary * 100; // total salary in cent

        const { client_secret } = await stripe.paymentIntents.create({
          amount: salaryToCent,
          currency: "usd",
          automatic_payment_methods: {
            enabled: true,
          },
        });
        console.log(client_secret);
        res.send({ clientSecret: client_secret, salaryToCent });
      }
    );

    //Payment history post API
    app.post("/payment", async (req, res) => {
      const payment = req.body;
      const result = await paymentCollection.insertOne(payment);
      res.send(result);
    });

    //All payment history API
    app.get("/payment/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      // const decodedEmail = req.user?.email;
      // if (decodedEmail !== email)
      //   return res.status(401).send({ message: "Unauthorized Access" });

      const result = await paymentCollection.find(query).toArray();
      res.send(result);
    });

    //Admin related API's
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: { $ne: email } };
      // const decodedEmail = req.user?.email;
      // if (decodedEmail !== email)
      //   return res.status(401).send({ message: "Unauthorized Access" });
      const result = await usersCollection.find(query).toArray();
      res.send(result);
    });

    //Employee fired API
    app.put("/users/fire/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const { isFired } = req.body;
      console.log(isFired);
      const updated = {
        $set: { isFired: isFired },
      };
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const result = await usersCollection.updateOne(query, updated, options);
      // console.log(result);
      res.send(result);
    });

    //Charge employee role
    // Update the status of the user
    app.patch("/users/role/:id", async (req, res) => {
      const id = req.params.id;
      const { role } = req.body;
      console.log(role);
      const updated = {
        $set: { role: role },
      };

      const query = { _id: new ObjectId(id) };
      const result = await usersCollection.updateOne(query, updated);
      res.send(result);
    });

    //update salary of an employee
    app.patch(
      "/users/salary/:id",

      async (req, res) => {
        const id = req.params.id;
        const { updatedSalary } = req.body;
        console.log(updatedSalary);
        const updated = {
          $set: { salary: Number(updatedSalary) },
        };

        const query = { _id: new ObjectId(id) };
        const result = await usersCollection.updateOne(query, updated);
        res.send(result);
      }
    );

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
