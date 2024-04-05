export default {
  extends: ["plugin:@sap/cds/recommended"],
  rules: {
    "no-console": "error",
    "@sap/cds/auth-restrict-grant-service": ["warn", "show"],
  },
};
