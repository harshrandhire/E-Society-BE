// properties.model.ts

import { Sequelize, Model, DataTypes } from 'sequelize';
import sequelize from '../config'; // Import your Sequelize instance


export interface PropertyInterface extends Model {
  blockCount: any;
  [x: string]: any;
  tenants: any;
  units: any;
  id: number;
  property_name: string;
  property_description: string;
  property_location: string;
  country:string;
  state:string;
  street:string;
  zipcode:string;
  created_at: any;
  updated_at: any;
  blocks: any;
  isActive: any;
  userId: any;
  propertyName: any;
  dataValues: any;
  name:any;
  tickets: any;
  properties: any;
  
}

export default (sequelize: Sequelize) => {
  const Property = sequelize.define<PropertyInterface>('properties', {
    property_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    property_description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    country: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    state: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    street: {
      type: DataTypes.STRING,
      allowNull: false,
    }, 
    zipcode: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      field: 'is_active',
      defaultValue: false,
    },
  },
    {
      freezeTableName: true,
      tableName: "properties",
      updatedAt: "updated_at",
      createdAt: "created_at"
    });

  // Define the association with the User model

  return Property;
};