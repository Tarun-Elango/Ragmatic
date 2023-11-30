import connectDB from '../../../helper/mongodb';
import User from '../../../models/User';

connectDB();
export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const users = await User.find();
      res.status(200).json(users);
    } catch (error) {
      res.status(500).json({ error: 'Error fetching users' });
    }
  } else if (req.method === 'POST') {
    console.log(req.body);
    const { username, email } = req.body;
    const existingUser = await User.findOne({username})
      if (existingUser){
        
        res.status(400).json({error:'user already exists'})
      } else {
        try {
          const user = new User({ username, email });
          await user.save();
          res.status(201).json(user);
        } catch (error) {
          res.status(500).json({ error: 'Error creating user' });
        }
      }
    
  } else if (req.method === 'PATCH'){
    const {username} = req.body
    try {
      const deletedUser = await User.findOneAndDelete({ username })
      console.log(deletedUser)
      if (!deletedUser){
        return res.status(404).json({ error: 'User not found' });
      }
      res.status(200).json(deletedUser, ' has been deleted')
    } catch (error){
      res.status(500).json({ error: 'Error deleting user' });
    }
  }
}
