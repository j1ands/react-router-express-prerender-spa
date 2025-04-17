import {
  type RouteConfig,
  route,
  index
} from "@react-router/dev/routes";

export default [
  // * matches all URLs, the ? makes it optional so it will match / as well
  index("./App.tsx"),
  route("/home", "./pages/home.tsx"),
  route("/about", "./pages/about.tsx"),
  route("*?", "./catchall.tsx"),
] satisfies RouteConfig;
