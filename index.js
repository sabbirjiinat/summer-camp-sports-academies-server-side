const express = require('express');
const cors = require('cors');
const app = express()
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const port = process.env.PORT || 5000;


//middleware
app.use(cors())
app.use(express.json())




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.9a4nghi.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
      await client.connect();
      
    const sliderCollection = client.db('sports-academies').collection('slider')
    const userCollection = client.db('sports-academies').collection('users')

    //get slider information
    app.get('/slider', async (req, res) => {
      const result = await sliderCollection.find().toArray()
      res.send(result)
    })
    
    
      
      //crete user
      app.put('/users/:email', async (req, res) => {
          const email = req.params.email;
          const user = req.body;
          const query = { email: email }
          const options = { upsert: true };
          const updatedDoc = {
              $set: user
          }
          const result = await userCollection.updateOne(query, updatedDoc, options)
          res.send(result)
          
      })
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Summer camp sports academies is running')
})


app.listen(port, () => {
    console.log(`Summer camp sports academies is running on port :  ${port}`);
})