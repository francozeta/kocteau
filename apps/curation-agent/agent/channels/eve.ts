import { eveChannel } from "eve/channels/eve";
import { localDev, vercelOidc } from "eve/channels/auth";
import { starterCuratorAuth } from "../lib/starter-curator-auth.js";

export default eveChannel({
  auth: [
    starterCuratorAuth(),
    localDev(),
    vercelOidc(),
  ],
});
