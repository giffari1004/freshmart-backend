import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { validate } from "../../../validate/validate";
import { BogoValidation } from "./bogo-validation";
import { BogoService } from "./bogo-service";

export class BogoController {
  static async create(req: Request, res: Response) {
    const { body } = validate(BogoValidation.CREATE, {
      body: req.body,
    });
    const bogo = await BogoService.create({ body }, req.user!);
    res.status(StatusCodes.OK).json({
      success: true,
      message: "BOGO discount created successfully",
      data: bogo,
    });
  }
  static async update(req: Request, res: Response) {
    const { params, body } = validate(BogoValidation.UPDATE, {
      params: req.params,
      body: req.body,
    });
    const bogo = await BogoService.update({ params, body }, req.user!);
    res.status(StatusCodes.OK).json({
      success: true,
      message: "BOGO discount updated successfully",
      data: bogo,
    });
  }
  static async delete(req: Request, res: Response) {
    const { params } = validate(BogoValidation.DELETE, {
      params: req.params,
    });
    const bogo = await BogoService.delete({ params }, req.user!);
    res.status(StatusCodes.OK).json({
      success: true,
      message: "BOGO discount deleted successfully",
      data: bogo,
    });
  }
  static async getAll(req: Request, res: Response) {
    const { query } = validate(BogoValidation.GET_ALL, { query: req.query });
    const bogos = await BogoService.getAll({ query });
    res.status(StatusCodes.OK).json({
      success: true,
      message: "BOGO retrieved successfully",
      data: bogos,
    });
  }
  static async calculate(req: Request, res: Response) {
    const { body } = validate(BogoValidation.CALCULATE, {
      body: req.body,
    });
    const result = await BogoService.calculate({ body });
    res.status(StatusCodes.OK).json({
      success: true,
      message: "BOGO eligibility calculated successfully",
      data: result,
    });
  }
}
