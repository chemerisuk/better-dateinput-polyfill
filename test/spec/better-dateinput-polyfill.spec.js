describe("better-dateinput-polyfill", function() {
    var el, calendar, dateinput;

    beforeEach(function() {
        el = DOM.mock("input[type=date]");
        dateinput = DOM.mock();
        calendar = DOM.mock();
    });

    it("should toggle calendar visibility on space key", function() {
        spyOn(el, "get").and.returnValue("");

        var toggleSpy = spyOn(calendar, "toggle");

        el.onCalendarKeyDown(calendar, dateinput, 32, false);
        expect(toggleSpy).toHaveBeenCalled();
    });

    it("should hide calendar on escape key", function() {
        var spy = spyOn(calendar, "hide");

        el.onCalendarKeyDown(calendar, dateinput, 27, false);
        expect(spy).toHaveBeenCalled();
    });

    it("should prevent default action on any key except tab", function() {
        expect(el.onCalendarKeyDown(calendar, dateinput, 9, false)).not.toBe(false);
        expect(el.onCalendarKeyDown(calendar, dateinput, 111, false)).toBe(false);

        var spy = spyOn(calendar, "matches").and.returnValue(true);

        expect(el.onCalendarKeyDown(calendar, dateinput, 13, false)).toBe(true);
        expect(spy).toHaveBeenCalledWith(":hidden");
    });

    it("should reset calendar value on backspace or delete keys", function() {
        var spy = spyOn(dateinput, "set");

        el.onCalendarKeyDown(calendar, dateinput, 8, false);
        expect(spy).toHaveBeenCalledWith("");
        el.onCalendarKeyDown(calendar, dateinput, 46, false);
        expect(spy.calls.count()).toBe(2);
    });

    it("should handle arrow keys with optional shiftKey", function() {
        var setSpy = spyOn(dateinput, "set").and.returnValue(el),
            expectKey = function(key, altKey, expected) {
                el.onCalendarKeyDown(calendar, dateinput, key, altKey);
                expect(setSpy).toHaveBeenCalledWith(expected);
                setSpy.calls.reset();
            };

        spyOn(dateinput, "get").and.returnValue("2000-01-01");

        expectKey(74, false, "2000-01-08");
        expectKey(40, false, "2000-01-08");
        expectKey(75, false, "1999-12-25");
        expectKey(38, false, "1999-12-25");
        expectKey(76, false, "2000-01-02");
        expectKey(39, false, "2000-01-02");
        expectKey(72, false, "1999-12-31");
        expectKey(37, false, "1999-12-31");

        // cases with shift key
        expectKey(39, true, "2000-02-01");
        expectKey(37, true, "1999-12-01");
        expectKey(40, true, "2001-01-01");
        expectKey(38, true, "1999-01-01");
    });

    it("should change month on nav buttons click", function() {
        var getSpy = spyOn(dateinput, "get").and.returnValue("2000-01-01"),
            setSpy = spyOn(dateinput, "set").and.returnValue(el),
            target = DOM.mock("a");

        el.onCalendarClick(calendar, dateinput, target);
        expect(getSpy).toHaveBeenCalled();
        expect(setSpy).toHaveBeenCalledWith("2000-02-01");

        spyOn(target, "next").and.returnValue(el);

        el.onCalendarClick(calendar, dateinput, target);
        expect(getSpy).toHaveBeenCalled();
        expect(setSpy).toHaveBeenCalledWith("1999-12-01");
    });

    it("should select appropriate day on calendar click", function() {
        var now = new Date(2011, 6, 13, 12),
            target = DOM.mock("td").data("ts", now.getTime()),
            setSpy = spyOn(dateinput, "set");

        el.onCalendarClick(calendar, dateinput, target);
        expect(setSpy).toHaveBeenCalledWith("2011-07-13");
    });

    it("should hide calendar on blur", function() {
        var hideSpy = spyOn(calendar, "hide");

        el.onCalendarBlur(calendar);
        expect(hideSpy).toHaveBeenCalled();
    });

});
