import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { SalesReportService } from "./sales-report-service";
import { validate } from "../../../validate/validate";
import { SalesReportValidation } from "./sales-report-validation";

export class SalesReportController {
  static async getMonthlyReport(req: Request, res: Response) {
    const { query } = validate(SalesReportValidation.GET_MONTHLY_REPORT, {
      query: req.query,
    });
    const user = req.user!;
    const result = await SalesReportService.getMonthlyReport({ query }, user);
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Monthly sales report retrieved successfully",
      data: result,
    });
  }

  static async getCategoryReport(req: Request, res: Response) {
    const { query } = validate(SalesReportValidation.GET_CATEGORY_REPORT, {
      query: req.query,
    });
    const user = req.user!;
    const result = await SalesReportService.getCategoryReport({ query }, user);
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Sales report by category retrieved successfully",
      data: result,
    });
  }

  static async getProductReport(req: Request, res: Response) {
    const { query } = validate(SalesReportValidation.GET_PRODUCT_REPORT, {
      query: req.query,
    });
    const user = req.user!;
    const result = await SalesReportService.getProductReport({ query }, user);
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Sales report by product retrieved successfully",
      data: result,
    });
  }
}