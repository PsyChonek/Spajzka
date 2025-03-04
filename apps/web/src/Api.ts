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

export interface CreateUserInputModel {
  name: string;
  password: string;
  email: string;
}

export interface CreateUserOutputModel {
  id: string;
}

export interface GetUserInputModel {
  id: string;
}

export interface GetUserOutputModel {
  id: string;
  name: string;
  email: string;
  /** List of items associated with the user */
  items: UserItemModel;
}

export interface GetUserGroupInputModel {
  id: string;
}

export interface GetUserGroupOutputModel {
  id: string;
  name: string;
}

export interface GetUserItemInputModel {
  id: string;
}

export interface GetUserItemOutputModel {
  id: string;
  /** List of items associated with the user */
  items: UserItemModel;
}

export interface UpdateUserInputModel {
  id: string;
  name?: string;
  password?: string;
  email?: string;
}

export interface UpdateUserOutputModel {
  id: string;
}

export interface DeleteUserInputModel {
  id: string;
}

export interface DeleteUserOutputModel {
  id: string;
}

export interface AddUserItemInputModel {
  id: string;
  itemId: string;
}

export interface AddUserItemOutputModel {
  id: string;
  itemId: string;
}

export interface RemoveUserItemInputModel {
  id: string;
  itemId: string;
}

export interface RemoveUserItemOutputModel {
  id: string;
  itemId: string;
}

export interface UpdateUserItemInputModel {
  id: string;
  /** List of items to update */
  items: UserItemModel;
}

export interface UpdateUserItemOutputModel {
  id: string;
  itemId: string;
}

export interface UserItemModel {
  itemId: string;
  quantity: number;
  favoriteTier: number;
  toBuyQuantity: number;
  minToHave: number;
}

export interface UserModel {
  id: string;
  name: string;
  password: string;
  email: string;
  /** List of items associated with the user */
  items: UserItemModel;
}

export interface CreateItemInputModel {
  name: string;
  price: number;
  description: string;
  image: string;
  /** Optional: Category of the item */
  category?: ItemCategoryModel | null;
}

export interface CreateItemOutputModel {
  id: string;
}

export interface GetItemInputModel {
  id: string;
}

export interface GetItemOutputModel {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  /** Optional: Category of the item */
  category?: ItemCategoryModel | null;
}

export interface UpdateItemInputModel {
  id: string;
  name?: string;
  price?: number;
  description?: string;
  image?: string;
  /** Optional: New category for the item */
  category?: ItemCategoryModel | null;
}

export interface UpdateItemOutputModel {
  id: string;
}

export interface DeleteItemInputModel {
  id: string;
}

export interface DeleteItemOutputModel {
  id: string;
}

export interface ItemCategoryModel {
  name: string;
}

export interface ItemModel {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  /** Optional: Category of the item */
  category: ItemCategoryModel | null;
}

export interface CreateGroupInputModel {
  name: string;
  users?: string[];
}

export interface CreateGroupOutputModel {
  id: string;
}

export interface GetGroupInputModel {
  id: string;
}

export interface GetGroupOutputModel {
  id: string;
  name: string;
  users: string[];
}

export interface UpdateGroupInputModel {
  id: string;
  name?: string;
  users?: string[];
}

export interface UpdateGroupOutputModel {
  id: string;
}

export interface DeleteGroupInputModel {
  id: string;
}

export interface DeleteGroupOutputModel {
  id: string;
}

export interface AddUserToGroupInputModel {
  id: string;
  userId: string;
}

export interface AddUserToGroupOutputModel {
  id: string;
  userId: string;
}

export interface RemoveUserFromGroupInputModel {
  id: string;
  userId: string;
}

export interface RemoveUserFromGroupOutputModel {
  id: string;
  userId: string;
}

export interface GroupModel {
  id: string;
  name: string;
  users: string[];
}

export interface LoginUserInputModel {
  email: string;
  password: string;
}

export interface LoginUserOutputModel {
  id: string;
  jwt: string;
  refreshToken: string;
}

export interface LogoutUserInputModel {
  token: string;
}

export interface LogoutUserOutputModel {
  message: string;
}

export interface RefreshTokenInputModel {
  refreshToken: string;
}

export interface RefreshTokenOutputModel {
  jwt: string;
}

export interface JWTPayloadModel {
  id: string;
  iat: number;
  exp: number;
}

