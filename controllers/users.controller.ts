/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import { Models } from "../models"; // Import the models/index.ts module
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import appConfig from "../common/appConfig";
import nodemailer from "nodemailer";
import { statusConst, chars} from "../common/statusConstants";
import { get, isEmpty, isObject, omit, find, chain, has } from "lodash";
import { UserInterface } from '../models/users.model';
import { validationResult } from 'express-validator';
import { Op } from 'sequelize';
import * as fs from 'fs';
import multer from 'multer';


const _ = { get, isEmpty, isObject, omit, find, chain, has };

type ResponseObject = {
  status: number;
  deviceToken?:string;
  message: string;
  data?: any; // Make the data property optional
  token?: string;
  userRole?: any;
  userName?: any;
  userId?: number;
  role?: string;
  units_name?: string;
  managerID? : any;
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './assets/profileImage'); // Set the destination folder for profile images
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

export const login = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    let responseData: ResponseObject;
    const { userNameOrEmail, password , deviceToken} = req.body;
    const models: Models = req.app.locals.models;

    // Find the user by either username or email
    const user = await models.users.findOne({
      where: {
        [Op.or]: [
          { userName: userNameOrEmail },
          { email: userNameOrEmail },
        ],
      },
    });

    if (!user) {
      responseData = { status: 404, message: "User not found" };
    } else {
      if (user.get('isActive')) {
        // User is active, continue with the login process
        const validPassword = await bcrypt.compare(password, user.get('password') as string);

        if (validPassword) {
          // Generate a new token for the user
          const token = jwt.sign({ id: user.get('id'), role: user.get('role') }, appConfig.jwtSecretKey);

          const userRole = user?.dataValues.role;
          const userName = user?.dataValues.userName;
          const userId = user?.dataValues.id;
          const managerID = user?.dataValues.managerId;
          user.update({ deviceToken });
          responseData = { status: 200, message: "Login successful",token, userRole, userName, userId, managerID ,deviceToken};
        } else {
          responseData = { status: 401, message: "Invalid Credentials" };
        }
      } else {
        // User is not active, prompt to sign up first
        responseData = { status: 401, message: "Please sign up first" };
      }
    }

    return res.status(responseData.status).json(responseData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const signup = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    let responseData: ResponseObject;
    const { userNameOrEmail, password, phone } = req.body;
    const models: Models = req.app.locals.models;

    // Find the user by username, email, and phone
    const user = await models.users.findOne({
      where: {
        [Op.and]: [
          { [Op.or]: [{ userName: userNameOrEmail }, { email: userNameOrEmail }] },
          { phone: phone },
        ],
      },
    });

    if (!user) {
      responseData = { status: 404, message: "User not found" };
    } else {
      if (!user.get('isActive')) {
        // User is active, continue with the login process
        const validPassword = await bcrypt.compare(password, user.get('password') as string);

        if (validPassword) {
          // Generate a new token for the user
          const token = jwt.sign({ id: user.get('id') }, appConfig.jwtSecretKey, { expiresIn: '1h' });

          const userRole = user?.dataValues.role;
          const userName = user?.dataValues.userName;
          const userId = user?.dataValues.id;

          responseData = { status: 200, message: "Login successful", data: { token }, userRole, userName, userId };

          // Set isActive to true on successful login
          user.update({ isActive: true });
        } else {
          responseData = { status: 401, message: "Invalid password" };
        }
      } else {
        // User is not active,
        responseData = { status: 401, message: "User is already exists, please login" };
      }
    }

    return res.status(responseData.status).json(responseData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const models: Models = req.app.locals.models;
    const loggedInUserRole = req.user.role;
    const managerId = req.headers.managerid;
    let usersData;

    if (loggedInUserRole === 'Admin') {
      usersData = await models.users.findAll({ where: { role: { [Op.in]: ['Admin', 'Manager'] } } });
    } else if (loggedInUserRole === 'Manager') {
      usersData = await models.users.findAll({ where: { role: { [Op.notIn]: ['Manager', 'Admin'] }, managerId: managerId } });

    } else {
      usersData = await models.users.findAll();
    }

    // Fetch and append properties for all managers
    for (let i = 0; i < usersData.length; i++) {
      if (usersData[i].role === 'Manager') {
        const properties = await models.properties.findAll({ where: { userId: usersData[i].id } });
        const propertyIds = properties.map(property => property.id);
        usersData[i].properties = propertyIds;
      }
    }

    res.json(usersData);
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: 500, message: "Internal server error, contact API administrator" });
  }
};

