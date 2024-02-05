import { makeSchema } from "nexus";
import { join } from "path";
import * as types from "./graphql";

export const schema = makeSchema({
  // types: [], // 1
  types,
  outputs: {
    schema: join(process.cwd(), "schema.graphql"), // 2
    typegen: join(process.cwd(), "nexus-typegen.ts"), // 3
  },
  // this// this is what's used to connect our graphql server with the db
  contextType: {
    module: join(process.cwd(), "./src/context.ts"),
    export: "Context",
  },
});
