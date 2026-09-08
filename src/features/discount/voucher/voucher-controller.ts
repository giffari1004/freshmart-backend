import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { VoucherService } from "./voucher-service";
import { validate } from "../../../validate/validate";
import VoucherValidation from "./voucher-validation";

export class VoucherController {
  static async getAllVoucher(req: Request, res: Response) {
    const { query } = validate(VoucherValidation.GET_ALL_VOUCHER, {
      query: req.query,
    });
    const user = req.user!;
    const { data, meta } = await VoucherService.getAllVoucher({ query }, user);
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Voucher retrieved successfully",
      data,
      meta,
    });
  }
  static async createVoucher(req: Request, res: Response) {
    const { body } = validate(VoucherValidation.CREATE_VOUCHER, {
      body: req.body,
    });
    const user = req.user!;
    const voucher = await VoucherService.createVoucher({ body }, user);
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Voucher created successfully",
      data: voucher,
    });
  }
  static async updateVoucher(req: Request, res: Response) {
    const { params, body } = validate(VoucherValidation.UPDATE_VOUCHER, {
      params: req.params,
      body: req.body,
    });
    const user = req.user!
    const voucher = await VoucherService.updateVoucher({ params, body },user);
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Voucher updated successfully",
      data: voucher,
    });
  }
  static async deleteVoucher(req: Request, res: Response) {
    const { params } = validate(VoucherValidation.VOUCHER_ID_PARAM, {
      params: req.params,
    });
    const user = req.user!
    const voucher = await VoucherService.deleteVoucher({ params },user);
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Voucher deleted successfully",
      data: voucher,
    });
  }
  static async getVoucherById(req: Request, res: Response) {
    const { params } = validate(VoucherValidation.VOUCHER_ID_PARAM, {
      params: req.params,
    });
    const voucher = await VoucherService.getVoucherById({ params });
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Voucher retrieved successfully",
      data: voucher,
    });
  }
}
