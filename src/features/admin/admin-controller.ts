import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { validate } from "../../validate/validate";
import { AdminValidation } from "./admin-validation";
import { AdminService } from "./admin-service";

export class AdminController {
  static async getAllUser(req: Request, res: Response) {
    const { query } = validate(AdminValidation.GET_ALL_USER, {
      query: req.query,
    });
    const { users, meta } = await AdminService.getAllUser({ query });
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Admin retrieved successfully",
      data: users,
      meta,
    });
  }
  static async create(req: Request, res: Response) {
    const { body } = validate(AdminValidation.CREATE_STORE_ADMIN, {
      body: req.body,
    });
    const createAcc = await AdminService.create({ body });
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Admin created successfully",
      data: createAcc,
    });
  }
  static async update(req: Request, res: Response) {
    const { params, body } = validate(AdminValidation.UPDATE_STORE_ADMIN, {
      params: req.params,
      body: req.body,
    });
    const updateAcc = await AdminService.update({ params, body });
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Admin updated successfully",
      data: updateAcc,
    });
  }
  static async delete(req: Request, res: Response) {
    const { params } = validate(AdminValidation.DELETE_STORE_ADMIN, {
      params: req.params,
    });
    const deleteAcc = await AdminService.delete({ params });
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Admin deleted successfully",
      data: deleteAcc,
    });
  }
}
