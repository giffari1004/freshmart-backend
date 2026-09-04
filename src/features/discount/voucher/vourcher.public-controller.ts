import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { validate } from "../../../validate/validate";
import VoucherValidation from "./voucher-validation";
import { VoucherService } from "./voucher-service";
export class VourcherPublicController {
  static async validateCode(req: Request, res: Response) {
    const { params } = validate(VoucherValidation.VOUCHER_CODE, {
      params: req.params,
    });
    const voucher = await VoucherService.validateVoucher({params});
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Voucher is valid",
      data: voucher,
    });
  }
}
