import { Request, Response } from "express";
import path from "path";
import { UnitsInterface } from "../models/units.model";
import { Models } from "../models";

export const createUnits = async (req: Request, res: Response) => {
    try {
      const { units_name, blockId, from, to } = req.body;
      const models: Models = req.app.locals.models;
  
      if (!blockId) {
        return res.status(400).json({ status: 400, message: "Block ID is required" });
      }
  
      // Check if the block exists
      const block = await models.blocks.findByPk(blockId);
      if (!block) {
        return res.status(400).json({ status: 400, message: `Block with ID ${blockId} not found` });
      }
  
      if (units_name) {
        // Create a new unit record in the database
        const unitsData: Partial<UnitsInterface> = {
          units_name,
          blockId,
        };
  
        const newUnit = await models.units.create(unitsData);
  
        return res.status(200).json({
          status: 200,
          message: "Unit created successfully",
          unit: newUnit,
        });
      } else if (from && to) {
        // Create multiple units based on the specified range
        const unitsArray: Partial<UnitsInterface>[] = [];
  
        for (let i = parseInt(from); i <= parseInt(to); i++) {
          const unitsData: Partial<UnitsInterface> = {
            units_name: i.toString(),
            blockId,
          };
          unitsArray.push(unitsData);
        }
  
        const newUnits = await models.units.bulkCreate(unitsArray);
  
        return res.status(200).json({
          status: 200,
          message: "Units created successfully",
          units: newUnits,
        });
      } else {
        // Handle error for invalid request body
        return res.status(400).json({ status: 400, message: "Invalid request body" });
      }
    } catch (error) {
      console.error("Error creating units:", error);
      return res.status(500).json({ status: 500, error: "Server error" });
    }
  };

export const getUnit = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const models: Models = req.app.locals.models;
    const units = await models.units.findByPk(id, {
      include: [
        {
          model: models.users,
          required: false,
          attributes: ["unitId", "firstName", "lastName"],
        },
        {
          model: models.blocks,
          required: false,
          attributes: ["blocks_name"],
        },
      ],
    });
    
    if (units) {
      const modifiedResponse = {
        id: units.id,
        units_name: units.units_name,
        blockId: units.blockId,
        blocks_name: units.block ? units.block.blocks_name : null,
        userId: units.userId,
        isAssign: units.isAssign,
        created_at: units.created_at,
        updated_at: units.updated_at,
        tenants: units.users
          ? units.users.map((tenant: any) => ({
              firstName: tenant.firstName,
              lastName: tenant.lastName,
              unitId: tenant.unitId,
            }))
          : [],
      };
      res.json(modifiedResponse);
    } else {
      res.status(404).json({ status: 404, message: "units not found" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: 500,
      message: "Internal server error, contact API administrator",
    });
  }
};

export const getUnits = async (req: Request, res: Response) => {
  try {
    const models: Models = req.app.locals.models; // Access models from app.locals
    const units = await models.units.findAll({
      include: [
        {
          model: models.blocks,
          required: false,
        },
        {
          model: models.users,
          required: false,
          attributes: ["userName"], // Include the userName attribute
        },
      ],
    });
    if (units) {
      const modifiedUnits = units.map((unit) => ({
        id: unit.id,
        units_name: unit.units_name,
        blockId: unit.blockId,
        userId: unit.userId,
        userName: unit.user ? unit.user.userName : null, // Extract userName from the user object
        blocks_name: unit.block ? unit.block.blocks_name : null,
      }));
      res.status(200).json({ status: 200, units: modifiedUnits });
    } else {
      res.status(404).json({ status: 404, message: "Unit not found" });
    }
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({
        status: 500,
        message: "Internal server error, contact API administrator",
      });
  }
};

export const assignUnit = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const { units_name, blockId, userId, isAssign } = req.body;
    const models: Models = req.app.locals.models;
    const unit = await models.units.findByPk(id);

    if (unit) {
      // Check if any of the users are already assigned to another unit
      for (let i = 0; i < userId.length; i++) {
        const userExistingUnit = await models.units.findOne({
          where: { userId: userId[i], isAssign: true },
        });

        if (
          userExistingUnit &&
          isAssign === "1" &&
          userExistingUnit.id !== unit.id
        ) {
          return res
            .status(400)
            .json({
              status: 400,
              message: "User is already assigned another unit",
            });
        }
      }

      // Check the users' roles before updating
      for (let i = 0; i < userId.length; i++) {
        const user = await models.users.findByPk(userId[i]); // Assuming you have a 'users' model

        if (!user || user.role !== "Tenant") {
          return res
            .status(400)
            .json({
              status: 400,
              message: `Error: User with ID ${userId[i]} is not a Tenant. Please select a Tenant.`,
            });
        }
      }

      // Update the unit data
      unit.units_name = units_name;
      unit.blockId = blockId;
      unit.userId = isAssign === "0" ? null : userId;
      unit.isAssign = isAssign === "0" ? false : true; // Assuming isAssign is a boolean
      unit.isActive = true; // Set isActive to true

      await unit.save();

      // Update the user's unitId in the users model
      for (let i = 0; i < userId.length; i++) {
        const user = await models.users.findByPk(userId[i]);
        if (user) {
          user.unitId = isAssign === "0" ? null : id;
          await user.save();
        }
      }

      // Update the unitId and isActive in the units table
      unit.userId = userId;
      unit.isActive = true;
      await unit.save();

      return res
        .status(200)
        .json({
          status: "200",
          message: "Unit and user updated successfully",
          unit,
        });
    } else {
      return res.status(404).json({ status: 404, message: "Units not found" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: 500,
      message: "Internal server error, contact API administrator",
    });
  }
};

