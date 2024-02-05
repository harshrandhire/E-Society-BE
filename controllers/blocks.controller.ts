import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { BlocksInterface } from '../models/blocks.model';
import { Models } from '../models';

export const createBlocks = async (req: Request, res: Response) => {
  try {
    const { blocks_name, propertyId } = req.body;

    // Get the Sequelize models instance from app.locals
    const models: Models = req.app.locals.models;

    // Check if the property ID exists
    const property = await models.properties.findByPk(propertyId);
    if (!property) {
      return res.status(400).json({ status: 400, message: 'Property ID not found' });
    }

    // Check if the block already exists
    const existingBlock = await models.blocks.findOne({ where: { blocks_name, propertyId } });

    if (existingBlock) {
      return res.status(400).json({ status: 400, message: 'This block has already been created' });
    }

    // Create a new blocks record in the database
    const blocksData: Partial<BlocksInterface> = {
      blocks_name,
      propertyId,
    };

    const newBlocks = await models.blocks.create(blocksData);
    return res.status(200).json({ status: 200, message: "Blocks created successfully", Blocks: newBlocks });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: 500, error: 'Server error' });
  }
};

export const getBlock = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const models: Models = req.app.locals.models;
    const blocks = await models.blocks.findByPk(id, {
      include: [
        {
          model: models.units,
          include: [
            {
              model: models.users,
              attributes: ["firstName"],
              required: false,
            },
          ],
        },
        models.properties, // Include the properties model
      ],
    });
    if (blocks) {
      const units = blocks.units.map((item: any) => {
        return {
          id: item.id,
          units_name: item.units_name,
          blockId: item.blockId,
          userId: item.userId,
          isAssign: item.isAssign,
          created_at: item.created_at,
          updated_at: item.updated_at,
          blocks_name: blocks.blocks_name,
          firstName: item.user ? item.user.firstName : "", // Extract firstName from the user model
        };
      });
      const modifiedBlocks = {
        id: blocks.id,
        blocks_name: blocks.blocks_name,
        propertyId: blocks.propertyId,
        property_name: blocks.property ? blocks.property.property_name : "", // Extract property_name from the properties model
        created_at: blocks.created_at,
        updated_at: blocks.updated_at,
        units: units,
      };
      res.json({ status: 200, blocks: modifiedBlocks }); // Respond with the modified blocks data
    } else {
      res.status(404).json({ status: 404, message: 'blocks not found' });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: 500,
      message: "Internal server error, contact API administrator",
    });
  }
};

export const getBlocks = async (req: Request, res: Response) => {
  try {
    const models: Models = req.app.locals.models; // Access models from app.locals
    const blocks = await models.blocks.findAll({
       include: [
           {
               model: models.properties,
               required: false,
           }
       ]
    });
    if (blocks) {
      res.status(200).json({ status: 200, blocks });
    } else {
      res.status(404).json({ status: 404, message: "Blocks not found" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: 500, message: "Internal server error, contact API administrator" });
  }
};

export const updateBlock = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
      const { blocks_name, propertyId } = req.body;
      const models: Models = req.app.locals.models;
      const block = await models.blocks.findByPk(id);

      if (!block) {
          return res.status(404).json({ status: 404, message: 'Block not found' });
      }

      // Check if the property ID exists
      const property = await models.properties.findByPk(propertyId);
      if (!property) {
          return res.status(400).json({ status: 400, message: 'Property ID not found' });
      }

      // Update the block data
      block.blocks_name = blocks_name;
      await block.save();

      return res.status(200).json(block);
  } catch (error) {
      console.error(error);
      return res.status(500).json({
          status: 500,
          message: 'Internal server error, contact API administrator',
      });
  }
};

export const deleteBlock = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const models: Models = req.app.locals.models;
    const block = await models.blocks.findByPk(id);

    if (block) {
      // Check if the block is being used in the units table
      const usedBlock = await models.units.findOne({ where: { blockId: id } });

      if (usedBlock) {
        return res.status(400).json({ status: 400, message: 'Block is used in units and cannot be deleted' });
      } else {
        await block.destroy();
        return res.status(200).json({ status: 200, message: 'Block deleted successfully' });
      }
    } else {
      return res.status(404).json({ status: 404, message: 'Block not found' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: 500,
      message: 'Internal server error, contact API administrator',
    });
  }
};

export const getTotalBlockNumber = async (req: Request, res: Response) => {
  try {
    const models: Models = req.app.locals.models;
    const totalBlocks = await models.blocks.count();
    res.status(200).json({ status: 200, totalBlocks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 500, message: 'Internal server error, contact API administrator' });
  }
};


const Services = {
  createBlocks,
  getBlocks,
  getBlock,
  updateBlock,
  deleteBlock,
  getTotalBlockNumber
};

export default Services;
