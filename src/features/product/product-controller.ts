import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { validate } from "../../validate/validate";
import { ProductValidation } from "./product-validation";
import { ProductService } from "./product-service";

export class ProductController {
  static async getAll(req: Request, res: Response) {
    const { query } = validate(ProductValidation.GET_ALL_PRODUCT, {
      query: req.query,
    });
    const { products, meta } = await ProductService.getAllAdminProduct({ query });
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Product retrieved successfully",
      data: products,
      meta,
    });
  }

  static async create(req: Request, res: Response) {
    const { body } = validate(ProductValidation.CREATE_PRODUCT, {
      body: req.body,
    });
    const createdById = req.user!.id;
    const files = req.files as Express.Multer.File[];

    const product = await ProductService.create({ body, createdById, files });
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  }

  static async update(req: Request, res: Response) {
    const { params, body } = validate(ProductValidation.UPDATE_PRODUCT, {
      params: req.params,
      body: req.body,
    });
    const product = await ProductService.update({ params, body });
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  }

  static async delete(req: Request, res: Response) {
    const { params } = validate(ProductValidation.DELETE_PRODUCT, {
      params: req.params,
    });
    const product = await ProductService.delete({ params });
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Product deleted successfully",
      data: product,
    });
  }
}