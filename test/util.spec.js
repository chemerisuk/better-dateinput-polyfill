import {repeat} from "../src/util.js";

describe("util", function() {
    describe("repeat", () => {
        it("repeats a string", function() {
            expect(repeat(3, "ab")).toBe("ababab");
            expect(repeat(4, "xyz")).toBe("xyzxyzxyzxyz");
        });
    });
});
