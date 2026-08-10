import { Request, Response } from "express";
import { validate } from "../../validate/validate";
import { ProductValidation } from "./product-validation";
import { StatusCodes } from "http-status-codes";
import { ProductService } from "./product-service";
import { success } from "zod";
export class customerProductController {
  static async getAllCatalog(req: Request, res: Response) {
    const { query } = validate(ProductValidation.GET_CATALOG, {
      query: req.query,
    });
    const { data, meta } = await ProductService.getAllCustomerProduct({
      query,
    });
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Catalog retrieved successfully",
      data: data,
      meta,
    });
  }
  static async getProductDetail(req: Request, res: Response) {
    const { query, params } = validate(ProductValidation.GET_PRODUCT_DETAIL, {
      query: req.query,
      params: req.params,
    });
    const data = await ProductService.getProductDetail({ query, params });
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Product detail retrieved successfully",
      data,
    });
  }
}