export const getUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const models: Models = req.app.locals.models;
    const user = await models.users.findByPk(id,
      {
        include: [
          {
            model: models.units,
            required: false,
          },
        ]
      });
    if (user) {
      const properties = await models.properties.findAll({ where: { userId: user.id } });
      const propertyIds = properties.map(property => property.id);
      const userWithProperties = { ...user.toJSON(), properties: propertyIds };
      res.json(userWithProperties);
    } else {
      res.status(404).json({ status: 404, message: 'User not found' });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: 500,
      message: "Internal server error, contact API administrator",
    });
  }
};

export const createByAdmin = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { email, phone, role } = req.body;
  const { body } = req;

  try {
    const randomValue = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    body.uniqueId = randomValue;
    body.password = randomValue;

    const userName = req.body.firstName;
    body.userName = userName;

    // Make sure that propertyId is passed as an array in the request body
    const propertyId = req.body.propertyId;
    const uniqueid = body.uniqueId;

    const models: Models = req.app.locals.models;
    const hashPassword = await bcrypt.hash(body.password, appConfig.bcryptSaltRound);
    body.password = hashPassword;

    // Check if the username, email, or phone number already exists in the database
    const existingUser = await models.users.findOne({
      where: {
        [Op.or]: [
          { email: email },
          { phone: phone },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ status: 400, message: "Email is already used" });
      } else {
        return res.status(400).json({ status: 400, message: "Phone number is already used" });
      }
    }

    if (role === 'Admin') {
      // Create the user with the 'Admin' role
      const createdUser = await models.users.create(body);
      await sendUserCredentialEmail(email, uniqueid);
      return res.status(200).json({ status: 200, message: "Admin created successfully", user: createdUser });
    } else if (role === 'Manager') {
      if (!propertyId || propertyId.length === 0) {
        return res.status(400).json({ status: 400, message: "Please provide at least one property ID for the Manager" });
      }

      // Find all the properties based on the property IDs
      const properties = await models.properties.findAll({ where: { id: propertyId } });

      if (!properties || properties.length === 0) {
        return res.status(404).json({ status: 404, message: "Properties not found" });
      }

      // Create the user and store it in a variable
      const createdUser = await models.users.create(body);

      // Update the isActive status for each property and assign the user ID to each property
      const propertyIdsArray = []; // Store property IDs in an array
      for (let i = 0; i < properties.length; i++) {
        if (properties[i].isActive) {
          return res.status(400).json({ status: 400, message: "One of the properties is already assigned to another manager" });
        }
        properties[i].isActive = true;
        properties[i].userId = createdUser.id; // Set the user ID in the property table
        await properties[i].save();
        propertyIdsArray.push(properties[i].id); // Push property IDs to the array
      }

      // Include the propertyIdsArray in the user object
      const userWithPropertyIds = { ...createdUser.toJSON(), propertyId: propertyIdsArray };

      await sendUserCredentialEmail(email, uniqueid);
      return res.status(200).json({ status: 200, message: "Manager created successfully", user: userWithPropertyIds });
    } else {
      return res.status(400).json({ status: 400, message: "Invalid role provided" });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 500, message: "Internal server error, contact API administrator" });
  }
};

