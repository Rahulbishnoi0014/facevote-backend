const express = require('express');
const mongoose = require("mongoose");
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require("uuid");
const cron = require('node-cron');

const app = express();
app.use(bodyParser.json());
try {
  mongoose.set('strictQuery', false);

  mongoose.connect('mongodb://127.0.0.1:27017/projectX');

  console.log("mongoDB connect");
}
catch (err) {
  console.log("mongoDB NOT connection failed");

}




const voteSchema = new mongoose.Schema({
  votedRollNo: String,
  createdAt: { type: Date, default: Date.now },
});

const Vote = mongoose.model('Vote', voteSchema);

let currentMembers = getRandomRollNumbers();
let currentVotes = {}; // Temporary storage for votes
let winner = null;
let votedDevices = new Set(); // Set to track voted devices/users


let countdownInterval;
let remainingTime = 60000; // Initial countdown time: 60 seconds

// Function to start the countdown timer
const startCountdown = () => {
  countdownInterval = setInterval(() => {
    remainingTime -= 1000;
    if (remainingTime <= 0) {
      clearInterval(countdownInterval);
      remainingTime = 0;
    }
  }, 1000);
};

app.get("/token", async (req, res) => {

  try {
    const newtoken = uuidv4();
    
    res.json({newtoken});

  }
  catch (err) {
    console.log("error genrating token", err);
    res.status(500).json({ error: 'internal server error' });
  }
});
// Function to generate random pair of roll numbers
function getRandomRollNumbers() {
  const minRollNo = 2315000001;
  const maxRollNo = 2315000100;

  const rollNo1 = Math.floor(Math.random() * (maxRollNo - minRollNo + 1)) + minRollNo;
  let rollNo2;
  do {
    rollNo2 = Math.floor(Math.random() * (maxRollNo - minRollNo + 1)) + minRollNo;
  } while (rollNo2 === rollNo1);

  return [String(rollNo1), String(rollNo2)];
}
function determineWinner() {
  // Determine the winner based on some criteria
  // For simplicity, let's assume the winner is the member with the higher roll number
  let maxVotes = 0;
  for (const rollNo in currentVotes) {
    if (currentVotes[rollNo] > maxVotes) {
      maxVotes = currentVotes[rollNo];
      winner = rollNo;
    }
  }
}


app.get('/time', (req, res) => {
  res.json({ time:remainingTime });
});
// API endpoint to get the current pair of members
app.get('/getmembers', (req, res) => {
  
  res.json({ rollNo1: currentMembers[0], rollNo2: currentMembers[1] });
});

// API endpoint to submit a vote
app.post('/vote', (req, res) => {
  const { votedRollNo, deviceId } = req.body;

  // console.log(deviceId);
 
  if (votedDevices.has(deviceId)) {
    return res.sendStatus(207);
  }

  if (!currentMembers.includes(votedRollNo)) {
    return res.sendStatus(404);
  }
  
  currentVotes[votedRollNo] = (currentVotes[votedRollNo] || 0) + 1;
  votedDevices.add(deviceId);
  
  console.log(currentVotes[votedRollNo]);
   return res.sendStatus(200); 

});

app.post("/checkvote",(req,res)=>{
  const { deviceId } = req.body;

  
  if (votedDevices.has(deviceId)) {
    return res.status(200).json({ error: 'You have already voted' });
  }
  else{
    res.status(404);
  }

})


app.get('/winner', (req, res) => {
  // Send the winner to the frontend
  res.json({ winner });
});



cron.schedule('*/1 * * * *', async () => {

  
  determineWinner();
  console.log('Winner:', winner);


  currentVotes = {};
  votedDevices.clear();

  console.log('Votes cleared');

  // Update current members
  currentMembers = getRandomRollNumbers();
  console.log('New members:', currentMembers);
});


app.listen(5000, (x) => {
  if (x)
    console.log("server is NOT running on port 5000");
  else
    console.log("server is running on port 5000");


})

