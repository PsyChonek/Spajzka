// Tighten req.params and req.query value types back to plain strings.
// @types/express 5.x (via @types/qs) widens req.query values to include
// arrays and ParsedQs objects, and newer @types/express-serve-static-core
// widens req.params the same way. The routes in this codebase pass these
// values directly into ObjectId() and other string-only APIs, and all
// routes that use them expect scalar strings. This override restores the
// older, simpler typing for the whole api workspace.
import 'express-serve-static-core';

declare module 'express-serve-static-core' {
  interface ParamsDictionary {
    [key: string]: string;
  }

  interface Query {
    [key: string]: string | undefined;
  }
}