export const createByManager = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { email, phone, propertyId, blockId, unitId } = req.body;
  const { body } = req;
  try {
    const models: Models = req.app.locals.models;
    const creatorRole = req.body.role;
    if (creatorRole === 'Tenant') {
      const randomValue = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      body.uniqueId = randomValue;
      body.password = randomValue;
      const userName = req.body.firstName;
      body.userName = userName;
      const uniqueid = body.uniqueId;
      const hashPassword = await bcrypt.hash(body.password, appConfig.bcryptSaltRound);
      body.password = hashPassword;
      const existingUser = await models.users.findOne({
        where: {
          [Op.or]: [
            { email },
            { phone },
          ],
        },
      });

      if (existingUser) {
        if (existingUser.email === email) {
          return res.status(400).json({ status: 400, message: "Email is already used" });
        } else {
          return res.status(400).json({ status: 400, message: "Phone number is already used" });
        }
      }   
      // Create the tenant in the database
      const user = await models.users.create(body);
      // Assign the property, block, and unit to the tenant
      if (propertyId && blockId && unitId) {
        const selectedProperty = await models.properties.findByPk(propertyId);
        const selectedBlock = await models.blocks.findByPk(blockId);
        const selectedUnit = await models.units.findByPk(unitId);

        if (!selectedProperty || !selectedBlock || !selectedUnit) {
          return res.status(404).json({ status: 404, message: "Selected property, block, or unit not found" });
        }
        selectedUnit.isAssign = true;
        selectedUnit.userId = user.id;
        await selectedUnit.save();
        const property = { id: selectedProperty.id, name: selectedProperty.property_name };
        const block = { id: selectedBlock.id, name: selectedBlock.blocks_name };
        const unit = { id: selectedUnit.id, name: selectedUnit.units_name };
        // Update the user object with property, block, and unit details
        const userWithDetails = {
          ...user.toJSON(),
          property,
          block,
          unit
        };
        await sendUserCredentialEmail(email, uniqueid);
        res.status(200).json({ status: 200, message: "Tenant created successfully", user: userWithDetails });
      }
    } else {
      const existingUser = await models.users.findOne({
        where: {
          [Op.or]: [
            { email },
            { phone },
          ],
        },
      });

      if (existingUser) {
        if (existingUser.email === email) {
          return res.status(400).json({ status: 400, message: "Email is already used" });
        } else {
          return res.status(400).json({ status: 400, message: "Phone number is already used" });
        }
      }
      const user = await models.users.create(body);
      res.status(200).json({ status: 200, message: "Worker created successfully", user });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 500, message: "Internal server error, contact API administrator" });
  }
};

export const createByManagerMultiple = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { body } = req;
  try { 
    const models: Models = req.app.locals.models;
    const creatorRole = req.body.role;
      const results = [];
      for (const userData of body) {
        const {
          firstName,
          lastName,
          email,
          phone,
          role,
          propertyId,
          blockId,
          unitId,
          managerId,
        } = userData;
        
        if (role === 'Tenant') {
          const randomValue = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
        const uniqueId = randomValue;
        const password = randomValue;
        const userName = firstName;
        const hashPassword = await bcrypt.hash(password, appConfig.bcryptSaltRound);
        const existingUser = await models.users.findOne({
          where: {
            [Op.or]: [
              { email },
              { phone },
            ],
          },
        });

        if (existingUser) {
          if (existingUser.email === email) {
            results.push({ status: 400, message: "Email is already used" });
          } else {
            results.push({ status: 400, message: "Phone number is already used" });
          }
        } else {
          const user = await models.users.create({
            firstName,
            lastName,
            email,
            phone,
            role,
            uniqueId,
            propertyId,
            unitId,
            blockId,
            managerId,
            password: hashPassword,
            userName,
          });

          if (propertyId && blockId && unitId) {
            const selectedProperty = await models.properties.findByPk(propertyId);
            const selectedBlock = await models.blocks.findByPk(blockId);
            const selectedUnit = await models.units.findByPk(unitId);

            if (!selectedProperty || !selectedBlock || !selectedUnit) {
              results.push({ status: 404, message: "Selected property, block, or unit not found" });
            } else {
              selectedUnit.isAssign = true;
              selectedUnit.userId = user.id;
              await selectedUnit.save();

              const property = { id: selectedProperty.id, name: selectedProperty.property_name };
              const block = { id: selectedBlock.id, name: selectedBlock.blocks_name };
              const unit = { id: selectedUnit.id, name: selectedUnit.units_name };

              const userWithDetails = {
                ...user.toJSON(),
                property,
                block,
                unit,
              };

              await sendUserCredentialEmail(email, uniqueId);
              results.push({ status: 200, message: "Tenant created successfully", user: userWithDetails });
            }
          }
        }
        
      
        }else{
          const randomValue = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
        const uniqueId = randomValue;
        const password = randomValue;

        const userName = firstName;
        const hashPassword = await bcrypt.hash(password, appConfig.bcryptSaltRound);

        const existingUser = await models.users.findOne({
          where: {
            [Op.or]: [
              { email },
              { phone },
            ],
          },
        });

        if (existingUser) {
          if (existingUser.email === email) {
            results.push({ status: 400, message: "Email is already used" });
          } else {
            results.push({ status: 400, message: "Phone number is already used" });
          }
        } else {
          const user = await models.users.create({
            firstName,
            lastName,
            email,
            phone,
            role,
          });
              const userWithDetails = {
                ...user.toJSON(),
              };
              await sendUserCredentialEmail(email, uniqueId);
              results.push({ status: 200, message: "Worker created successfully", user: userWithDetails });
            }
          }
    }
      res.status(200).json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 500, message: "Internal server error, contact API administrator" });
  }
};

