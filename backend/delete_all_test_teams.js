import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGO_URI;
const uri2 = uri.replace("/ikigai?", "/ikigai2?");

const teamNamesToDelete = [
  "Test A",
  "Test B",
  "Test C",
  "Test D",
  "Test E",
  "Test F",
  "Test G",
  "Test H",
  "Test Team Alpha",
  "Alpha Strikers Test",
  "UrbnCloud (test team)",
  "User Test Team 2",
  "IKIGAI",
  "TeamVK",
  "Test Team K",
  "User Test Team",
  "Dummy Team 1",
  "Dummy Team 2",
  "Dummy Team 3"
];

async function run() {
  try {
    const ikigaiDb = await mongoose.createConnection(uri).asPromise();
    const ikigai2Db = await mongoose.createConnection(uri2).asPromise();

    const Participant = ikigaiDb.model('Participant', new mongoose.Schema({}, { strict: false }), 'participants');
    const Shortlisted = ikigaiDb.model('Shortlisted', new mongoose.Schema({}, { strict: false }), 'shortlisteds');
    const TeamLeader = ikigaiDb.model('TeamLeader', new mongoose.Schema({}, { strict: false }), 'teamleaders');
    
    const Team = ikigai2Db.model('Team', new mongoose.Schema({}, { strict: false }), 'teams');

    console.log("Looking for teams to delete: ", teamNamesToDelete.length, "teams");

    const pDel = await Participant.deleteMany({ teamName: { $in: teamNamesToDelete } });
    console.log(`Deleted ${pDel.deletedCount} from participants.`);

    const sDel = await Shortlisted.deleteMany({ teamName: { $in: teamNamesToDelete } });
    console.log(`Deleted ${sDel.deletedCount} from shortlisteds.`);

    const tlDel = await TeamLeader.deleteMany({ teamName: { $in: teamNamesToDelete } });
    console.log(`Deleted ${tlDel.deletedCount} from teamleaders.`);

    const tDel = await Team.deleteMany({ teamName: { $in: teamNamesToDelete } });
    console.log(`Deleted ${tDel.deletedCount} from teams (ikigai2).`);

    console.log("Deletion complete.");
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

run();
