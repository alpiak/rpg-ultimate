import { tmx } from "tmx-tiledmap";

import { Direction2D } from "./math";
import TiledMap from "./TiledMap";

class RPGUltimate {
    private tiledMap: TiledMap = new TiledMap();

    constructor() {
        
    }

    public async loadTiledMapData(tiledMapXML: string) {

        // console.log(tiledMapXML);

        const tiledMapData = await tmx(tiledMapXML);

        // console.log(tiledMapData);
        console.log(tiledMapData.layers[6].objects);
        // console.log(tiledMapData.tilesets[0]);

        const layersData = (tiledMapData && tiledMapData["layers"]?.sort((a: any, b: any) => a["id"] - b["id"])) || [];

        console.log(tiledMapData);

        this.tiledMap.setMapSize(tiledMapData?.width * tiledMapData?.tilewidth, tiledMapData?.height * tiledMapData?.tileheight, tiledMapData?.tilewidth, tiledMapData?.tileheight);
        this.tiledMap.loadTileLayersData(layersData);
        this.tiledMap.loadObjectGroupsData(layersData);
    }
    
    public moveCharacterOnMap(index: number, direction: Direction2D): InstanceType<(typeof TiledMap)["MoveCharacterResult"]>;
    public moveCharacterOnMap(id: string, direction: Direction2D): InstanceType<(typeof TiledMap)["MoveCharacterResult"]>;
    public moveCharacterOnMap(key: number|string, direction: Direction2D): InstanceType<(typeof TiledMap)["MoveCharacterResult"]> {
        if (Number.isInteger(key)) {
            return this.tiledMap.moveCharacter(Number(key), direction);
        }

        return this.tiledMap.moveCharacter(String(key), direction);
    }

    public getMapObjectGroups() {
        return this.tiledMap.getObjectGroups();
    }
}

export default RPGUltimate;