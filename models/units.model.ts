// unit.model.ts

import { Sequelize, Model, DataTypes } from 'sequelize';

export interface UnitsInterface extends Model {
  unitsCount: any;
  id: number;
  units_name: string;
  blockId: number;
  userId: any;
  isAssign: any;
  updated_at: any;
  created_at: any;
  user: any;
  block: any;
  isActive: any;
  tenantCount: any;
  users: any;
  propertyId: any;
  name: any;
}

export default (sequelize: Sequelize) => {
  const Units = sequelize.define<UnitsInterface>('units', {
    units_name: {
      type: DataTypes.STRING,
      allowNull: false,
    }, 
    blockId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      }, 
    isAssign: {
        type: DataTypes.BOOLEAN,
        field: 'is_assign',
        defaultValue: false,
      },  
  },
  {
    freezeTableName: true,
    tableName: "units",
    updatedAt: "updated_at",
    createdAt: "created_at"
  });


  return Units;
};