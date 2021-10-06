import { Direction2D, Vector2 } from "./math";
import { TiledMapObject, Character, CollisionObject, InteractionObject } from "./TiledMapObjects";
import { testCollisionBetweenPointAndRect, testCollisionBetweenTwoRects } from "./utils";

enum Type {
    Characters = "characters",
    Collision = "collision",
    Interactions = "interactions",
}

class TiledMap {
    public static MoveCharacterResult = class {
        public readonly success: boolean;

        constructor(success: boolean) {
            this.success = success;
        }
    }
    
    private static MoveCharacterResultSuccess = class extends TiledMap.MoveCharacterResult {
        public readonly newPosition: Vector2;

        constructor(success: boolean, newPosition: Vector2) {
            super(success);

            this.newPosition = newPosition;
        }
    }
    
    private static MoveCharacterResultFail = class extends TiledMap.MoveCharacterResult {
        public readonly collisions: CollisionObject[];
        public readonly interactions: InteractionObject[];

        constructor(success: boolean, collisions: CollisionObject[], interactions: InteractionObject[]) {
            super(success);

            this.collisions = collisions;
            this.interactions = interactions;
        }
    }
    
    private static DEFAULT_ACTIVE_AREA_RATIO = .3;

    private static TileLayer = class {
        public width: number;
        public height: number;
        public tiles: number[];
        public name?: string;

        constructor(width: number, height: number, tiles: number[], name?: string) {
            this.width = width;
            this.height = height;
            this.tiles = tiles;
            this.name = name;
        }
    }

    private static ObjectGroup = class {
        static Type = Type;
        
        public objects: Array<TiledMapObject>;
        public type: Type;
        
        public getActiveObjects(key: string) {
            return this.activeIndices.get(key).map((i) => this.objects[i]);
        }

        public setActiveIndices(key: string, value: number[]) {
            this.activeIndices.set(key, value);
        }

        private activeIndices: Map<string, number[]> = new Map<string, number[]>();
        private properties = new Map<string, string|number>();

        constructor(objects: Array<TiledMapObject>, type: Type) {
            this.objects = objects;
            this.type = type;
        }

        public setProperty(key: string, value: string|number) {
            this.properties.set(key, value);
        }

        public getProperty(key: string): string|number {
            return this.properties.get(key);
        }

        getObjectById(id: string) {
            for (const object of this.objects) {
                if (object.id === id) {
                    return object;
                }
            }

            return null;
        }
    }

    private static ORTHOGONAL = "orthogonal";
    private static RIGHT_DOWN = "right-down";
    private static TILE_LAYER = "layer";
    private static OBJECT_LAYER = "objectgroup";
    private static RECT_ANGLE = "rectangle";

    private width: number;
    private height: number;
    private tileWidth: number;
    private tileHeight: number;
    private tileLayers: Array<InstanceType<(typeof TiledMap)["TileLayer"]>> = [];
    private objectGroups: Map<Type, InstanceType<(typeof TiledMap)["ObjectGroup"]>> = new Map<Type, InstanceType<(typeof TiledMap)["ObjectGroup"]>>();

    private static getTileLayersFromTiledMapLayerData(layersData: any[], renderOrder = TiledMap.RIGHT_DOWN, orientation = TiledMap.ORTHOGONAL): Array<InstanceType<(typeof TiledMap)["TileLayer"]>> {
        const layers = new Array<InstanceType<(typeof TiledMap)["TileLayer"]>>();
        
        if (orientation === TiledMap.ORTHOGONAL && renderOrder === TiledMap.RIGHT_DOWN) {
            for (const layerData of layersData) {
                if (layerData.type === TiledMap.TILE_LAYER && layerData.visible && Number.isInteger(layerData.width) && Number.isInteger(layerData.height) && Array.isArray(layerData.data)) {
                    layers.push(new TiledMap.TileLayer(layerData.width, layerData.height, layerData.data.reverse(), layerData.name)); // The origin order of layer data is left-up, reverse it.
                }
            }
        }

        return layers;
    }

