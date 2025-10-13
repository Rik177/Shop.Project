import { Router, Request, Response } from "express";
import { getProduct, getProducts, getSimilarProducts, getAvailableProductsForSimilar, removeProduct, searchProducts, updateProduct, createProduct } from "../models/products.model";
import { IProductFilterPayload } from "@Shared/types";
import { IProductEditData } from "../types";

export const productsRouter = Router();

const throwServerError = (res: Response, e: Error) => {
  console.debug(e.message);
  res.status(500);
  res.send("Something went wrong");
}

productsRouter.get('/', async (req: Request, res: Response) => {
  try {
    console.log(req.session.username);
    const products = await getProducts();
    res.render("products", {
      items: products,
      queryParams: {}
    });
  } catch (e) {
    throwServerError(res, e);
  }
});

productsRouter.get('/new-product', async (
  req: Request,
  res: Response
) => {
  try {
    res.render("product/new-product");
  } catch (e) {
    throwServerError(res, e as Error);
  }
});

productsRouter.post('/create', async (
  req: Request<{}, {}, { title: string; description: string; price: string }>,
  res: Response
) => {
  try {
    const { title, description, price } = req.body;
    const created = await createProduct({
      title,
      description,
      price: Number(price)
    });
    res.redirect(`/${process.env.ADMIN_PATH}/${created.id}`);
  } catch (e) {
    throwServerError(res, e as Error);
  }
});

productsRouter.get('/search', async (
  req: Request<{}, {}, {}, IProductFilterPayload>,
  res: Response
) => {
  try {
    const products = await searchProducts(req.query);
    res.render("products", {
      items: products,
      queryParams: req.query
    });
  } catch (e) {
    throwServerError(res, e);
  }
});

productsRouter.get('/:id', async (
  req: Request<{ id: string }>,
  res: Response
) => {
  try {
    const product = await getProduct(req.params.id);
    const similarProducts = await getSimilarProducts(req.params.id) || [];
    const availableProducts = await getAvailableProductsForSimilar(req.params.id) || [];
    
    if (product) {
      res.render("product/product", {
        item: product,
        similarProducts: similarProducts,
        availableProducts: availableProducts
      });
    } else {
      res.render("product/empty-product", {
        id: req.params.id
      });
    }
  } catch (e) {
    throwServerError(res, e);
  }
});

productsRouter.get('/remove-product/:id', async (
  req: Request<{ id: string }>,
  res: Response
) => {
  try {
    if (req.session.username !== "admin") {
      res.status(403);
      res.send("Forbidden");
      return;
    }

    await removeProduct(req.params.id);
    res.redirect(`/${process.env.ADMIN_PATH}`);
  } catch (e) {
    throwServerError(res, e);
  }
});

productsRouter.post('/save/:id', async (
  req: Request<{ id: string }, {}, IProductEditData>,
  res: Response
) => {
  try {
    await updateProduct(req.params.id, req.body);
    res.redirect(`/${process.env.ADMIN_PATH}/${req.params.id}`);
  } catch (e) {
    throwServerError(res, e);
  }
});