export interface RefreshTokenModel {
  token: string;
  userId: string;
  /** @format date-time */
  expiresAt: string;
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
      const r = response.clone() as HttpResponse<T, E>;
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
  users = {
    /**
     * No description
     *
     * @tags Users
     * @name UsersCreate
     * @summary Create user
     * @request POST:/users
     */
    usersCreate: (data: CreateUserInputModel, params: RequestParams = {}) =>
      this.request<CreateUserOutputModel, any>({
        path: `/users`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Users
     * @name UsersUpdate
     * @summary Update user
     * @request PUT:/users/{id}
     */
    usersUpdate: (id: string, data: UpdateUserInputModel, params: RequestParams = {}) =>
      this.request<UpdateUserOutputModel, any>({
        path: `/users/${id}`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Users
     * @name UsersDelete
     * @summary Delete user by user ID
     * @request DELETE:/users/{id}
     */
    usersDelete: (id: string, params: RequestParams = {}) =>
      this.request<DeleteUserOutputModel, any>({
        path: `/users/${id}`,
        method: "DELETE",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Users
     * @name UsersDetail
     * @summary Get user by user ID
     * @request GET:/users/{id}
     */
    usersDetail: (id: string, params: RequestParams = {}) =>
      this.request<GetUserOutputModel, any>({
        path: `/users/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Users
     * @name GroupsDetail
     * @summary Get user groups
     * @request GET:/users/{id}/groups
     */
    groupsDetail: (id: string, params: RequestParams = {}) =>
      this.request<GetUserGroupOutputModel, any>({
        path: `/users/${id}/groups`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Users
     * @name ItemsDetail
     * @summary Get user items by user ID
     * @request GET:/users/{id}/items
     */
    itemsDetail: (id: string, params: RequestParams = {}) =>
      this.request<GetUserItemOutputModel, any>({
        path: `/users/${id}/items`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags User Items
     * @name ItemsCreate
     * @summary Add item to user
     * @request POST:/users/{id}/items
     */
    itemsCreate: (id: string, data: AddUserItemInputModel, params: RequestParams = {}) =>
      this.request<AddUserItemOutputModel, any>({
        path: `/users/${id}/items`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags User Items
     * @name ItemsDelete
     * @summary Remove user item
     * @request DELETE:/users/{id}/items/{itemId}
     */
    itemsDelete: (id: string, itemId: string, params: RequestParams = {}) =>
      this.request<RemoveUserItemOutputModel, any>({
        path: `/users/${id}/items/${itemId}`,
        method: "DELETE",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags User Items
     * @name ItemsUpdate
     * @summary Update user item
     * @request PUT:/users/{id}/items/{itemId}
     */
    itemsUpdate: (id: string, itemId: string, data: UpdateUserItemInputModel, params: RequestParams = {}) =>
      this.request<UpdateUserItemOutputModel, any>({
        path: `/users/${id}/items/${itemId}`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
  items = {
    /**
     * No description
     *
     * @tags Items
     * @name ItemsCreate
     * @summary Store item to database
     * @request POST:/items
     */
    itemsCreate: (data: CreateItemInputModel, params: RequestParams = {}) =>
      this.request<CreateItemOutputModel, any>({
        path: `/items`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Items
     * @name ItemsDetail
     * @summary Get item by item id
     * @request GET:/items/{id}
     */
    itemsDetail: (id: string, params: RequestParams = {}) =>
      this.request<GetItemOutputModel, any>({
        path: `/items/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Items
     * @name ItemsUpdate
     * @summary Update item
     * @request PUT:/items/{id}
     */
    itemsUpdate: (id: string, data: UpdateItemInputModel, params: RequestParams = {}) =>
      this.request<UpdateItemOutputModel, any>({
        path: `/items/${id}`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Items
     * @name ItemsDelete
     * @summary Remove item from database
     * @request DELETE:/items/{id}
     */
    itemsDelete: (id: string, params: RequestParams = {}) =>
      this.request<DeleteItemOutputModel, any>({
        path: `/items/${id}`,
        method: "DELETE",
        format: "json",
        ...params,
      }),
  };
  groups = {
    /**
     * No description
     *
     * @tags Groups
     * @name GroupsCreate
     * @summary Create group
     * @request POST:/groups
     */
    groupsCreate: (data: CreateGroupInputModel, params: RequestParams = {}) =>
      this.request<CreateGroupOutputModel, any>({
        path: `/groups`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Groups
     * @name GroupsDetail
     * @summary Get group by group id
     * @request GET:/groups/{id}
     */
    groupsDetail: (id: string, params: RequestParams = {}) =>
      this.request<GetGroupOutputModel, any>({
        path: `/groups/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Groups
     * @name GroupsUpdate
     * @summary Update group
     * @request PUT:/groups/{id}
     */
    groupsUpdate: (id: string, data: UpdateGroupInputModel, params: RequestParams = {}) =>
      this.request<UpdateGroupOutputModel, any>({
        path: `/groups/${id}`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Groups
     * @name GroupsDelete
     * @summary Delete group by group id
     * @request DELETE:/groups/{id}
     */
    groupsDelete: (id: string, params: RequestParams = {}) =>
      this.request<DeleteGroupOutputModel, any>({
        path: `/groups/${id}`,
        method: "DELETE",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Group Members
     * @name UsersCreate
     * @summary Add user to group
     * @request POST:/groups/{id}/users/{userId}
     */
    usersCreate: (id: string, userId: string, params: RequestParams = {}) =>
      this.request<AddUserToGroupOutputModel, any>({
        path: `/groups/${id}/users/${userId}`,
        method: "POST",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Group Members
     * @name UsersDelete
     * @summary Remove user from group
     * @request DELETE:/groups/{id}/users/{userId}
     */
    usersDelete: (id: string, userId: string, params: RequestParams = {}) =>
      this.request<RemoveUserFromGroupOutputModel, any>({
        path: `/groups/${id}/users/${userId}`,
        method: "DELETE",
        format: "json",
        ...params,
      }),
  };
  health = {
    /**
     * No description
     *
     * @tags System
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
  auth = {
    /**
     * No description
     *
     * @tags Authentication
     * @name LoginCreate
     * @summary Login user
     * @request POST:/auth/login
     */
    loginCreate: (data: LoginUserInputModel, params: RequestParams = {}) =>
      this.request<LoginUserOutputModel, any>({
        path: `/auth/login`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Authentication
     * @name LogoutCreate
     * @summary Logout user
     * @request POST:/auth/logout
     */
    logoutCreate: (data: LogoutUserInputModel, params: RequestParams = {}) =>
      this.request<LogoutUserOutputModel, any>({
        path: `/auth/logout`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Authentication
     * @name RefreshCreate
     * @summary Refresh JWT token
     * @request POST:/auth/refresh
     */
    refreshCreate: (data: RefreshTokenInputModel, params: RequestParams = {}) =>
      this.request<RefreshTokenOutputModel, any>({
        path: `/auth/refresh`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
}
