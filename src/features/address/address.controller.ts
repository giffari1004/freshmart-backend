import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { validate } from "../../validate/validate";
import { AddressValidation } from "./address.validation";
import { AddressService } from "./address.service";

export class AddressController {
  static async getAll(req: Request, res: Response) {
    const addresses = await AddressService.getAll(req.user!.id);
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Addresses retrieved successfully",
      data: addresses,
    });
  }

  static async searchCities(req: Request, res: Response) {
    const { query } = validate(AddressValidation.SEARCH_CITIES, {
      query: req.query,
    });
    const cities = await AddressService.searchCities(query.search);
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Cities retrieved successfully",
      data: cities,
    });
  }

  static async getById(req: Request, res: Response) {
    const { params } = validate(AddressValidation.GET_ADDRESS_BY_ID, {
      params: req.params,
    });
    const address = await AddressService.getById(req.user!.id, { params });
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Address retrieved successfully",
      data: address,
    });
  }

  static async create(req: Request, res: Response) {
    const { body } = validate(AddressValidation.CREATE_ADDRESS, {
      body: req.body,
    });
    const address = await AddressService.create(req.user!.id, { body });
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Address created successfully",
      data: address,
    });
  }

  static async update(req: Request, res: Response) {
    const { params, body } = validate(AddressValidation.UPDATE_ADDRESS, {
      params: req.params,
      body: req.body,
    });
    const address = await AddressService.update(req.user!.id, {
      params,
      body,
    });
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Address updated successfully",
      data: address,
    });
  }

  static async delete(req: Request, res: Response) {
    const { params } = validate(AddressValidation.DELETE_ADDRESS, {
      params: req.params,
    });
    const address = await AddressService.delete(req.user!.id, { params });
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Address deleted successfully",
      data: address,
    });
  }

  static async geocodeCity(req: Request, res: Response) {
    const { query } = validate(AddressValidation.GEOCODE_CITY, {
      query: req.query,
    });
    const coordinates = await AddressService.geocodeCity({ query });
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Coordinates retrieved successfully",
      data: coordinates,
    });
  }

  static async setPrimary(req: Request, res: Response) {
    const { params } = validate(AddressValidation.SET_PRIMARY_ADDRESS, {
      params: req.params,
    });
    const address = await AddressService.setPrimary(req.user!.id, {
      params,
    });
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Primary address updated successfully",
      data: address,
    });
  }

  static async getShippingOptions(req: Request, res: Response) {
    const { params, body } = validate(AddressValidation.GET_SHIPPING_OPTIONS, {
      params: req.params,
      body: req.body,
    });
    const options = await AddressService.getShippingOptions(req.user!.id, {
      params,
      body,
    });
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Shipping options retrieved successfully",
      data: options,
    });
  }
}