export const updateUnits = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const { units_name, blockId } = req.body;
    const models: Models = req.app.locals.models;
    const units = await models.units.findByPk(id);

    if (units) {
      // Check if the block exists
      const block = await models.blocks.findByPk(blockId);
      if (!block) {
        return res
          .status(400)
          .json({ status: 400, message: `Block with ID ${blockId} not found` });
      }

      // Update the units data
      units.units_name = units_name;
      units.blockId = blockId;

      await units.save();

      return res
        .status(200)
        .json({ status: 200, message: "Units updated successfully", units });
    } else {
      return res.status(404).json({ status: 404, message: "Units not found" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: 500, error: "Server error" });
  }
};

export const deleteUnit = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const models: Models = req.app.locals.models;
    const unit = await models.units.findByPk(id);

    if (unit) {
      if (unit.isAssign) {
        return res
          .status(400)
          .json({ status: 400, message: "Unit is assigned to a user" });
      } else {
        await unit.destroy();
        return res
          .status(200)
          .json({ status: 200, message: "Units deleted successfully" });
      }
    } else {
      return res.status(404).json({ status: 404, message: "Units not found" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: 500,
      message: "Internal server error, contact API administrator",
    });
  }
};

export const multipledeleteUnits = async (req: { query: any; body(arg0: string, body: any): unknown; params: any, app: any }, res: Response) => {
  const ids = req.query.ids;
  const idsArray = ids.split(',').map(Number);

  try {
    const models: Models = req.app.locals.models;

    // Check if any of the units are assigned
    const assignedUnits = await models.units.findAll({
      where: {
        id: idsArray,
        isAssign: true,
      },
    });

    if (assignedUnits.length > 0) {
      const assignedIds = assignedUnits.map((unit) => unit.id);
      return res.status(400).json({
        status: 400,
        message: `Units with IDs ${assignedIds.join(', ')} are assigned to a user. Cannot delete assigned units.`,
      });
    }

    // Delete units that are not assigned
    const deletedUnits = await models.units.destroy({
      where: {
        id: idsArray,
        isAssign: false,
      },
    });

    if (deletedUnits > 0) {
      return res.status(200).json({
        status: 200,
        message: "Units deleted successfully",
      });
    } else {
      return res.status(404).json({
        status: 404,
        message: "No unassigned units found for deletion",
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: 500,
      message: "Internal server error, contact API administrator",
    });
  }
};

export const getUnassignedTenants = async (req: Request, res: Response) => {
  try {
    const models: Models = req.app.locals.models; // Access models from app.locals

    // Find all users with the role of Tenant and a null unitId
    const unassignedTenants = await models.users.findAll({
      where: {
        role: "Tenant",
        unitId: null,
      },
    });

    if (unassignedTenants) {
      res.status(200).json({ status: 200, unassignedTenants });
    } else {
      res
        .status(404)
        .json({ status: 404, message: "Unassigned tenants not found" });
    }
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({
        status: 500,
        message: "Internal server error, contact API administrator",
      });
  }
};

export const unAssignUnit = async (req: Request, res: Response) => {
  try {
    const { units_name, blockId, userId } = req.body;
    const models: Models = req.app.locals.models;

    // Find the unit based on the provided units_name and blockId
    const unit = await models.units.findOne({
      where: {
        units_name: units_name,
        blockId: blockId,
        userId: userId,
      },
    });

    if (unit) {
      // Update the unit data to unassign the unit
      unit.userId = null;
      unit.isAssign = 0; // Assuming you want to set isAssign to 0
      await unit.save();

      // Update the user's unitId in the users model for each user in the array
      for (let i = 0; i < userId.length; i++) {
        const user = await models.users.findByPk(userId[i]);
        if (user) {
          user.unitId = null;
          await user.save();
        }
      }

      return res
        .status(200)
        .json({ status: 200, message: "Unit unassigned successfully", unit });
    } else {
      return res.status(404).json({ status: 404, message: "Unit not found" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: 500,
      message: "Internal server error, please contact the API administrator",
    });
  }
};

export const getAvailableUnits = async (req: Request, res: Response) => {
  try {
    const models: Models = req.app.locals.models;
    const totalUnits = await models.units.count();
    res.status(200).json({ status: 200, totalUnits });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({
        status: 500,
        message: "Internal server error, contact API administrator",
      });
  }
};

const Services = {
  createUnits,
  getUnits,
  getUnit,
  assignUnit,
  deleteUnit,
  getUnassignedTenants,
  unAssignUnit,
  getAvailableUnits,
  updateUnits,
  multipledeleteUnits
};

export default Services;
