// block.model.ts

import { Sequelize, Model, DataTypes } from 'sequelize';
export interface BlocksInterface extends Model {
  id: number;
  blocks_name: string;
  propertyId: number
  created_at: any
  updated_at: any
  units: any,
  property: any,
  blocks: any,
  name: any;
}

export default (sequelize: Sequelize) => {
  const Blocks = sequelize.define<BlocksInterface>('blocks', {
    blocks_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    propertyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
  },
  {
    freezeTableName: true,
    tableName: "blocks",
    updatedAt: "updated_at",
    createdAt: "created_at"
  });


  return Blocks;
};