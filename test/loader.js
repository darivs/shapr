// node --import ./test/loader.js: gpui-kit, gpui-base and herdr resolve to the stubs.
import { register } from "node:module";
register("./hooks.js", import.meta.url);
