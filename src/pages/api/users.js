import connectDB from '../../helper/mongodb';
import User from '../../models/User';

connectDB();
export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req, res) { 
// get all users
  if (req.method === 'GET') {
    try {
      const users = await User.find();
      res.status(200).json(users);
    } catch (error) {
      res.status(500).json({ error: 'Error fetching users' });
    }
  } 

// create a new user
  else if (req.method === 'POST') {
    const { username, email, auth0id } = req.body;
    const existingUser = await User.findOne({auth0id})
      if (existingUser){
        res.status(400).json({error:'user already exists'})
      } else {
        try {
          const user = new User({ username, email, auth0id });
          await user.save();
          res.status(201).json(user);
        } catch (error) {
          res.status(500).json({ error: 'Error creating user' });
        }
      }
    
   } 

   else{
    res.status(500).json({error: 'This route method isnt available'})

   }
 //  else if (req.method === 'PATCH'){
  //   const {username} = req.body
  //   try {
  //     const deletedUser = await User.findOneAndDelete({ username })
  //     console.log(deletedUser)
  //     if (!deletedUser){
  //       return res.status(404).json({ error: 'User not found' });
  //     }
  //     res.status(200).json(deletedUser, ' has been deleted')
  //   } catch (error){
  //     res.status(500).json({ error: 'Error deleting user' });
  //   }
  // }
}