/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import { PropertyInterface } from '../models/properties.model';
import { Models } from '../models';
import { Op } from 'sequelize';
import { Sequelize } from 'sequelize';
// import sequelize from 'sequelize/types/sequelize';


export const createProperty = async (req: Request, res: Response) => {
  try {
    const { property_name, property_description , country, state, street , zipcode } = req.body;

    // Create a new properties record in the database
    const propertiesData: Partial<PropertyInterface> = {
      property_name,
      property_description,
      country,
      state,
      street,
      zipcode,
    };

    // Get the Sequelize models instance from app.locals
    const models: Models = req.app.locals.models;

    // Create a new document using the Document model
    const newPropety = await models.properties.create(propertiesData);
    return res.status(200).json({ status:200, message: "Property create successfully" ,Property: newPropety,});
  }
  catch (error) {
    console.error(error);
    return res.status(500).json({ status: 500, error: 'Server error' });
  }
};

export const getProperty = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const models: Models = req.app.locals.models;
    const property = await models.properties.findByPk(id, {
      include: [
        {
          model: models.blocks,
          include: [
            {
              model: models.properties,
              attributes: ["property_name"],
            },
            {
              model: models.units,
            },
          ],
        },
      ],
    });
    if (property) {
      const modifiedBlocks = property.blocks.map((block: any) => {
        return {
          id: block.id,
          blocks_name: block.blocks_name,
          propertyId: block.propertyId,
          created_at: block.created_at,
          updated_at: block.updated_at,
          property_name: property.property_name,
          units: block.units,
        };
      });

      const modifiedProperty = {
        id: property.id,
        property_name: property.property_name,
        property_description: property.property_description,
        property_location: property.property_location,
        created_at: property.created_at,
        updated_at: property.updated_at,
        blocks: modifiedBlocks,
      };

      res.status(200).json({ status: 200, property: modifiedProperty });
    } else {
      res.status(404).json({ status: 404, message: "property not found" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: 500,
      message: "Internal server error, contact API administrator",
    });
  }
};

export const getProperties = async (req: Request, res: Response) => {
  try {
    const models: Models = req.app.locals.models;
    let properties;

    if (!req.headers.managerid) {
      properties = await models.properties.findAll({
        order: [['created_at', 'DESC']],
        include: [{ model: models.ticket }],
      });
    } else {
      properties = await models.properties.findAll({
        where: { userId: req.headers.managerid },
        order: [['created_at', 'DESC']],
        include: [{ model: models.ticket }],
      });
    }
    properties =  properties.length > 0 ? properties : [];
    res.status(200).json({ status: 200, properties });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 500, message: "Internal server error, contact API administrator" });
  }
};


export const updateProperty = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const { property_name, property_description ,country,state,street,zipcode,} = req.body;
    const models: Models = req.app.locals.models;
    const property = await models.properties.findByPk(id);

    if (property) {
      property.property_name = property_name;
      property.property_description = property_description;
      property.country = country;
      property.state = state; 
      property.street = street;
      property.zipcode = zipcode;
      await property.save();
      return res.status(200).json({ status: 200, message: "property update sucessfully" , property});
    } else {
      return res.status(404).json({ status: 404, message: 'Property not found' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: 500,
      message: 'Internal server error, contact API administrator',
    });
  }
};

export const deleteProperty = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const models: Models = req.app.locals.models;
    const property = await models.properties.findByPk(id);

    if (!property) {
      return res.status(404).json({ status: 404, message: 'Property not found' });
    }

    if (property.isActive) {
      return res.status(400).json({ status: 400, message: 'Property is assigned to a manager and cannot be deleted until unassigned' });
    }

    const usedProperty = await models.blocks.findOne({ where: { propertyId: id } });
    if (usedProperty) {
      return res.status(400).json({ status: 400, message: 'Property is used in blocks and cannot be deleted' });
    } else {
      await property.destroy();
      return res.status(200).json({ status: 200, message: 'Property deleted successfully' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: 500,
      message: 'Internal server error, contact API administrator',
    });
  }
};

