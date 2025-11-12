const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 3000;

/* middleWare */
app.use(cors());
app.use(express.json());

const uri =
  "mongodb+srv://HomeNestDB:oIqi0ykCAvat1l6O@cluster0.fcwgrle.mongodb.net/?appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const db = client.db("HomeNest-db");
    const propertyCollection = db.collection("properties");
    const userCollection = db.collection("users");
    const ratingCollection = db.collection("rating");

    /* User related Api */
    app.post("/users", async (req, res) => {
      const newUser = req.body;
      const email = req.body.email;
      const query = { email: email };
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        res.send({ message: "user already exits.do not need to insert again" });
      } else {
        const result = await userCollection.insertOne(newUser);
        res.send(result);
      }
    });
    //  rating Api
    app.post("/ratings", async (req, res) => {
      const rating = req.body;
      const result = await ratingCollection.insertOne(rating);
      res.send(result);
    });

    app.get("/ratings/:propertyId", async (req, res) => {
      const propertyId = req.params.propertyId;
      const result = await ratingCollection.find({ propertyId }).toArray();
      res.send(result);
    });

    app.get("/my-ratings", async (req, res) => {
      const email = req.query.email;
      const result = await ratingCollection
        .find({ userEmail: email })
        .toArray();
      res.send(result);
    });

    // property api
    app.get("/latest-properties", async (req, res) => {
      const cursor = propertyCollection
        .find()
        .sort({ postedDate: -1 })
        .limit(6);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/properties/:id", async (req, res) => {
      const id = req.params.id;

      let result = null;

      if (ObjectId.isValid(id)) {
        result = await propertyCollection.findOne({ _id: new ObjectId(id) });
      }

      if (!result) {
        result = await propertyCollection.findOne({ _id: id });
      }

      if (!result) {
        return res.status(404).send({ message: "Property Not Found" });
      }
      res.send(result);
    });

    app.get("/properties", async (req, res) => {
      const search = req.query.search;
      const sort = req.query.sort;
      const email = req.query.email;

      let query = {};
      if (search) {
        query.propertyName = { $regex: search, $options: "i" };
      }

      if (email) {
        query["postedBy.email"] = email;
      }

      let sortOption = {};
      if (sort === "price-asc") sortOption.price = 1;
      if (sort === "price-desc") sortOption.price = -1;
      if (sort === "date-desc") sortOption.postedDate = -1;
      if (sort === "date-asc") sortOption.postedDate = 1;
      const result = await propertyCollection
        .find(query)
        .sort(sortOption)
        .toArray();
      res.send(result);
    });

    app.patch("/properties/:id", async (req, res) => {
      const id = req.params.id;
      const updatedProduct = req.body;
      const query = { _id: new ObjectId(id) };
      const update = {
        $set: {
          propertyName: updatedProduct.propertyName,
          description: updatedProduct.description,
          category: updatedProduct.category,
          price: updatedProduct.price,
          location: updatedProduct.location,
          image: updatedProduct.image,
        },
      };
      const result = await propertyCollection.updateOne(query, update);
      res.send(result);
    });

    app.delete("/properties/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await propertyCollection.deleteOne(query);
      res.send(result);
    });

    app.post("/properties", async (req, res) => {
      const newProduct = req.body;
      const result = await propertyCollection.insertOne(newProduct);
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

/* server API */
app.get("/", (req, res) => {
  res.send("HomeNest server is running");
});

app.listen(port, () => {
  console.log(`HomeNest server is running on port :${port}`);
});
