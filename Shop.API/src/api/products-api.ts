import { Request, Response, Router } from "express";
import { connection } from "../../index";
import { v4 as uuidv4 } from 'uuid';
import { OkPacket } from "mysql2";
import { enhanceProductsComments, enhanceProductsImages, getProductsFilterQuery } from "../helpers";
import {
  ICommentEntity,
  ImagesRemovePayload,
  IProductEntity,
  IProductImageEntity,
  IProductSearchFilter,
  ProductAddImagesPayload,
  ProductCreatePayload
} from "../../types";
import { mapCommentsEntity, mapImagesEntity, mapProductsEntity } from "../services/mapping";
import {
  DELETE_IMAGES_QUERY,
  INSERT_PRODUCT_IMAGES_QUERY,
  INSERT_PRODUCT_QUERY,
  REPLACE_PRODUCT_THUMBNAIL, UPDATE_PRODUCT_FIELDS
} from "../services/queries";
import { param, body, validationResult } from "express-validator";
import { ISimilarProductEntity, similarProductsCreatePayload } from "../../types";

export const productsRouter = Router();

const throwServerError = (res: Response, e: Error) => {
  console.debug(e.message);
  res.status(500);
  res.send("Something went wrong");
}

productsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const [productRows] = await connection.query<IProductEntity[]>("SELECT * FROM products");
    const [commentRows] = await connection.query<ICommentEntity[]>("SELECT * FROM comments");
    const [imageRows] = await connection.query<IProductImageEntity[]>("SELECT * FROM images");

    const products = mapProductsEntity(productRows);
    const withComments = enhanceProductsComments(products, commentRows);
    const withImages = enhanceProductsImages(withComments, imageRows)

    res.send(withImages);
  } catch (e) {
    throwServerError(res, e);
  }
});

productsRouter.get('/search', async (
  req: Request<{}, {}, {}, IProductSearchFilter>,
  res: Response
) => {
  try {
    const [query, values] = getProductsFilterQuery(req.query);
    const [rows] = await connection.query<IProductEntity[]>(query, values);

    if (!rows?.length) {
      res.send([]);
      return;
    }

    const [commentRows] = await connection.query<ICommentEntity[]>("SELECT * FROM comments");
    const [imageRows] = await connection.query<IProductImageEntity[]>("SELECT * FROM images");

    const products = mapProductsEntity(rows);
    const withComments = enhanceProductsComments(products, commentRows);
    const withImages = enhanceProductsImages(withComments, imageRows)

    res.send(withImages);
  } catch (e) {
    throwServerError(res, e);
  }
});

productsRouter.get('/:id', async (
  req: Request<{ id: string }>,
  res: Response
) => {
  try {
    const [rows] = await connection.query<IProductEntity[]>(
      "SELECT * FROM products WHERE product_id = ?",
      [req.params.id]
    );

    if (!rows?.[0]) {
      res.status(404);
      res.send(`Product with id ${req.params.id} is not found`);
      return;
    }

    const [comments] = await connection.query<ICommentEntity[]>(
      "SELECT * FROM comments WHERE product_id = ?",
      [req.params.id]
    );

    const [images] = await connection.query<IProductImageEntity[]>(
      "SELECT * FROM images WHERE product_id = ?",
      [req.params.id]
    );

    const product = mapProductsEntity(rows)[0];

    if (comments.length) {
      product.comments = mapCommentsEntity(comments);
    }

    if (images.length) {
      product.images = mapImagesEntity(images);
      product.thumbnail = product.images.find(image => image.main) || product.images[0];
    }

    res.send(product);
  } catch (e) {
    throwServerError(res, e);
  }
});