export const getAvailableProperty = async (req: Request, res: Response) => {
  try {
    const models: Models = req.app.locals.models; // Access models from app.locals

    // Find all the properties where isActive is false
    const inactiveProperties = await models.properties.findAll({
      where: {
        isActive: false, // Add the condition for isActive here
      },
    });

    if (inactiveProperties) {
      res.status(200).json({ status: 200, inactiveProperties });
    } else {
      res.status(404).json({ status: 404, message: "Inactive properties not found" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: 500, message: "Internal server error, contact API administrator" });
  }
};

export const getTotalPropertyNumber = async (req: Request, res: Response) => {
  try {
    const models: Models = req.app.locals.models;

    const totalProperties = await models.properties.count();
    const totalManagers = await models.users.count({ where: { role: 'Manager' } });
    const totalTenants = await models.users.count({ where: { role: 'Tenant' } });
    const totalWorkers = await models.users.count({ where: { role: { [Op.in]: ['Engineer', 'Plumber',] } } });

    res.json({
      totalProperties,
      totalManagers,
      totalTenants,
      totalWorkers
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: 500, message: "Internal server error, contact API administrator" });
  }
};

export const getCountsForManager = async (req: Request, res: Response) => {
  const managerId = req.headers.managerid
  
  try {
    const models: Models = req.app.locals.models;
    
    // const findmanagerProperties = await models.users.findAll({ where: { id: managerId } });
    const properties = await models.properties.findAll({ where: { userId: managerId } });
    const propertyIds = properties.map(property => property.id);
    
    // Total Blocks
    const TotalBlocksGetails = await models.blocks.findAll({where: {propertyId: propertyIds}});
    const blockIds = TotalBlocksGetails.map(block => block.id);
    const TotalBlocks = blockIds.length
    
    // Number of tenants
    const numberOfTenants = await models.users.count({ where: { role: 'Tenant', managerId: managerId } });

    
    // Occupied Units
    const occupiedUnits = await models.units.count({
      where: {
        isAssign: true,
        blockId: blockIds // Assuming blockIds is an array
      }
    });

    // Available Units
    const availableUnits = await models.units.count({
      where: {
        isAssign: false,
        blockId: blockIds // Assuming blockIds is an array
      }
    });


    res.json({ numberOfTenants, occupiedUnits, availableUnits, TotalBlocks });
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: 500, message: "Internal server error, contact API administrator" });
  }
};

export const getCountsForAdminTable = async (req: Request, res: Response) => {
  try {
    const models: Models = req.app.locals.models;
    const blockCounts = await models.properties.findAll({
      attributes: [
        "id",
        "property_name",
        [
          Sequelize.fn("COUNT", Sequelize.literal("DISTINCT(`blocks`.`id`)")),
          "blockCount",
        ],
      ],
      include: [
        {
          model: models.blocks,
          attributes: ["id"],
          required: false,
        },
      ],
      group: ["properties.id"],
      raw: true,
    });

    const unitsCount = await models.units.findAll({
      attributes: [
        "blockId",
        [
          Sequelize.fn("COUNT", Sequelize.literal("DISTINCT(`id`)")),
          "unitsCount",
        ],
      ],
      group: ["blockId"],
      raw: true,
    });
    const users = await models.users.findAll({
      attributes: [
        "propertyId",
        [
          Sequelize.fn("COUNT", Sequelize.literal("DISTINCT(`id`)")),
          "activeTenantsCount",
        ],
      ],
      where: {
        isActive: true,
        role: "Tenant",
      },
      group: ["propertyId"],
      raw: true,
    });
    console.log("blockCounts====>", blockCounts);
    console.log("unitsCount====>", unitsCount);
    console.log("users====>", users);

    const result = blockCounts.map((block) => {
      const propertyId = block.id;
      const propertyName = block.property_name;
      const blocksCount = block.blockCount;
      const matchingUnits = unitsCount.find(
        (unit) => unit.blockId === propertyId
      );
      const unitsCountValue = matchingUnits ? matchingUnits.unitsCount : 0;
      const matchingUsers = users.find(
        (user) => user.propertyId === propertyId
      );
      const usersCount = matchingUsers ? matchingUsers.activeTenantsCount : 0;

      return {
        propertyId,
        propertyName,
        blocksCount,
        unitsCount: unitsCountValue,
        usersCount,
      };
    });
    res.json(result);
    
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: 500, message: "Internal server error, contact API administrator" });
  }
};

export const getCountsForManagerTable = async (req: Request, res: Response) => {
  try {
    const models: Models = req.app.locals.models;

    const properties = await models.properties.findAll({
      include: [
        {
          model: models.blocks,
          attributes: ['id', 'propertyId'],
          include: {
            model: models.units,
            attributes: ['id', 'isAssign'] as any,
          },
        },
      ] as any,
      where: {userId: req.headers.managerid}
    });

    const formattedCounts = properties.map((property) => {
      const { property_name, blocks } = property;
      const totalUnits = blocks.reduce((acc:any, block:any) => acc + block.units.length, 0);
      const occupiedUnits = blocks.reduce(
        (acc:any, block:any) => acc + block.units.filter((unit:any) => unit.isAssign).length,
        0
      );
      const vacantUnits = totalUnits - occupiedUnits;
      return { property_name, blocks: blocks.length, occupiedUnits, vacantUnits };
    });

    res.json(formattedCounts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 500, message: "Internal server error, contact API administrator" });
  }
};

const Services = {
  createProperty,
  getProperties,
  getProperty,
  updateProperty,
  deleteProperty,
  getAvailableProperty,
  getCountsForManagerTable
};

export default Services;
