const express = require('express');
const {MongoClient} = require('mongodb');
const path = require('path');
const app=express();


const port=5000;
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


// MongoDB connection URI

const uri = "mongodb://localhost:27017";

//Middleware to parse form data

app.use(express.urlencoded({extended: true }));
// Serve static HTML files

app.get('/signup', (req, res) =>
res.sendFile(path.join(__dirname, 'public','signup.html')));

app.get('/signin', (req, res) =>
res.sendFile(path.join(__dirname, 'public','signin.html')));

app.get('/home',(req,res) =>
  res.sendFile(path.join(__dirname,'public','hospital.html')));


// signup

app.post('/signup', async (req, res) => {
    const user = {
        "Username": req.body.Username,
        "Password": req.body.Password
    };
    const client = new MongoClient(uri);
    try {
        await client.connect();


        const check = await client.db('hospital').collection('users').findOne({ "Username": `${req.body.Username}` });

        if (check) {
            res.send("User exists");
        } else {
            const result = await client.db('hospital').collection('users').insertOne(user);
            console.log("Successfully Inserted");
            res.redirect('/signin');
        }
    }
    catch (err) {
        console.error("Error Inserting Document");
        res.send(`<h1>Error Adding Document</h1>`);
    }
    finally {
        await client.close();
    }
});


//signin

app.post('/signin', async (req, res) => {
  const client = new MongoClient(uri);
  const user = {
            "Username": req.body.Username, 
            "Password" : req.body.Password
        };
  try {
    await client.connect();
    const result = await client.db('hospital').collection('users').findOne(user);
    if (result){
      res.redirect("/home");
    }else{
      return res.send('Invalid username or password');
    } 
  } catch (error) {
    res.status(500).send('Error: ' + error.message);
  } finally {
    await client.close();
  }
});


//admit

