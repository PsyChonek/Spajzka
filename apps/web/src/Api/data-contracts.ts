/* eslint-disable */
/* tslint:disable */
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface Item {
  id: number;
  name: string;
  price: number;
  quantity: number;
  description: string;
}

export interface ItemCreatePayload {
  ref?: {
    id: number;
    name: string;
    price: number;
    quantity: number;
    description: string;
  };
}