productsRouter.post('/', async (
  req: Request<{}, {}, ProductCreatePayload>,
  res: Response
) => {
  try {
    const { title, description, price, images } = req.body;
    const productId = uuidv4();
    await connection.query<OkPacket>(
      INSERT_PRODUCT_QUERY,
      [productId, title || null, description || null, price || null]
    );

    if (images) {
      const values = images.map((image) => [uuidv4(), image.url, productId, image.main]);
      await connection.query<OkPacket>(INSERT_PRODUCT_IMAGES_QUERY, [values]);
    }

    res.status(201);
    res.send(`Product id:${productId} has been added!`);
  } catch (e) {
    throwServerError(res, e);
  }
});

productsRouter.delete("/similar",
  [
    body().isArray().withMessage("Body must be an array"),
    body("*").isUUID().withMessage("Invalid product id in array"),
  ],
  async (req: Request<{}, {}, string[]>, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400);
        res.json({ errors: errors.array() });
        return;
      }

      if (!req.body.length) {
        res.status(400);
        res.send("Product ids array is empty");
        return;
      }

      const [info] = await connection.query<OkPacket>(
        "DELETE FROM similar_products WHERE product_id IN (?) OR similar_id IN (?)",
        [req.body, req.body]
      );

      if (info.affectedRows === 0) {
        res.status(404);
        res.send("No relations found to delete");
        return;
      }

      res.status(200).send("Similar products relations have been deleted!");
    } catch (e) {
      throwServerError(res, e);
    }
  }
);


productsRouter.delete('/:id', async (
  req: Request<{ id: string }>,
  res: Response
) => {
  try {
    const [rows] = await connection.query<IProductEntity[]>(
      "SELECT * FROM products WHERE product_id = ?",
      [req.params.id]
    );

    if (!rows?.[0]) {
      res.status(404);
      res.send(`Product with id ${req.params.id} is not found`);
      return;
    }

    await connection.query<OkPacket>(
      "DELETE FROM similar_products WHERE product_id = ? OR similar_id = ?",
      [req.params, req.params]
    );

    await connection.query<OkPacket>(
      "DELETE FROM images WHERE product_id = ?",
      [req.params.id]
    );

    await connection.query<OkPacket>(
      "DELETE FROM comments WHERE product_id = ?",
      [req.params.id]
    );

    await connection.query<OkPacket>(
      "DELETE FROM products WHERE product_id = ?",
      [req.params.id]
    );

    res.status(200);
    res.end();
  } catch (e) {
    if (e.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(400).send("Cannot delete product, it has dependent similar products");
    }
    throwServerError(res, e);
  }
});

productsRouter.post('/add-images', async (
  req: Request<{}, {}, ProductAddImagesPayload>,
  res: Response
) => {
  try {
    const { productId, images } = req.body;

    if (!images?.length) {
      res.status(400);
      res.send("Images array is empty");
      return;
    }

    const values = images.map((image) => [uuidv4(), image.url, productId, image.main]);
    await connection.query<OkPacket>(INSERT_PRODUCT_IMAGES_QUERY, [values]);

    res.status(201);
    res.send(`Images for a product id:${productId} have been added!`);
  } catch (e) {
    throwServerError(res, e);
  }
});

productsRouter.post('/remove-images', async (
  req: Request<{}, {}, ImagesRemovePayload>,
  res: Response
) => {
  try {
    const imagesToRemove = req.body;

    if (!imagesToRemove?.length) {
      res.status(400);
      res.send("Images array is empty");
      return;
    }

    const [info] = await connection.query<OkPacket>(DELETE_IMAGES_QUERY, [[imagesToRemove]]);

    if (info.affectedRows === 0) {
      res.status(404);
      res.send("No one image has been removed");
      return;
    }

    res.status(200);
    res.send(`Images have been removed!`);
  } catch (e) {
    throwServerError(res, e);
  }
});


