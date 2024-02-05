/* eslint-disable no-useless-escape */
// validators/passwordValidator.ts

import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import validator from 'validator';

export const createUserValidationRules = [
    body("email")/* .not().isEmpty().withMessage("Email is required") */
      .isEmail()
      .withMessage("Valid email address is required"),
    body("phone")/* .not().isEmpty()
      .withMessage("Phone number is required") */
      .isLength({ min: 10, max: 13 }).withMessage("Incorrect phone number")
      // .matches(/^(?:(?:\+|0{0,2})91(\s*[\-]\s*)?|[0]?)?[6789]\d{9}$/)
      .matches(/^\d{3}-\d{3}-\d{4}$/)
      .withMessage("Must contains at least digit & valid mobile number"),
    body('role').isIn(['Admin', 'Manager', 'Tenant','Plumber', 'Electrician','Workers']).withMessage('Invalid role'),
  ];

export  const createUserValidationRulesMultipleUser = [
    body()
      .isArray()
      .withMessage('Users should be an array'),
  
    body('users.*.email')
      .isEmail()
      .withMessage('Valid email address is required'),
  
    body('users.*.phone')
      .isLength({ min: 10, max: 13 }).withMessage('Incorrect phone number')
      .matches(/^\d{3}-\d{3}-\d{4}$/)
      .withMessage('Must contain at least digit & valid mobile number'),
  
    body('users.*.role')
      .isIn(['Admin', 'Manager', 'Tenant', 'Plumber', 'Electrician', 'Workers'])
      .withMessage('Invalid role'),
  ];
  
  const validateUsersArray = (req:any, res:any, next:any) => {
    const errors = validationResult(req);
  
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
  
    next();
  };



















export const updateUserValidationRules = [
     body('userName')
    .notEmpty()
    .withMessage('Username is required')
    .matches(/^[a-zA-Z0-9]+$/)
    .withMessage("Username is invalid. It should only contain letters and numbers, with no spaces."),
    body('address')
    /* .notEmpty()
    .withMessage('address is required'), */,
    body('gender').isIn(['Male', 'Female', 'Other']).withMessage('Invalid gender'),
    body("email")/* .not().isEmpty().withMessage("Email is required") */
    .isEmail()
    .withMessage("Valid email address is required"),
    body('role').isIn(['Admin', 'Manager', 'User']).withMessage('Invalid role'),
    body("phone")/* .not().isEmpty()
    .withMessage("Phone number is required") */
    .isLength({ min: 10, max: 13 }).withMessage("Incorrect phone number")
    .matches(/^(?:(?:\+|0{0,2})91(\s*[\-]\s*)?|[0]?)?[6789]\d{9}$/)
    .withMessage("Must contains at least digit & valid mobile number"),
  ];
  
  export const loginValidationRules = [
    body('userNameOrEmail').notEmpty().withMessage('Username or password is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ];
  
  export const singhUpValidationRules = [
    body('userNameOrEmail').notEmpty().withMessage('Username or password is required'),
    body('password').notEmpty().withMessage('Password is required'),
    body("phone").not().isEmpty()
    .withMessage("Phone number is required")
    .isLength({ min: 10, max: 13 }).withMessage("Incorrect phone number")
    .matches(/^(?:(?:\+|0{0,2})91(\s*[-]\s*)?|[0]?)?[6789]\d{9}$/)
    .withMessage("Must contains at least digit & valid mobile number"),
  ];

export const validateChangePassword = (req: Request, res: Response, next: NextFunction) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;

  // Check if newPassword and confirmPassword fields are provided
  if (!newPassword || !confirmPassword) {
    return res.status(400).json({status: 400, message: 'Both new password and confirmation password are required' });
  }

  if (oldPassword === newPassword) {
    return res.status(400).json({status: 400, message: 'Old password and New password cannot be same'});
  }

  // Check if newPassword and confirmPassword match
  if (newPassword !== confirmPassword) {
    return res.status(400).json({status: 400, message: 'New password and confirm password do not match' });
  }

  // You can add additional password complexity checks here if needed

  // If all validations pass, proceed to the next middleware
  next();
};

export const forgotPasswordValidation = [
  body('email')
    .not()
    .isEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Valid email address is required'),
];