const sendUserCredentialEmail = (email: string, uniqueid: string) => {
  // Configure Nodemailer to send the email
  const transporter = nodemailer.createTransport({
    service: "gmail",
    port: 587,
    secure: true,
    auth: {
      user: "aniket.bediskar.5057@gmail.com",
      pass: "rvbbvzbwrgkllhip",
    },
  });

  // Read the HTML template from a file
  fs.readFile('./email_template/userCreate.html', 'utf8', (err, template) => {
    if (err) {
      console.error(err);
      return;
    }

    // Replace placeholders in the template with actual data
    const emailContent = template
      .replace('{{email}}', email)
      .replace('{{uniqueid}}', uniqueid);

    const mailOptions = {
      from: "aniket.bediskar.5057@gmail.com",
      to: email,
      subject: "Your e-Society Login Credentials",
      html: emailContent, // Use HTML content here
    };

    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });
  });
};

export const updateUser = async (req: Request, res: Response) => {
  const { email, phone, role, propertyId, isActive,firstName,lastName } = req.body;

  if (req.body.role == "Admin") {
    const models: Models = req.app.locals.models;
    const admin = await models.users.findByPk(req.params.id);

    if (!admin) {
      return res.status(404).json({ status: 404, message: "Admin not found" });
    }
    
    const updatedFields = {
      email,
      phone,
      // propertyId: req.body.propertyId,
      role,
      firstName,
      lastName,
      // isActive,
    };
    
    await admin.update(updatedFields);
    
    res.status(200).json({ status: 200, message: "Admin updated successfully", admin });
    
  }
  else
  try {
    const models: Models = req.app.locals.models;
    const manager = await models.users.findOne({ where: { id: req.params.id } });
    if (!manager) {
      return res.status(404).json({ status: 404, message: "Manager not found" });
    }

    const currentProperties = await models.properties.findAll({ where: { userId: manager.id } });
    const currentPropertyIDs = currentProperties.map(property => property.id);
    for (let i = 0; i < propertyId.length; i++) {
      const property = await models.properties.findOne({ where: { id: propertyId[i] } });

      if (!property) {
        return res.status(404).json({ status: 404, message: `Property with ID ${propertyId[i]} not found` });
      }

      if (property.isActive && property.userId !== manager.id) {
        return res.status(400).json({ status: 400, message: `Property with ID ${property.id} is already assigned to another manager` });
      }
    }

    // Logic to update propertyId and isActive status based on changes
    const propertiesToAdd = propertyId.filter((id:any) => !currentPropertyIDs.includes(id));
    const propertiesToRemove = currentPropertyIDs.filter(id => !propertyId.includes(id));

    // Update the properties in bulk
    await models.properties.update({ isActive: true, userId: manager.id }, { where: { id: propertiesToAdd } });
    await models.properties.update({ isActive: false, userId: null }, { where: { id: propertiesToRemove } });

    // Fetch the updated property IDs
    const updatedProperties = await models.properties.findAll({ where: { userId: manager.id } });
    const updatedPropertyIDs = updatedProperties.map(property => property.id);
    // Update manager fields
    const updatedFields: any = {}; // Change 'any' to the appropriate type if possible
    if (email) {
      updatedFields.email = email;
    }
    if (phone) {
      updatedFields.phone = phone;
    }
    if (firstName) {
      updatedFields.firstName = firstName;
    }
    if (lastName) {
      updatedFields.lastName = lastName;
    }
    if (role) {
      updatedFields.role = role;
    }
    if (isActive !== undefined) {
      updatedFields.isActive = isActive;
    }

    await manager.update(updatedFields);

    // Include the updated property IDs in the manager object
    manager.propertyId = updatedPropertyIDs;

    const responseUser = {
      isActive: manager.isActive,
      id: manager.id,
      firstName: manager.firstName,
      lastName: manager.lastName,
      email: manager.email,
      phone: manager.phone,
      role: manager.role,
      uniqueId: manager.uniqueId,
      password: manager.password,
      userName: manager.userName,
      updated_at: manager.updated_at,
      created_at: manager.created_at,
      propertyId: manager.propertyId,
    };

    res.status(200).json({ status: 200, message: "Manager updated successfully", manager: responseUser });

  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 500, message: "Internal server error, contact API administrator" });
  }
};

