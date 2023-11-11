const express=require('express');
const cors=require('cors');
const jwt=require('jsonwebtoken')
const cookieParser=require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app=express();
const port= process.env.PORT || 5000;
require('dotenv').config();


// middleware
app.use(cors({
  origin:['http://localhost:5173','https://bookhotel-ffd71.web.app','https://bookhotel-ffd71.firebaseapp.com' ],
  credentials:true,           
  optionSuccessStatus:200
}));
app.use(express.json());
app.use(cookieParser());








const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.huinn5b.mongodb.net/?retryWrites=true&w=majority`;

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


    const dataBase=client.db('BookHotel');
//http://localhost:5000/api/v1/hotel-details?sortField=price&sortOrder=asc&rangeField=price&rangeValue=2000

//http://localhost:5000/api/v1/hotel-details?sortField=price&sortOrder=asc& pricemin=0 & pricemax=8000 & membermin=1&membermax=10 &roommin=0 roommax=150

const verifyToken=(req,res,next)=>{
  const {token} = req.cookies;

  if(!token){
    return res.status(401).send({message:'You are not authorized'})
  }

  jwt.verify(token,process.env.SECRET_ACCESS_TOKEN,(err,decoded)=>{
    if(err) return res.status(401).send({message:'You are not authorized'})
    req.user=decoded;
    next();
    
  })
}

    app.get('/api/v1/hotel-details',async(req, res) => {
        let sortQuery={};
        

        const {sortField,sortOrder,pricemin,pricemax,membermin,membermax,roommin,roommax}=req.query;
        let rangeQuery={};

        if(sortField && sortOrder){
          sortQuery[sortField]=sortOrder;
        }

        if(pricemin && pricemax && membermin && membermax && roommin && roommax){

          rangeQuery={$and:[
            {price:{$gte:parseInt(pricemin)}},{price:{$lte:parseInt(pricemax)}},
            {members:{$gte:parseInt(membermin)}},{members:{$lte:parseInt(membermax)}},
            {feet:{$gte:parseInt(roommin)}},{feet:{$lte:parseInt(roommax)}}
          ]};

        }
        
        const coursor=dataBase.collection('Hotel details').find(rangeQuery).sort(sortQuery);
        const result= await coursor.toArray();
        res.send(result);

    })

    app.post('/api/v1/contacts-info',async function (req, res) {
      const contactCollection = dataBase.collection("contactsInfo");
      const ContactInfo=req.body;
      const result = await contactCollection.insertOne(ContactInfo);
      res.send(result);
    })
    // 

    app.post('/api/v1/local-guide-req',async function (req, res) {
      const Collection = dataBase.collection("Local guide request");
      const LocalGuideReqInfo=req.body;
      const result = await Collection.insertOne(LocalGuideReqInfo);
      res.send(result);
    })

    app.post('/api/v1/job-req',async function (req, res) {
      const Collection = dataBase.collection("JobReq");
      const ReqInfo=req.body;
      const result = await Collection.insertOne(ReqInfo);
      res.send(result);
    })
   

    app.post('/api/v1/subscribers',async function (req, res) {
      const Collection = dataBase.collection("subscribers");
      const ReqInfo=req.body;
      const result = await Collection.insertOne(ReqInfo);
      res.send(result);
    })

    app.post('/api/v1/booking-room',async function (req, res) {
      const Collection = dataBase.collection("Booking Room");
      const ReqInfo=req.body;
      const result = await Collection.insertOne(ReqInfo);
      res.send(result);
    })

    app.get('/api/v1/my-booking/:email',verifyToken,async (req,res)=>{

      const queryEmail=req.params.email;
      const tokenEmail =req.user.email;

      console.log(queryEmail, tokenEmail);

      if(queryEmail!=tokenEmail){
        return res.status(403).send({message:'forbidden access'})
      }

      const Collection = dataBase.collection("Booking Room");
      const coursor =Collection.find({email: `${req.params.email}`})
      const result= await coursor.toArray();
      res.send(result);

      

    })
    

    app.get('/api/v1/basic-data',async(req, res) => {

      const coursor=dataBase.collection('Basic Data').find();
      const result= await coursor.toArray();
      res.send(result);
    })

    app.get('/api/v1/jobsopen',async(req, res) => {

      const coursor=dataBase.collection('JobOpen').find();
      const result= await coursor.toArray();
      res.send(result);
    })

    app.get('/api/v1/faqs',async(req, res) => {

      const coursor=dataBase.collection('faqData').find();
      const result= await coursor.toArray();
      res.send(result);
    })

    app.get('/api/v1/house-rules',async(req, res) => {

      const coursor=dataBase.collection('House Rules').find();
      const result= await coursor.toArray();
      res.send(result);
    })

    app.get('/api/v1/reviews',async(req, res) => {

      const coursor=dataBase.collection('Reviews').find();
      const result= await coursor.toArray();
      res.send(result);
    })

    app.get('/api/v1/galary',async(req,res)=>{
      const coursor=dataBase.collection('gallary').find();
      const result= await coursor.toArray();
      res.send(result);
    })

    app.get('/api/v1/room/:roomId',async(req, res) => {
      const result= await dataBase.collection('Hotel details').findOne({_id: new ObjectId(req.params.roomId)});
      res.send(result);
    })


    app.post('/api/v1/auth/access-token',(req,res)=>{
        const user=req.body;
        const token= jwt.sign(user,process.env.SECRET_ACCESS_TOKEN,{expiresIn:'1h'})
        res.cookie('token',token,{
            httpOnly: true,
            secure: true,
            sameSite: 'none',
        })
        .send({success:true});
    })

    app.post('/api/v1/auth/logout',async(req,res)=>{
      const user=req.body;
      res.clearCookie('token',{maxAge:0}).send({logOut:true});
    })



   


    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);







app.get('/',(req, res)=>{
    res.send('Hello World');
})

app.listen(port, ()=>{
    console.log(`server listening on ${port}`);
});