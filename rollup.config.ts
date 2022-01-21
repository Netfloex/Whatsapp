import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import run from "@rollup/plugin-run";
import { join } from "path";
import { defineConfig } from "rollup";
import { terser } from "rollup-plugin-terser";
import typescript from "rollup-plugin-typescript2";

const dev = process.env.ROLLUP_WATCH === "true";

export default defineConfig({
	input: join(process.cwd(), "src", "index.ts"),
	output: {
		dir: "dist",
		format: "cjs",
		generatedCode: "es5",
		plugins: dev ? [] : [terser()],
	},

	preserveEntrySignatures: false,
	external: ["knex"],
	plugins: [
		nodeResolve({ preferBuiltins: true }),
		dev && run({ execArgv: ["--inspect"] }),
		json(),
		typescript(),
		commonjs({
			ignore: ["sharp", "jimp", "qrcode-terminal"],
		}),
	],
});
