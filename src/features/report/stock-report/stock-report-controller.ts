import { Request, Response } from "express";
import { validate } from "../../../validate/validate";
import { StockReportValidation } from "./stock-report-validation";
import { StatusCodes } from "http-status-codes";
import { StockReportServices } from "./stock-report-service";
export class StockReportController {
  static async getMonthlySummary(req: Request, res: Response) {
    const { query } = validate(StockReportValidation.GET_MONTHLY_SUMMARY, {
      query: req.query,
    });
    const user = req.user!
    const result = await StockReportServices.getMonthlySummary({ query },user);
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Monthly stock summary retrieved successfully",
      data: result,
    });
  }
  static async getStockDetail(req: Request, res: Response) {
    const { query } = validate(StockReportValidation.GET_STOCK_DETAIL, {
      query: req.query,
    });
    const user = req.user!
    const result = await StockReportServices.getStockDetail({ query }, user);
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Stock report retrieved successfully",
      data: result,
    });
  }
}
