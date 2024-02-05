import { each, isEmpty, startCase, get, isObject } from "lodash";
import { Model } from "sequelize";
import models from "../models";

const _ = { each, isEmpty, startCase, get, isObject };

const formatSequelizeErrors = (errorsObject: any) => {
  const errors: Record<string, string> = {};

  _.each(errorsObject.errors || [], function (e: any) {
    const field = _.get(e, "path", "");
    const message = _.get(e, "message", "");

    if (!_.isEmpty(field) && !_.isEmpty(message)) {
      errors[field] = message;
    }
  });

  if (errorsObject.customThrow) {
    const field = _.get(errorsObject, "path", "");
    const message = _.get(errorsObject, "message", "");
    errors[field] = message;
  }

  return errors;
};


const dbHelper = {
  formatSequelizeErrors,
};

export default dbHelper;
