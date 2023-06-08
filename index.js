const express = require('express');
const cors = require('cors');
const app = express()
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const jwt = require('jsonwebtoken')
const morgan = require('morgan')
const port = process.env.PORT || 5000;


//middleware
app.use(cors())
app.use(express.json())
app.use(morgan('dev'))

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ error: true, message: 'UnAuthorization access' })
  }
  const token = authorization.split(' ')[1]
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
    if (error) {
      return res.status(401).send({ error: true, message: 'UnAuthorization access' })
    }
    req.decoded = decoded;
    next()
  })
}




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

    //jwt
    app.post('/jwt', (req, res) => {
      const email = req.body;
      const token = jwt.sign(email, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
      res.send({ token })
    })

    //verify admin
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email }
      const user = await userCollection.findOne(query)
      if (user?.role !== 'admin') {
        return res.status(403).send({ error: true, message: 'forbidden access' })
      }
      next()

    }

    //get slider information
    app.get('/slider', async (req, res) => {
      const result = await sliderCollection.find().toArray()
      res.send(result)
    })

    //get al user
    app.get('/users', verifyJWT, verifyAdmin, async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result)
    })

    //get admin for secure dashboard
    app.get('/users/admin/:email', verifyJWT, async (req, res) => {
      const decodedEmail = req.decoded.email;
      const email = req.params.email;
      if (email !== decodedEmail) {
        return res.send({ admin: false })
      }
      const query = { email: email }
      const user = await userCollection.findOne(query)
      const admin = { admin: user?.role === 'admin' }
      res.send(admin)
    })

    //get instructor for dashboard
    app.get('/users/instructor/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;
      if (req.decoded.email !== email) {
        return res.send({ instructor: false })
      }
      const query = { email: email }
      const user = await userCollection.findOne(query)
      const instructor = { instructor: user?.role === 'instructor' }
      res.send(instructor)

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