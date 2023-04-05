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

import { HttpClient } from "./http-client";
export class Item extends HttpClient {
  /**
   * @description Get item
   *
   * @tags item
   * @name ItemList
   * @summary Get item
   * @request GET:/item
   */
  itemList = (params = {}) =>
    this.request({
      path: `/item`,
      method: "GET",
      format: "json",
      ...params,
    });
}
