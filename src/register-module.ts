// Use module-alias to import module from root directory
import moduleAlias from "module-alias";

export const registerModule = () => {
  // Register module-alias
  moduleAlias.addAliases({
    "@environment": __dirname + "/environment",
    "@mail": __dirname + "/mail",
  });

  // Execute module-alias
  moduleAlias();
};