app.post("/admit",async(req,res) =>
{
    const client=new MongoClient(uri);
    try{
        await client.connect();
        db = client.db("hospital");
        patients = db.collection("patients");
        fees = db.collection("fees");
        const { registrationID, Name, age, gender, problem, feeDeposit } = req.body;

    const patient = {
        registrationID,
        Name,
        age:parseInt(age),
        gender,
        problem,
        feeDeposit:parseFloat(feeDeposit)
    };

    const feeRecord = {
        registrationID,
        problem,
        feeDeposit: parseFloat(feeDeposit),
        date: new Date()
    };

    await patients.insertOne(patient);
    await fees.insertOne(feeRecord);
    const result=(`
      <!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fee Details</title>
    <style>
         body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(to right, #f8f9fa, #e0eafc);
      margin: 0;
      padding: 0;
    }

    .container {
      width: 90%;
      margin: 40px auto;
      background: white;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    }

    h2 {
      text-align: center;
      color: #333;
      margin-bottom: 30px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 16px;
    }

    th, td {
      padding: 12px 15px;
      border-bottom: 1px solid #ddd;
      text-align: center;
    }

    th {
      background-color: rgba(0, 153, 255, 0.656);
      color: white;
    }

    tr:hover {
      background-color: #f1f1f1;
    }

    .home-btn {
      display: block;
      width: 120px;
      margin: 30px auto 0;
      padding: 10px 20px;
      text-align: center;
      background-color: rgba(0, 153, 255, 0.656);
      color: white;
      border: none;
      border-radius: 8px;
      text-decoration: none;
      font-size: 16px;
      transition: background 0.3s ease;
    }

    .home-btn:hover {
      background-color: #0056b3;
    }
    </style>
</head>

<body>
    <div class="container">
    <h2>Patient "${Name}" Admitted</h2>
        <a href="hospital.html" class="home-btn"><strong>Home</strong></a>
</div>
    
</body>

</html>
      `)
    res.send(result);
  } catch (error) {
    res.status(500).send('Error: ' + error.message);
  } finally {
    await client.close();
  }        
});
//update
app.post('/update', async (req, res) => {
  const client = new MongoClient(uri);
  const { registrationID, Name, age, gender, problem, feeDeposit } = req.body;

  if (!registrationID) {
    return res.status(400).send('Registration ID is required.');
  }

  if (!(Name || age || gender || problem || feeDeposit)) {
    return res.status(400).send('No update fields provided.');
  }

  try {
    await client.connect();
    const db = client.db("hospital");
    const patientsCollection = db.collection('patients');
    const feesCollection = db.collection('fees');

    // PATIENT FIELDS UPDATE
    if (Name) {
      await patientsCollection.updateOne(
        { registrationID },
        { $set: { Name: Name } }
      );
    }

    if (age) {
      await patientsCollection.updateOne(
        { registrationID },
        { $set: { age: parseInt(age) } }
      );
    }

    if (gender) {
      await patientsCollection.updateOne(
        { registrationID },
        { $set: { gender: gender } }
      );
    }

    if (problem) {
      await patientsCollection.updateOne(
        { registrationID },
        { $set: { problem: problem } }
      );
    }
    if (feeDeposit) {
      await patientsCollection.updateOne(
        { registrationID },
        { $set: { feeDeposit: parseFloat(feeDeposit),date: new Date() } }
      );
    }

    // FEE UPDATE
    if (feeDeposit) {
      await feesCollection.updateOne(
        { registrationID },
        { $set: { feeDeposit: parseFloat(feeDeposit),date: new Date() } }
      );
    }
    if (problem) {
      await patientsCollection.updateOne(
        { registrationID },
        { $set: { problem: problem } }
      );
    }
   const result=(`<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fee Details</title>
    <style>
         body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(to right, #f8f9fa, #e0eafc);
      margin: 0;
      padding: 0;
    }

    .container {
      width: 90%;
      margin: 40px auto;
      background: white;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    }

    h2 {
      text-align: center;
      color: #333;
      margin-bottom: 30px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 16px;
    }

    th, td {
      padding: 12px 15px;
      border-bottom: 1px solid #ddd;
      text-align: center;
    }

    th {
      background-color: rgba(0, 153, 255, 0.656);
      color: white;
    }

    tr:hover {
      background-color: #f1f1f1;
    }

    .home-btn {
      display: block;
      width: 120px;
      margin: 30px auto 0;
      padding: 10px 20px;
      text-align: center;
      background-color: rgba(0, 153, 255, 0.656);
      color: white;
      border: none;
      border-radius: 8px;
      text-decoration: none;
      font-size: 16px;
      transition: background 0.3s ease;
    }

    .home-btn:hover {
      background-color: #0056b3;
    }
    </style>
</head>

<body>
    <div class="container">
    <h2>Patient Updated Successfully</h2>
        <a href="hospital.html" class="home-btn"><strong>Home</strong></a>
</div>
    
</body>

</html>`)
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error during update. ' + error.message);
  } finally {
    await client.close();
  }
});

app.post('/view', async (req, res) => {
  const client = new MongoClient(uri);
      try {
        const regId = req.body.registrationID;
        const patient = await client.db("hospital").collection("patients").findOne({ registrationID: regId });

        if (!patient) {
          return res.send('Patient not found');
        }
        const result=(`<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fee Details</title>
    <style>
         body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(to right, #f8f9fa, #e0eafc);
      margin: 0;
      padding: 0;
    }

    .container {
      width: 90%;
      margin: 40px auto;
      background: white;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    }

    h2 {
      text-align: center;
      color: #333;
      margin-bottom: 30px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 16px;
    }

    th, td {
      padding: 12px 15px;
      border-bottom: 1px solid #ddd;
      text-align: center;
    }

    th {
      background-color: rgba(0, 153, 255, 0.656);
      color: white;
    }

    tr:hover {
      background-color: #f1f1f1;
    }

    .home-btn {
      display: block;
      width: 120px;
      margin: 30px auto 0;
      padding: 10px 20px;
      text-align: center;
      background-color: rgba(0, 153, 255, 0.656);
      color: white;
      border: none;
      border-radius: 8px;
      text-decoration: none;
      font-size: 16px;
      transition: background 0.3s ease;
    }

    .home-btn:hover {
      background-color: #0056b3;
    }
    </style>
</head>

<body>
    <div class="container">
    <h2>Patient Details</h2>
          <p><strong>Registration ID:</strong> ${patient.registrationID}</p>
          <p><strong>Name:</strong> ${patient.Name}</p>
          <p><strong>Age:</strong> ${patient.age}</p>
          <p><strong>Problem:</strong> ${patient.problem}</p>
          <p><strong>Fee Deposit:</strong>${patient.feeDeposit}</p>
        <a href="hospital.html" class="home-btn"><strong>Home</strong></a>
</div>
    
</body>

</html>
          
        `)
        // Display selected fields from patient document
        res.send(result);
      } catch (err) {
        res.send('Server error: ' + err.message);
      }finally { 
    await client.close();
  }
    });