export const updateByManager = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {propertyId, blockId, unitId } = req.body;
  const { body } = req;

  try {
    const models: Models = req.app.locals.models;
    const creatorRole = req.body.role;

    if (creatorRole !== 'Admin') {
      const { id } = req.params; // Assuming you get the user ID from the request parameters

      const existingUser = await models.users.findByPk(id);

      if (!existingUser) {
        return res.status(404).json({ status: 404, message: "User not found" });
      }
    const assignedunits = await models.users.findByPk(id);
    const assignedUnitId = assignedunits?.dataValues.unitId;
    const unitCounts = await models.users.findAll( {where: { unitId: assignedUnitId }});
    const units = await models.units.findByPk(assignedUnitId);
    const unitName = units?.dataValues.units_name  
    
    if (unitCounts.length == 1) { 
      const oldUnitId = existingUser.unitId;
      if (oldUnitId) {
        const oldUnit = await models.units.findByPk(oldUnitId);
        if (oldUnit) {
          oldUnit.isAssign = false;
          oldUnit.userId = null;
          await oldUnit.save();
        }
      }
    }
    

      // Update the user's information
      await existingUser.update(body);

      // Assign the property, block, and unit to the tenant
      if (propertyId && blockId && unitId) {
        const selectedProperty = await models.properties.findByPk(propertyId);
        const selectedBlock = await models.blocks.findByPk(blockId);
        const selectedUnit = await models.units.findByPk(unitId);

        if (!selectedProperty || !selectedBlock || !selectedUnit) {
          return res.status(404).json({ status: 404, message: "Selected property, block, or unit not found" });
        }

        selectedUnit.isAssign = true;
        selectedUnit.userId = existingUser.id;
        await selectedUnit.save();
      }

      // Fetch the updated user information
      const updatedUser = await models.users.findByPk(id);

      // Send the response
      res.status(200).json({ status: 200, message: "User updated successfully", user: updatedUser });
    } else {
      return res.status(400).json({ status: 400, message: "Only tenants can be updated with this endpoint" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 500, message: "Internal server error, contact API administrator" });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const models: Models = req.app.locals.models; 
    const assignedUser = await models.users.findByPk(id);
    const assignedUnitId = assignedUser?.dataValues.unitId;
    if (!assignedUser) {
      return res.status(404).json({ status: 404, message: 'User not found' });
    }
    const unitCounts = await models.users.count({ where: { unitId: assignedUnitId } });
    if (unitCounts === 1) {
      await models.units.update(
        { isAssign: false },
        { where: { id: assignedUnitId } }
      );
    }
    await models.users.destroy({ where: { id } });  
    await models.properties.update(
      { isActive: false, userId: null },
      { where: { userId: id } }
    );
    return res.status(200).json({ status: 200, message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: 500, message: 'Internal server error, contact API administrator' });
  }
};


export const forgotPassword = async (req: Request, res: Response) => {
  let responseData: ResponseObject = { ...statusConst.error };
  const { email } = req.body;

  try {
    const models: Models = req.app.locals.models;
    const user = await models.users.findOne({ where: { email } }) as UserInterface; // Explicitly cast user as UserInterface
  
    if (!user) {
      responseData = { status: 401, message: 'Email is not found' };
    } else {
      const userEmail = user.email;
      const resetToken = jwt.sign({ id: user.id, email: user.email }, appConfig.jwtSecretKey, { expiresIn: '1hr' });

      // Send a reset email to the user using your email sending function
      await sendResetEmail(resetToken, userEmail);

      // Update the user's resetToken property and save it to the database
      user.resetToken = resetToken; // Set the resetToken property
      await user.save(); // Save the user object with the resetToken
      responseData = { ...statusConst.success, message: 'Reset Password link has been sent to your email' };
    }
    return res.status(responseData.status).json(responseData);
  } catch (error) {
    console.error(error);
    res.status(400).json({ status: 400, message: 'Invalid email' });
  }
};

