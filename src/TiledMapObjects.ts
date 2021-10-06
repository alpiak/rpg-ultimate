import { Vector2 } from "./math";

class Shape {
    static RectAngle = class extends Shape {
        public readonly size: Vector2;
    
        constructor(width: number, height: number) {
            super();
    
            this.size = new Vector2(width, height);
        }
    };
}

class TiledMapObject {
    public static Shape = Shape;
    public id: string;
    public name: string;
    public position: Vector2;
    public shape: Shape;
    private properties = new Map<string, string|number>();

    constructor(id: string, position: Vector2, shape: Shape, name?: string) {
        this.id = id;
        this.position = position;
        this.shape = shape;
        this.name = name;
    }

    setProperty(key: string, value: string|number) {
        this.properties.set(key, value);
    }

    getProperty(key: string): string|number {
        return this.properties.get(key);
    }
}

class CollisionObject extends TiledMapObject {}

class Character extends CollisionObject {
    public activeArea?: [Vector2, Vector2];
}

class InteractionObject extends TiledMapObject {}

export { TiledMapObject, Character, CollisionObject, InteractionObject };