    private static getObjectsFromTiledMapLayerData(layersData: any[], renderOrder = TiledMap.RIGHT_DOWN, orientation = TiledMap.ORTHOGONAL): Map<Type, InstanceType<(typeof TiledMap)["ObjectGroup"]>> {
        const map = new Map<Type, InstanceType<(typeof TiledMap)["ObjectGroup"]>>();
        
        if (orientation === TiledMap.ORTHOGONAL && renderOrder === TiledMap.RIGHT_DOWN) {
            for (const layerData of layersData) {
                if (layerData.type === TiledMap.OBJECT_LAYER && layerData.visible && Array.isArray(layerData.objects)) {
                    const type: Type = ((layerData) => {
                        for (const type in TiledMap.ObjectGroup.Type) {
                            if (layerData.name === TiledMap.ObjectGroup.Type[type]) {
                                return TiledMap.ObjectGroup.Type[type];
                            }
                        }
                    })(layerData);

                    const NewTiledMapObject = ((type) => {
                        switch (type) {
                            case Type.Characters:
                                return Character;
                            
                            case Type.Collision:
                                return CollisionObject;

                            case Type.Interactions:
                                return InteractionObject;
                        }
                    })(type);

                    map.set(type, new TiledMap.ObjectGroup(layerData.objects.map((objectData) => new NewTiledMapObject(objectData.id, new Vector2(objectData.x, objectData.y), ((objectData) => {
                        if (objectData.shape === TiledMap.RECT_ANGLE) {
                            return new TiledMapObject.Shape.RectAngle(objectData.width, objectData.height);
                        }

                        throw new Error("Layer type not defined.");
                    })(objectData), objectData.name)), type));
                }
            }
        }

        return map;
    }

    public setMapSize(width: number, height: number, tileWidth: number, tileHeight: number) {
        this.width = width;
        this.height = height;
        this.tileWidth = tileWidth;
        this.tileHeight = tileHeight;
    }

    public loadTileLayersData(layersData) {
        this.tileLayers = TiledMap.getTileLayersFromTiledMapLayerData(layersData);
    }

    public loadObjectGroupsData(layersData) {
        this.objectGroups = TiledMap.getObjectsFromTiledMapLayerData(layersData);
    }

    public moveCharacter(index: number, direction: Direction2D): InstanceType<(typeof TiledMap)["MoveCharacterResult"]>;
    public moveCharacter(id: string, direction: Direction2D): InstanceType<(typeof TiledMap)["MoveCharacterResult"]>;
    public moveCharacter(key: number|string, direction: Direction2D): InstanceType<(typeof TiledMap)["MoveCharacterResult"]> {
        const character: Character = ((key) => {
            if (Number.isInteger(key)) {
                return this.objectGroups.get(TiledMap.ObjectGroup.Type.Characters).objects[key];
            }
    
            return this.objectGroups.get(TiledMap.ObjectGroup.Type.Characters).getObjectById(String(key));
        })(key);

        if (!character) {
            throw Error("Character not exist.");
        }

        this.updateActiveArea(character);

        const newPosition = ((oldPosition, direction) => {
            switch (direction) {
                case Direction2D.Left:
                    return oldPosition.add(new Vector2(this.tileWidth * -1, 0));
                
                case Direction2D.Top:
                    return oldPosition.add(new Vector2(0, this.tileHeight));

                case Direction2D.Right:
                    return oldPosition.add(new Vector2(this.tileWidth, 0));

                case Direction2D.Bottom:
                    return oldPosition.add(new Vector2(0, this.tileHeight * -1));
            }
        })(character.position, direction);

        const collisionObjects = ((character) => {
            for (const group of [this.objectGroups.get(Type.Collision), this.objectGroups.get(Type.Characters)]) {
                if (character.shape instanceof TiledMapObject.Shape.RectAngle) {
                    const collisionObject = this.testCollision([newPosition, character.shape.size], group.getActiveObjects(character.id));
        
                    if (collisionObject) {
                        return [collisionObject];
                    }
                }
            }

            return null;
        })(character);

        const interactionObjects = ((character) => {
            if (character.shape instanceof TiledMapObject.Shape.RectAngle) {
                const interactionObject = this.testCollision([newPosition, character.shape.size], this.objectGroups.get(Type.Interactions).getActiveObjects(character.id));
    
                if (interactionObject) {
                    return [interactionObject];
                }
            }

            return null;
        })(character);

        if (collisionObjects?.length || interactionObjects?.length) {
            return new TiledMap.MoveCharacterResultFail(false, collisionObjects, interactionObjects);
        } else {
            character.position = newPosition;

            return new TiledMap.MoveCharacterResultSuccess(true, newPosition);
        }
    }

