import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGO_URI;
const uri2 = uri.replace("/ikigai?", "/ikigai2?");
const targetEmail = "sh.aniruddha39@gmail.com";

async function run() {
  try {
    const ikigaiDb = await mongoose.createConnection(uri).asPromise();
    const ikigai2Db = await mongoose.createConnection(uri2).asPromise();

    const Participant = ikigaiDb.model('Participant', new mongoose.Schema({}, { strict: false }), 'participants');
    const Shortlisted = ikigaiDb.model('Shortlisted', new mongoose.Schema({}, { strict: false }), 'shortlisteds');
    const TeamLeader = ikigaiDb.model('TeamLeader', new mongoose.Schema({}, { strict: false }), 'teamleaders');
    const SessionChair = ikigaiDb.model('SessionChair', new mongoose.Schema({}, { strict: false }), 'sessionchairs');
    const StudentCoordinator = ikigaiDb.model('StudentCoordinator', new mongoose.Schema({}, { strict: false }), 'studentcoordinators');
    
    const Team = ikigai2Db.model('Team', new mongoose.Schema({}, { strict: false }), 'teams');

    console.log(`Searching for email: ${targetEmail} across all collections...`);

    const results = [];

    // Participants
    const pByCreator = await Participant.find({ createdBy: targetEmail });
    if (pByCreator.length) results.push(`Found ${pByCreator.length} in participants (as createdBy)`);
    
    const pByMember = await Participant.find({ "members.email": targetEmail });
    if (pByMember.length) results.push(`Found ${pByMember.length} in participants (as member email)`);

    // Shortlisteds
    const sByCreator = await Shortlisted.find({ createdBy: targetEmail });
    if (sByCreator.length) results.push(`Found ${sByCreator.length} in shortlisteds (as createdBy)`);
    
    const sByMember = await Shortlisted.find({ "members.email": targetEmail });
    if (sByMember.length) results.push(`Found ${sByMember.length} in shortlisteds (as member email)`);

    // TeamLeaders
    const tls = await TeamLeader.find({ email: targetEmail });
    if (tls.length) results.push(`Found ${tls.length} in teamleaders (as email)`);

    // SessionChairs
    const chairs = await SessionChair.find({ email: targetEmail });
    if (chairs.length) results.push(`Found ${chairs.length} in sessionchairs (as email)`);

    // StudentCoordinators
    const coords = await StudentCoordinator.find({ email: targetEmail });
    if (coords.length) results.push(`Found ${coords.length} in studentcoordinators (as email)`);

    // Teams (ikigai2)
    const teamsLeader = await Team.find({ leaderEmail: targetEmail });
    if (teamsLeader.length) results.push(`Found ${teamsLeader.length} in teams (ikigai2) (as leaderEmail)`);

    const teamsMember = await Team.find({ "members.email": targetEmail });
    if (teamsMember.length) results.push(`Found ${teamsMember.length} in teams (ikigai2) (as member email)`);

    if (results.length === 0) {
      console.log(`Email ${targetEmail} was NOT found anywhere in any collection.`);
    } else {
      console.log(`\nEmail ${targetEmail} found in the following places:`);
      results.forEach(res => console.log(`- ${res}`));
    }

    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

run();
