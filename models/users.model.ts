import { Sequelize, Model, DataTypes } from 'sequelize';
import Document from "./documents.model"

export interface UserInterface extends Model {
  units: any;
  activeTenantsCount: any;
  id: number;
  userName: string;
  deviceToken:string,
  firstName:string;
  lastName: string;
  uniqueId: any;
  email: string;
  address: string;
  password: string;
  token: string;
  phone: string;
  gender: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  created_at : Date;
  updated_at : Date;
  resetToken: string | null;
  documents?: Document[],
  isAssign?: boolean;
  propertyId: any;
  propertyIds:any;
  properties: any;
  unitId: any;
  users:any;
  blockId: any;
}

export default (sequelize: Sequelize) => {
  // Define associations or additional model-specific configurations here if needed

  const User = sequelize.define<UserInterface>('users', {
    userName: {
      type: DataTypes.STRING,
      field: 'user_name',
      /* unique: true, */
    },
    deviceToken: {
      type: DataTypes.STRING,
      field: 'deviceToken',
      /* unique: true, */
    },
    firstName: {
      type: DataTypes.STRING,
      field: 'first_name', 
    },
    lastName: {
      type: DataTypes.STRING,
      field: 'last_name',
    },
    profileImage: {
      type: DataTypes.STRING,
      field: 'profile_image',
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
    },
    address: {
      type: DataTypes.STRING,
      field: 'address',
    },
    password: {
      type: DataTypes.STRING,
      field: 'password',
    },
    token: {
      field: 'token',
      type: DataTypes.TEXT,
    },
    phone: {
      type: DataTypes.STRING,
      field: 'phone',
      unique: true,
    },
    gender: {
      type: DataTypes.STRING,
      field: 'gender',
    },
    role: {
      type: DataTypes.STRING,
      field: 'role',
    },
    uniqueId: {
      type: DataTypes.STRING,
      field: 'unique_id',
    },
    propertyId: {
      type: DataTypes.INTEGER,
    },
    blockId: {
      type: DataTypes.STRING,
    },
    unitId: {
      type: DataTypes.INTEGER,
    },
    managerId: {
      type: DataTypes.INTEGER,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      field: 'is_active',
      defaultValue: false,
    },
  }, {
    freezeTableName: true,
    tableName: 'users',
    updatedAt: 'updated_at',
    createdAt: 'created_at',
  });   

  return User;
};