    public updateActiveArea(character: TiledMapObject) {
        if (character instanceof TiledMapObject) {
            if (!(character instanceof Character)) {
                return;
            }

            const collisionGroup = this.objectGroups.get(TiledMap.ObjectGroup.Type.Collision);
            const interactionGroup = this.objectGroups.get(TiledMap.ObjectGroup.Type.Interactions);
            const characterGroup = this.objectGroups.get(TiledMap.ObjectGroup.Type.Characters);

            // The active area is not set or the character moved out of the current active area.
            if (!character.activeArea || !testCollisionBetweenPointAndRect(character.position, character.activeArea)) {
                const activeAreaWidth = this.width * TiledMap.DEFAULT_ACTIVE_AREA_RATIO;
                const activeAreaHeight = this.height * TiledMap.DEFAULT_ACTIVE_AREA_RATIO;

                character.activeArea = [
                    new Vector2(character.position.x, character.position.y),
                    new Vector2(character.position.x + activeAreaWidth, character.position.y + activeAreaHeight),
                ];

                [collisionGroup, interactionGroup, characterGroup].forEach((group) => {
                    group.setActiveIndices(character.id, group.objects.map((collisionObject, i) => {
                        if (collisionObject === character) {
                            return null;
                        }

                        if (collisionObject.shape instanceof TiledMapObject.Shape.RectAngle) {
                            if (testCollisionBetweenTwoRects([collisionObject.position, collisionObject.shape.size], character.activeArea)) {
                                return i;
                            }
        
                            return null;
                        }
                    }).filter((i) => i !== null));
                });
            }
        } else if (!character) {
            this.objectGroups.get(TiledMap.ObjectGroup.Type.Characters).objects.forEach((character) => {
                this.updateActiveArea(character);
            });
        }
    }

    public testCollision(area: [Vector2, Vector2], activeObjects: TiledMapObject[]): TiledMapObject|null;
    public testCollision(character: TiledMapObject, type: Type): TiledMapObject|null;
    public testCollision(areaOrCharacter?: TiledMapObject|[Vector2, Vector2], activeObjectsOrType?: TiledMapObject[]|Type): TiledMapObject|null {
        if (!areaOrCharacter) {
            for (const character of this.objectGroups.get(TiledMap.ObjectGroup.Type.Characters).objects) {
                for (const type in Type) {
                    const collisionObject = this.testCollision(character, Type[type]);
        
                    if (collisionObject) {
                        return collisionObject;
                    }
                }
            }
        }

        if (Array.isArray(areaOrCharacter) && areaOrCharacter[0] instanceof Vector2 && areaOrCharacter[1] instanceof Vector2) {
            for(const activeObject of activeObjectsOrType) {
                if (!(activeObject instanceof TiledMapObject)) {
                    continue;
                }

                if (activeObject.shape instanceof TiledMapObject.Shape.RectAngle) {
                    if (testCollisionBetweenTwoRects([activeObject.position, activeObject.shape.size], areaOrCharacter)) {
                        return activeObject;
                    }
                }
            }

            return null;
        }

        if (areaOrCharacter instanceof TiledMapObject && (activeObjectsOrType as string) in Type) {
            if (!(areaOrCharacter instanceof Character)) {
                return null;
            }

            const group = this.objectGroups.get(activeObjectsOrType as Type);
            this.testCollision(areaOrCharacter.activeArea, group.getActiveObjects(areaOrCharacter.id));
        }
    }

    public getObjectGroups() {
        return this.objectGroups;
    }
}

export default TiledMap;
