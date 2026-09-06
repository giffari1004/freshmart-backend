import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { validate } from "../../validate/validate";
import { StoreValidation } from "./store.validation";
import { StoreService } from "./store.service";

export class StoreController {
  static async getAll(req: Request, res: Response) {
    const { query } = validate(StoreValidation.GET_ALL_STORE, {
      query: req.query,
    });
    const { stores, meta } = await StoreService.getAll({ query });
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Stores retrieved successfully",
      data: stores,
      meta,
    });
  }

  static async getById(req: Request, res: Response) {
    const { params } = validate(StoreValidation.GET_STORE_BY_ID, {
      params: req.params,
    });
    const store = await StoreService.getById({ params });
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Store retrieved successfully",
      data: store,
    });
  }

  static async create(req: Request, res: Response) {
    const { body } = validate(StoreValidation.CREATE_STORE, {
      body: req.body,
    });
    const store = await StoreService.create({ body });
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Store created successfully",
      data: store,
    });
  }

  static async update(req: Request, res: Response) {
    const { params, body } = validate(StoreValidation.UPDATE_STORE, {
      params: req.params,
      body: req.body,
    });
    const store = await StoreService.update({ params, body });
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Store updated successfully",
      data: store,
    });
  }

  static async delete(req: Request, res: Response) {
    const { params } = validate(StoreValidation.DELETE_STORE, {
      params: req.params,
    });
    const store = await StoreService.delete({ params });
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Store deleted successfully",
      data: store,
    });
  }

  static async assignAdmin(req: Request, res: Response) {
    const { params, body } = validate(StoreValidation.ASSIGN_STORE_ADMIN, {
      params: req.params,
      body: req.body,
    });
    const user = await StoreService.assignAdmin({ params, body });
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Store admin assigned successfully",
      data: user,
    });
  }
}
