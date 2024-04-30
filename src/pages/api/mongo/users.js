// users should not have access to this?
// strip can step up post payment to mongo db on its own


import connectDB from '../../../helper/mongodb'
import User from '../../../models/User';
import { middleware } from "../../../middleware/middleware";

connectDB();
export const config = {
  api: {
    bodyParser: true,
  },
};

// function adjustTier(tierString) {
//     // Convert the string to an integer
//     let tierInt = parseInt(tierString, 10);

//     // Check if the conversion is NaN or the value is not within the allowed range
//     if (isNaN(tierInt) || tierInt < 0 || tierInt > 20) {
//         //throw new Error('Tier value is invalid. It must be a number between 0 and 20.');
//         return tierString

//     } else{
//         // Subtract 1 from the tier, but do not let it go below 0
//         tierInt = Math.max(0, tierInt - 1);

//         // Return the adjusted tier
//         return tierInt;
//     }
// }

export default async function handler(req, res) { 
  const result = await middleware(req);

  if (!result.success) {
    res.status(400).json({ success: false, message: result.message });
  } else {

    // get users tier value
    if (req.method === 'POST'){
        try{
            const {auth0id } = req.body;
            if (!auth0id) {
                console.log(" request does not have all field")
                return res.status(400).json({ error: 'auth0id is required' });
            }
            
            const user = await User.findOne({ auth0id });

            if (!user) {
                console.log('user not present')
                return res.status(404).json({ error: 'User not found' });
            }
        
              res.status(200).json(user.tier); // Return the found user
        }catch(error){
            console.log('error getting users tier: ', error)
            res.status(500).json({ success: false, message: 'Server Error', error: error.message });
        }
    }
//     else if (req.method === 'PATCH'){
//    // put users tier value
//         try{
//             const {auth0id } = req.body;
//             if (!auth0id) {
//                 console.log(" request does not have all field")
//                 return res.status(400).json({ error: 'auth0id is required' });
//             }
//             // take the auth0id get the tier value
//             const user = await User.findOne({ auth0id });

//             if (!user) {
//                 console.log('user not present')
//                 return res.status(404).json({ error: 'User not found' });
//             }
        
//             if (!user.tier) {
//                 console.log('User tier is missing or undefined');
//                 return res.status(400).json({ error: 'User tier is missing or undefined and cannot be adjusted' });
//             } else{
//                 let currentTier = user.tier
//                 let newTier = adjustTier(currentTier);
                
//                 user.tier = newTier;
//                 const updatedUser = await user.save();
    
//                 res.status(200).json(updatedUser);    
//             }
                  
            
//         }catch(error){
//             console.log('error updating user tier: ', error)
//             res.status(500).json({ success: false, message: 'Server Error', error: error.message });
//         }
 

//     }
else{
        res.status(405).json({ success: false, message: 'Method Not Allowed' });
    } 

 }

}



// // get all users
//   if (req.method === 'GET') {
//     try {
//       const users = await User.find();
//       res.status(200).json(users);
//     } catch (error) {
//       res.status(500).json({ error: 'Error fetching users' });
//     }
//   } 

// // create a new user
//   else if (req.method === 'POST') {
//     const { username, email, auth0id } = req.body;
//     const existingUser = await User.findOne({auth0id})
//       if (existingUser){
//         res.status(400).json({error:'user already exists'})
//       } else {
//         try {
//           const user = new User({ username, email, auth0id });
//           await user.save();
//           res.status(201).json(user);
//         } catch (error) {
//           res.status(500).json({ error: 'Error creating user' });
//         }
//       }
    
   

//   }
//  //  else if (req.method === 'PATCH'){
//   //   const {username} = req.body
//   //   try {
//   //     const deletedUser = await User.findOneAndDelete({ username })
//   //     console.log(deletedUser)
//   //     if (!deletedUser){
//   //       return res.status(404).json({ error: 'User not found' });
//   //     }
//   //     res.status(200).json(deletedUser, ' has been deleted')
//   //   } catch (error){
//   //     res.status(500).json({ error: 'Error deleting user' });
//   //   }
//   // }