// List all patient fee details

app.get("/feesummary", async (req,res) => {
  const client = new MongoClient(uri);
  try {

    await client.connect();
    const fees = await client.db("hospital").collection("patients").aggregate([{
      $group:{
        _id:"$problem",
        totalDeposit:{$sum:"$feeDeposit"}
      }
    }  
]).toArray();
    console.log("result:",fees);
    res.render('feesummary',{fees});
  }catch (error) {
    res.status(500).send('<h1>Error:</h1><p>${error.message)</p>');
  } finally { 
    await client.close();
  }
});


//list patient details

app.get("/patientsummary", async (req,res) => {
  const client = new MongoClient(uri);
  try {

    await client.connect();
    const patients = await client.db("hospital").collection("patients").find({}).toArray();
    console.log("result:",patients);
    res.render('patientsummary',{patients});
  }catch (error) {
    res.status(500).send(`<h1>Error:</h1><p> ${error.message}</p>`);
  } finally { 
    await client.close();
  }
});

//UPDATE


// Delete a product

app.post('/discharge', async (req, res) => {
  const registrationID = req.body.registrationID;
  if (!registrationID) {
    return res.send("Registration ID is required");
  }

  try {
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db('hospital');
    const collection = db.collection('patients');

    const patient = await collection.findOne({ registrationID: registrationID });

    if (!patient) {
      return res.send("<i>Patient Not Found!</i>");
    }

    // Delete patient or handle discharge logic
    await collection.deleteOne({ registrationID: registrationID });
    const result=(`<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fee Details</title>
    <style>
         body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(to right, #f8f9fa, #e0eafc);
      margin: 0;
      padding: 0;
    }

    .container {
      width: 90%;
      margin: 40px auto;
      background: white;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    }

    h2 {
      text-align: center;
      color: #333;
      margin-bottom: 30px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 16px;
    }

    th, td {
      padding: 12px 15px;
      border-bottom: 1px solid #ddd;
      text-align: center;
    }

    th {
      background-color: rgba(0, 153, 255, 0.656);
      color: white;
    }

    tr:hover {
      background-color: #f1f1f1;
    }

    .home-btn {
      display: block;
      width: 120px;
      margin: 30px auto 0;
      padding: 10px 20px;
      text-align: center;
      background-color: rgba(0, 153, 255, 0.656);
      color: white;
      border: none;
      border-radius: 8px;
      text-decoration: none;
      font-size: 16px;
      transition: background 0.3s ease;
    }

    .home-btn:hover {
      background-color: #0056b3;
    }
    </style>
</head>

<body>
    <div class="container">
    <h2>Patient Discharged Successfully</h2>
        <a href="hospital.html" class="home-btn"><strong>Home</strong></a>
</div>
    
</body>

</html>`)
    res.send(result);
  } catch (err) {
    console.error(err);
    res.send("Error occurred");
  } finally{
    await client.close();
  
  }
});

// Start server

app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
