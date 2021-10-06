import { Vector2 } from "./math";

const testCollisionBetweenPointAndRect = (point: Vector2, rect: [Vector2, Vector2]) => {
    const clashOnX: boolean = rect[0].x === point.x || rect[1].x === point.x
        || (rect[0].x - point.x > 0 && rect[1].x - point.x < 0)
        || (rect[0].x - point.x < 0 && rect[1].x - point.x > 0);
        
    const clashOnY: boolean = rect[0].y === point.y || rect[1].y === point.y
        || (rect[0].y - point.y > 0 && rect[1].y - point.y < 0)
        || (rect[0].y - point.y < 0 && rect[1].y - point.y > 0);

    return clashOnX && clashOnY;
}

const testCollisionBetweenTwoRects = (rect1: [Vector2, Vector2], rect2: [Vector2, Vector2]) => {
    const clashOnX: boolean = Math.abs(rect1[0].x - rect2[0].x) < Math.max(rect1[1].width, rect2[1].width);
    const clashOnY: boolean = Math.abs(rect1[0].y - rect2[0].y) < Math.max(rect1[1].height, rect2[1].height);

    return clashOnX && clashOnY;
}

export { testCollisionBetweenPointAndRect, testCollisionBetweenTwoRects };