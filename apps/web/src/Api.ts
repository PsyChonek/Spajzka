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

export interface CreateGroupInputModel {
  name: string;
  users: string[];
}

export interface CreateGroupOutputModel {
  groupId: string;
}

export interface GetGroupInputModel {
  groupId: string;
}

export interface GetGroupOutputModel {
  groupId: string;
  name: string;
  users: string[];
}

export interface UpdateGroupInputModel {
  groupId: string;
  name: string;
  users: string[];
}

export interface UpdateGroupOutputModel {
  groupId: string;
}

export interface DeleteGroupInputModel {
  groupId: string;
}

export interface DeleteGroupOutputModel {
  groupId: string;
}

export interface AddUserToGroupInputModel {
  groupId: string;
  userId: string;
}

export interface AddUserToGroupOutputModel {
  groupId: string;
  userId: string;
}

export interface RemoveUserFromGroupInputModel {
  groupId: string;
  userId: string;
}

export interface RemoveUserFromGroupOutputModel {
  groupId: string;
  userId: string;
}

export interface CreateItemInputModel {
  name: string;
  price: number;
  description: string;
  image: string;
  category: ItemCategoryModel;
}

export interface CreateItemOutputModel {
  itemId: string;
}

export interface GetItemInputModel {
  itemId: string;
}

export interface GetItemOutputModel {
  itemId: string;
  name: string;
  price: number;
  description: string;
  image: string;
  category: ItemCategoryModel;
}

export interface UpdateItemInputModel {
  itemId: string;
  name: string;
  price: number;
  description: string;
  image: string;
  category: ItemCategoryModel;
}

export interface UpdateItemOutputModel {
  itemId: string;
}

export interface DeleteItemInputModel {
  itemId: string;
}

export interface DeleteItemOutputModel {
  itemId: string;
}

export interface ItemCategoryModel {
  id: string;
  name: string;
}

export interface CreateInputModel {
  name: string;
  password: string;
  email: string;
}

export interface CreateOutputModel {
  userId: string;
}

export interface GetUserInputModel {
  userId: string;
}

export interface GetUserOutputModel {
  userId: string;
  name: string;
  email: string;
  items: UserItemModel;
}

export interface LoginUserInputModel {
  name: string;
  email: string;
  password: string;
}

export interface LoginUserOutputModel {
  userId: string;
  jwt: string;
}

export interface GetUserGroupInputModel {
  userId: string;
}

export interface GetUserGroupOutputModel {
  userId: string;
  name: string;
}

export interface GetUserItemInputModel {
  userId: string;
}

export interface GetUserItemOutputModel {
  userId: string;
  items: UserItemModel;
}

export interface UpdateUserInputModel {
  userId: string;
  name: string;
  password: string;
  email: string;
}

export interface UpdateUserOutputModel {
  userId: string;
}

export interface DeleteUserInputModel {
  userId: string;
}

export interface DeleteUserOutputModel {
  userId: string;
}

export interface AddUserItemInputModel {
  userId: string;
  itemId: string;
}

export interface AddUserItemOutputModel {
  userId: string;
  itemId: string;
}

export interface RemoveUserItemInputModel {
  userId: string;
  itemId: string;
}

export interface RemoveUserItemOutputModel {
  userId: string;
  itemId: string;
}

export interface UpdateUserItemInputModel {
  userId: string;
  items: UserItemModel;
}

export interface UpdateUserItemOutputModel {
  userId: string;
  itemId: string;
}

export interface UserItemModel {
  itemId: string;
  quantity: number;
  favoriteTier: number;
  toBuyQuantity: number;
  minToHave: number;
}

export type QueryParamsType = Record<string | number, any>;
export type ResponseFormat = keyof Omit<Body, "body" | "bodyUsed">;

export interface FullRequestParams extends Omit<RequestInit, "body"> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseFormat;
  /** request body */
  body?: unknown;
  /** base url */
  baseUrl?: string;
  /** request cancellation token */
  cancelToken?: CancelToken;
}

export type RequestParams = Omit<FullRequestParams, "body" | "method" | "query" | "path">;

