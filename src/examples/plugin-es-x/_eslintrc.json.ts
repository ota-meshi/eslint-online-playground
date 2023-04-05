export default {
  extends: ["plugin:es-x/restrict-to-es2019"],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  env: { es2021: true },
};
