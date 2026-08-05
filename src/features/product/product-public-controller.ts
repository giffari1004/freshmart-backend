import { Request, Response } from "express";
import { validate } from "../../validate/validate";
import { ProductValidation } from "./product-validation";
import { StatusCodes } from "http-status-codes";
import { ProductService } from "./product-service";
export class customerProductController {
  static async getAllCatalog(req: Request, res: Response) {
    const { query } = validate(ProductValidation.GET_CATALOG, {
      query: req.query,
    });
    const {data , meta} = await ProductService.getAllCustomerProduct({query})
    res.status(StatusCodes.OK).json({
          success: true,
          message: "Catalog retrieved successfully",
          data: data,
          meta,
        });
  }
}
