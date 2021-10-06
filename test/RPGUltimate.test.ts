import { open } from "fs/promises";

import RPGUltimate from "../src/RPGUltimate";

describe("When initailizing the instance", () => {
    let rpgUltimate: RPGUltimate;

    beforeAll(async () => {
        rpgUltimate = new RPGUltimate();

        let filehandle;

        try {
            filehandle = await open("./test/assets/first_town.tmx", "r");
            rpgUltimate.loadTiledMapData(await filehandle.readFile({ encoding: "utf8" }));
        } finally {
            await filehandle?.close();
        }
    });
    
    test("Initialization", async () => {
        console.log(rpgUltimate);
        expect(true);
    });
});