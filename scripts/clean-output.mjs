import { rmSync } from "node:fs";
// Clean only generated production output so a withdrawn post cannot survive a rebuild.
rmSync(new URL("../_site/", import.meta.url), { recursive: true, force: true });
