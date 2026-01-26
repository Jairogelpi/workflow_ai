/* @ts-self-types="./antigravity_engine.d.ts" */

import * as wasm from "./antigravity_engine_bg.wasm";
import { __wbg_set_wasm } from "./antigravity_engine_bg.js";
__wbg_set_wasm(wasm);
wasm.__wbindgen_start();
export {
    apply_forces
} from "./antigravity_engine_bg.js";