const sendResetEmail = (resetToken: string, userEmail: string) => {
  // Configure Nodemailer to send the reset email
  const transporter = nodemailer.createTransport({
    service: "gmail",
    port: 587,
    secure: true,
    auth: {
      user: "aniket.bediskar.5057@gmail.com",
      pass: "rvbbvzbwrgkllhip",
    },
  });

  // Read the HTML template from a file
  fs.readFile('./email_template/resetPassword.html', 'utf8', (err, template) => {
    if (err) {
      console.error(err);
      return;
    }

    // Replace the {{resetLink}} placeholder with the actual reset link
    const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;
    const emailContent = template.replace('{{resetLink}}', resetLink);

    const mailOptions = {
      from: "aniket.bediskar.5057@gmail.com",
      to: userEmail,
      subject: "Password Reset",
      html: emailContent, // Use HTML content here
    };

    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(error);
      } else {
        console.log("Reset email sent: " + info.response);
      }
    });
  });
};

export const findByToken = async (token: string, req: Request): Promise<{ status: number; data: any }> => {
  try {
    const models: Models = req.app.locals.models;
    const user = await models.users.findOne({where: {token: token}});
    if (!user) {return { status: 404, data: null }}
    return { status: 200, data: user };
  } catch (error) {
    console.error(error);
    throw new Error('Error while finding user by token');
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  let responseData: ResponseObject = { ...statusConst.error };
  const bodyData = _.get(req, "body", {});
  const token: any = _.get(req, "params.token", {});
  try {
    const decodedToken: any = jwt.verify(token, appConfig.jwtSecretKey);
    const userEmail = decodedToken.email;
    const models: Models = req.app.locals.models;
    const user = await models.users.findOne({ where: { email: userEmail } });
    if (!user) {
      responseData = { status: 401, message: "User with this token does not exist" };
    } else if (bodyData.newPassword === bodyData.confirmPassword) {
      const hashedPassword = await bcrypt.hash(bodyData.newPassword, appConfig.bcryptSaltRound);
      await user.update({ password: hashedPassword });
      return res.status(200).json({ status: 200, message: "Password reset successfully" });
    } else {
      responseData = { status: 400, message: "New password and confirm password do not match" };
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
  return res.status(responseData.status).json(responseData);
};

export const changePassword = async (req: Request, res: Response) => {
  let responseData;
  const { oldPassword, newPassword } = req.body;

  const userId = req.user.id; // Get the authenticated user's ID from the token
  try {
    const models: Models = req.app.locals.models;
    const user = await models.users.findByPk(userId) as UserInterface; // Cast user to UserInterface
    if (!user) {
      responseData = { status: 404, message: 'User not found' };
    }

    // Verify that the provided old password matches the stored hashed password
    const passwordMatch = await bcrypt.compare(oldPassword, user.dataValues.password);

    if (!passwordMatch) {
      responseData = { status: 401, message: 'Old password is incorrect' };
    } else if (oldPassword === newPassword) {
      responseData = { status: 400, message: 'New password must be different from the old password' };
    } else {
      // Generate a new hashed password for the user's new password
      const hashedPassword = await bcrypt.hash(newPassword, appConfig.bcryptSaltRound);

      // Update the user's password in the database
      user.password = hashedPassword;
      await user.save();

      // Optionally, generate a new JWT token and send it in the response
      responseData = { status: 200, message: 'Password changed successfully' };
    }

    return res.status(responseData.status).json(responseData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 500, message: 'Internal server error' });
  }
};

export const assignPropertyToManager = async (req: Request, res: Response) => {
  const models: Models = req.app.locals.models;
  const { id } = req.params;

  try {
    const properties = await models.properties.findAll({ where: { userId: id} });

    if (!properties) {
      res.status(404).json({ status: 404, message: "Property not found with this manager" });
    }

    const propertyData = [];
    for (const property of properties) {
      const propertyId = property.dataValues.id;
      const blocks = await models.blocks.findAll({ where: { propertyId: propertyId } });

      const blockData = [];

      for (const block of blocks) {
        const blockId = block.dataValues.id;
        const units = await models.units.findAll({ where: { blockId: blockId } });
        blockData.push({ block: block.dataValues, units });
      }

      propertyData.push({ property: property.dataValues, blocks: blockData });
    }

    res.status(200).json({ status: 200, properties: propertyData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 500, message: "Internal server error, contact API administrator" });
  }
};

const UserServices = {
  createByAdmin,
  login,
  updateUser,
  getUser,
  getUsers,
  deleteUser,
  forgotPassword,
  resetPassword,
  findByToken,
  changePassword,
  createByManager,
  assignPropertyToManager,
  updateByManager
};

export default UserServices;
