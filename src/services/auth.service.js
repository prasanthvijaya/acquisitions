
import logger from '#config/logger.js';
import bcrypt  from 'bcrypt';
import {eq} from 'drizzle-orm';
import { db } from '#config/database.js';
import {users} from '#models/user.model.js';

export const hashPassword = async(password)=>{
  try{
    return await bcrypt.hash(password, 10);
  }catch(e){
    logger.error(`Error hashing the password: ${e}`);
    throw new Error('Error hashing', {cause: e});
  }
};

export const createUser = async({name, password, email, role= 'user'})=>{
  try{
    const [existingUser] = await db.select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if(existingUser)
      throw new Error('User with this email already exists');

    const passwordHash = await hashPassword(password);
    const [newUser] = await db.insert(users).values({name, email, password: passwordHash, role})
      .returning({id: users.id, name: users.name, email: users.email, role:users.role, created_at: users.created_at});

    logger.info(`User ${newUser.id} created successfully`);
    return newUser;
        
  }catch(e){
    logger.error(`Error while creating a USER: ${e}`);
    throw e;
  }

};