productsRouter.post('/update-thumbnail/:id',
  [
    param('id').isUUID().withMessage('Product id is not UUID'),
    body('newThumbnailId').isUUID().withMessage('New thumbnail id is empty or not UUID')
  ],
  async (
  req: Request<{ id: string }, {}, { newThumbnailId: string }>,
  res: Response
) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400);
        res.json({ errors: errors.array() });
        return;
    }

    const [currentThumbnailRows] = await connection.query<IProductImageEntity[]>(
      "SELECT * FROM images WHERE product_id=? AND main=?",
      [req.params.id, 1]
    );

    if (!currentThumbnailRows?.length || currentThumbnailRows.length > 1) {
      res.status(400);
      res.send("Incorrect product id");
      return;
    }

    
    const [newThumbnailRows] = await connection.query<IProductImageEntity[]>(
      "SELECT * FROM images WHERE product_id=? AND image_id=?",
      [req.params.id, req.body.newThumbnailId]
    );

    if (newThumbnailRows?.length !== 1) {
      res.status(400);
      res.send("Incorrect new thumbnail id");
      return;
    }

    const currentThumbnailId = currentThumbnailRows[0].image_id;
    const [info] = await connection.query<OkPacket>(
      REPLACE_PRODUCT_THUMBNAIL,
      [currentThumbnailId, req.body.newThumbnailId, currentThumbnailId, req.body.newThumbnailId]
    );

    if (info.affectedRows === 0) {
      res.status(404);
      res.send("No one image has been updated");
      return;
    }

    res.status(200);
    res.send("New product thumbnail has been set!");
  } catch (e) {
    throwServerError(res, e);
  }
});


productsRouter.patch('/:id', async (
  req: Request<{ id: string }, {}, ProductCreatePayload>,
  res: Response
) => {
  try {
    const { id } = req.params;

    const [rows] = await connection.query<IProductEntity[]>(
      "SELECT * FROM products WHERE product_id = ?",
      [id]
    );

    if (!rows?.[0]) {
      res.status(404);
      res.send(`Product with id ${id} is not found`);
      return;
    }

    const currentProduct = rows[0];

    
    await connection.query<OkPacket>(
      UPDATE_PRODUCT_FIELDS,
      [
        req.body.hasOwnProperty("title") ? req.body.title : currentProduct.title,
        req.body.hasOwnProperty("description") ? req.body.description : currentProduct.description,
        req.body.hasOwnProperty("price") ? req.body.price : currentProduct.price,
        id
      ]
    );

    res.status(200);
    res.send(`Product id:${id} has been added!`);
  } catch (e) {
    throwServerError(res, e);
  }
});

productsRouter.get('/similar/:id',
  [ param("id").isUUID().withMessage("Product id is not UUID") ],
  async (
  req: Request<{ id: string }>,
  res: Response
  ) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
      res.status(400);
      res.json({ errors: errors.array() });
      return;
  }
    
  try { 

    const [similarRows] = await connection.query<ISimilarProductEntity[]>(
      "SELECT similar_id FROM similar_products WHERE product_id = ?",
      [req.params.id]
    );

    if (!similarRows.length) {
      res.send([]);
      return;
    }

    const ids = similarRows.map((row) => row.similar_id);
    const [products] = await connection.query<IProductEntity[]>(
      `SELECT * FROM products WHERE product_id IN (?)`,
      [ids]
    );

    res.send(products);
  } catch (e) {
    throwServerError(res, e);
  }
});

productsRouter.post('/similar',
  [
    body().isArray().withMessage("Body must be an array"),
    body("*.productId").isUUID().withMessage("productId is invalid"),
    body("*.similarId").isUUID().withMessage("similarId is invalid"),
  ],
  async (
    req: Request<{}, {}, similarProductsCreatePayload[]>,
    res: Response
  ) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400);
        res.json({ errors: errors.array() });
        return;
      }

      const pairs = req.body;

      if (!pairs.length) {
        res.status(400);
        res.send("Body array is empty");
        return;
      }

      const values = pairs.map((pair) => [uuidv4(), pair.productId, pair.similarId]);
      await connection.query<OkPacket>(
        "INSERT IGNORE INTO similar_products (id, product_id, similar_id) VALUES ?",
        [values]
      );

      res.status(201).send("Similar products relations have been added!");
    } catch (e) {
      throwServerError(res, e);
    }
});

