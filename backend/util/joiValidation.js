const Joi = require("joi");

const userValidationSchema = Joi.object({
    name: Joi.string().required().label("Name"),
    email: Joi.string().email().required().label("Email"),
    password: Joi.string()
    .pattern(new RegExp('^[a-zA-Z0-9!@#$%&*]{3,30}$'))
    .required()
    .label('Password')
    .messages({
      "string.pattern.base": `Password should be between 3 to 30 characters and contain alpha-numeric values and special characters(@ # $ % & *)`,
      "string.empty": `Password cannot be empty`,
      "any.required": `Password is required`
    })
});

const loginValidationSchema = Joi.object({
  email: Joi.string().email().required().label('Email'),
  password: Joi.string()
    .pattern(new RegExp('^[a-zA-Z0-9!@#$%&*]{5,30}$'))
    .required()
    .messages({
      "string.pattern.base": `Password should be between 5 to 30 characters and contain alpha-numeric values and special characters(@ # $ % & *)`,
      "string.empty": `Password cannot be empty`,
      "any.required": `Password is required`,
    })
});

module.exports = {userValidationSchema, loginValidationSchema}