export interface ApiConfig<SecurityDataType = unknown> {
  baseUrl?: string;
  baseApiParams?: Omit<RequestParams, "baseUrl" | "cancelToken" | "signal">;
  securityWorker?: (securityData: SecurityDataType | null) => Promise<RequestParams | void> | RequestParams | void;
  customFetch?: typeof fetch;
}

export interface HttpResponse<D extends unknown, E extends unknown = unknown> extends Response {
  data: D;
  error: E;
}

type CancelToken = Symbol | string | number;

export enum ContentType {
  Json = "application/json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
  Text = "text/plain",
}

export class HttpClient<SecurityDataType = unknown> {
  public baseUrl: string = "http://127.0.0.1:3010";
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private abortControllers = new Map<CancelToken, AbortController>();
  private customFetch = (...fetchParams: Parameters<typeof fetch>) => fetch(...fetchParams);

  private baseApiParams: RequestParams = {
    credentials: "same-origin",
    headers: {},
    redirect: "follow",
    referrerPolicy: "no-referrer",
  };

  constructor(apiConfig: ApiConfig<SecurityDataType> = {}) {
    Object.assign(this, apiConfig);
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected encodeQueryParam(key: string, value: any) {
    const encodedKey = encodeURIComponent(key);
    return `${encodedKey}=${encodeURIComponent(typeof value === "number" ? value : `${value}`)}`;
  }

  protected addQueryParam(query: QueryParamsType, key: string) {
    return this.encodeQueryParam(key, query[key]);
  }

  protected addArrayQueryParam(query: QueryParamsType, key: string) {
    const value = query[key];
    return value.map((v: any) => this.encodeQueryParam(key, v)).join("&");
  }

  protected toQueryString(rawQuery?: QueryParamsType): string {
    const query = rawQuery || {};
    const keys = Object.keys(query).filter((key) => "undefined" !== typeof query[key]);
    return keys
      .map((key) => (Array.isArray(query[key]) ? this.addArrayQueryParam(query, key) : this.addQueryParam(query, key)))
      .join("&");
  }

  protected addQueryParams(rawQuery?: QueryParamsType): string {
    const queryString = this.toQueryString(rawQuery);
    return queryString ? `?${queryString}` : "";
  }

  private contentFormatters: Record<ContentType, (input: any) => any> = {
    [ContentType.Json]: (input: any) =>
      input !== null && (typeof input === "object" || typeof input === "string") ? JSON.stringify(input) : input,
    [ContentType.Text]: (input: any) => (input !== null && typeof input !== "string" ? JSON.stringify(input) : input),
    [ContentType.FormData]: (input: any) =>
      Object.keys(input || {}).reduce((formData, key) => {
        const property = input[key];
        formData.append(
          key,
          property instanceof Blob
            ? property
            : typeof property === "object" && property !== null
            ? JSON.stringify(property)
            : `${property}`,
        );
        return formData;
      }, new FormData()),
    [ContentType.UrlEncoded]: (input: any) => this.toQueryString(input),
  };

  protected mergeRequestParams(params1: RequestParams, params2?: RequestParams): RequestParams {
    return {
      ...this.baseApiParams,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...(this.baseApiParams.headers || {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected createAbortSignal = (cancelToken: CancelToken): AbortSignal | undefined => {
    if (this.abortControllers.has(cancelToken)) {
      const abortController = this.abortControllers.get(cancelToken);
      if (abortController) {
        return abortController.signal;
      }
      return void 0;
    }

    const abortController = new AbortController();
    this.abortControllers.set(cancelToken, abortController);
    return abortController.signal;
  };

  public abortRequest = (cancelToken: CancelToken) => {
    const abortController = this.abortControllers.get(cancelToken);

    if (abortController) {
      abortController.abort();
      this.abortControllers.delete(cancelToken);
    }
  };

  public request = async <T = any, E = any>({
    body,
    secure,
    path,
    type,
    query,
    format,
    baseUrl,
    cancelToken,
    ...params
  }: FullRequestParams): Promise<HttpResponse<T, E>> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.baseApiParams.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const queryString = query && this.toQueryString(query);
    const payloadFormatter = this.contentFormatters[type || ContentType.Json];
    const responseFormat = format || requestParams.format;

    return this.customFetch(`${baseUrl || this.baseUrl || ""}${path}${queryString ? `?${queryString}` : ""}`, {
      ...requestParams,
      headers: {
        ...(requestParams.headers || {}),
        ...(type && type !== ContentType.FormData ? { "Content-Type": type } : {}),
      },
      signal: (cancelToken ? this.createAbortSignal(cancelToken) : requestParams.signal) || null,
      body: typeof body === "undefined" || body === null ? null : payloadFormatter(body),
    }).then(async (response) => {
      const r = response as HttpResponse<T, E>;
      r.data = null as unknown as T;
      r.error = null as unknown as E;

      const data = !responseFormat
        ? r
        : await response[responseFormat]()
            .then((data) => {
              if (r.ok) {
                r.data = data;
              } else {
                r.error = data;
              }
              return r;
            })
            .catch((e) => {
              r.error = e;
              return r;
            });

      if (cancelToken) {
        this.abortControllers.delete(cancelToken);
      }

      if (!response.ok) throw data;
      return data;
    });
  };
}

/**
 * @title Spajzka API
 * @version 0.1.0
 * @baseUrl http://127.0.0.1:3010
 *
 * Spajzka API documentation
 */
export class Api<SecurityDataType extends unknown> extends HttpClient<SecurityDataType> {
  user = {
    /**
     * No description
     *
     * @tags User
     * @name UserCreate
     * @summary Create user
     * @request POST:/user
     */
    userCreate: (body: CreateInputModel, params: RequestParams = {}) =>
      this.request<CreateOutputModel, any>({
        path: `/user`,
        method: "POST",
        body: body,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags User
     * @name UserUpdate
     * @summary Update user
     * @request PUT:/user
     */
    userUpdate: (body: UpdateUserInputModel, params: RequestParams = {}) =>
      this.request<UpdateUserOutputModel, any>({
        path: `/user`,
        method: "PUT",
        body: body,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags User
     * @name LoginCreate
     * @summary Login user
     * @request POST:/user/login
     */
    loginCreate: (body: LoginUserInputModel, params: RequestParams = {}) =>
      this.request<LoginUserOutputModel, any>({
        path: `/user/login`,
        method: "POST",
        body: body,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags User
     * @name UserDelete
     * @summary Delete user by user id
     * @request DELETE:/user/{userId}
     */
    userDelete: (userId: string, params: RequestParams = {}) =>
      this.request<DeleteUserOutputModel, any>({
        path: `/user/${userId}`,
        method: "DELETE",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags User
     * @name UserDetail
     * @summary Get user by user id
     * @request GET:/user/{userId}
     */
    userDetail: (userId: string, params: RequestParams = {}) =>
      this.request<GetUserOutputModel, any>({
        path: `/user/${userId}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags User
     * @name GroupDetail
     * @summary Get user groups
     * @request GET:/user/{userId}/group
     */
    groupDetail: (userId: string, params: RequestParams = {}) =>
      this.request<GetUserGroupOutputModel, any>({
        path: `/user/${userId}/group`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags User
     * @name ItemDetail
     * @summary Get user items by user id
     * @request GET:/user/{userId}/item
     */
    itemDetail: (userId: string, params: RequestParams = {}) =>
      this.request<GetUserItemOutputModel, any>({
        path: `/user/${userId}/item`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags User Item
     * @name ItemCreate
     * @summary Add item to user
     * @request POST:/user/{userId}/item
     */
    itemCreate: (userId: string, body: AddUserItemInputModel, params: RequestParams = {}) =>
      this.request<AddUserItemOutputModel, any>({
        path: `/user/${userId}/item`,
        method: "POST",
        body: body,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags User Item
     * @name ItemDelete
     * @summary Remove user item
     * @request DELETE:/user/{userId}/item/{itemId}
     */
    itemDelete: (userId: string, itemId: string, params: RequestParams = {}) =>
      this.request<RemoveUserItemOutputModel, any>({
        path: `/user/${userId}/item/${itemId}`,
        method: "DELETE",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags User Item
     * @name ItemUpdate
     * @summary Update user item
     * @request PUT:/user/{userId}/item/{itemId}
     */
    itemUpdate: (userId: string, items: any, itemId: string, params: RequestParams = {}) =>
      this.request<UpdateUserItemOutputModel, any>({
        path: `/user/${userId}/item/${itemId}`,
        method: "PUT",
        format: "json",
        ...params,
      }),
  };
  item = {
    /**
     * No description
     *
     * @tags Item
     * @name ItemCreate
     * @summary Store item to database
     * @request POST:/item
     */
    itemCreate: (body: CreateItemInputModel, params: RequestParams = {}) =>
      this.request<CreateItemOutputModel, any>({
        path: `/item`,
        method: "POST",
        body: body,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Item
     * @name ItemUpdate
     * @summary Update item
     * @request PUT:/item
     */
    itemUpdate: (body: UpdateItemInputModel, params: RequestParams = {}) =>
      this.request<UpdateItemOutputModel, any>({
        path: `/item`,
        method: "PUT",
        body: body,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Item
     * @name ItemDetail
     * @summary Get item by item id
     * @request GET:/item/{itemId}
     */
    itemDetail: (itemId: string, params: RequestParams = {}) =>
      this.request<GetItemOutputModel, any>({
        path: `/item/${itemId}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Item
     * @name ItemDelete
     * @summary Remove item from database
     * @request DELETE:/item/{itemId}
     */
    itemDelete: (itemId: string, params: RequestParams = {}) =>
      this.request<DeleteItemOutputModel, any>({
        path: `/item/${itemId}`,
        method: "DELETE",
        format: "json",
        ...params,
      }),
  };
  group = {
    /**
     * No description
     *
     * @tags Group
     * @name GroupCreate
     * @summary Create group
     * @request POST:/group
     */
    groupCreate: (body: CreateGroupInputModel, params: RequestParams = {}) =>
      this.request<CreateGroupOutputModel, any>({
        path: `/group`,
        method: "POST",
        body: body,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Group
     * @name GroupUpdate
     * @summary Update group
     * @request PUT:/group
     */
    groupUpdate: (body: UpdateGroupInputModel, params: RequestParams = {}) =>
      this.request<UpdateGroupOutputModel, any>({
        path: `/group`,
        method: "PUT",
        body: body,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Group
     * @name GroupDetail
     * @summary Get group by group id
     * @request GET:/group/{groupId}
     */
    groupDetail: (groupId: string, params: RequestParams = {}) =>
      this.request<GetGroupOutputModel, any>({
        path: `/group/${groupId}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Group
     * @name GroupDelete
     * @summary Delete group by group id
     * @request DELETE:/group/{groupId}
     */
    groupDelete: (groupId: string, params: RequestParams = {}) =>
      this.request<DeleteGroupOutputModel, any>({
        path: `/group/${groupId}`,
        method: "DELETE",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Group User
     * @name UserCreate
     * @summary Add user to group
     * @request POST:/group/{groupId}/user/{userId}
     */
    userCreate: (groupId: string, userId: string, params: RequestParams = {}) =>
      this.request<AddUserToGroupOutputModel, any>({
        path: `/group/${groupId}/user/${userId}`,
        method: "POST",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Group User
     * @name UserDelete
     * @summary Remove user from group
     * @request DELETE:/group/{groupId}/user/{userId}
     */
    userDelete: (groupId: string, userId: string, params: RequestParams = {}) =>
      this.request<RemoveUserFromGroupOutputModel, any>({
        path: `/group/${groupId}/user/${userId}`,
        method: "DELETE",
        format: "json",
        ...params,
      }),
  };
  health = {
    /**
     * No description
     *
     * @tags Tools
     * @name HealthList
     * @summary Check if server can connect to database
     * @request GET:/health
     */
    healthList: (params: RequestParams = {}) =>
      this.request<
        {
          status?: string;
        },
        any
      >({
        path: `/health`,
        method: "GET",
        format: "json",
        ...params,
      }),
  };
}
