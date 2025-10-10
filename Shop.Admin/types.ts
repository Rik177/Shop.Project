import "express-session";
import { Session } from "inspector";

export interface IProductEditData {
  title: string;
  description: string;
  price: string;
  mainImage: string;
  newImages?: string;
  commentsToRemove: string | string[];
  imagesToRemove: string | string[];
}



declare module "express-session" {
  interface SessionData {
    username?: string;
  }
}

