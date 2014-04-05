describe("better-dateinput-polyfill", function() {
    function formatDateISO(value) {
        return value.toISOString().split("T")[0];
    }

    var el, calendar;

    beforeEach(function() {
        el = DOM.mock("input[type=date]");
        calendar = DOM.mock();
    });

    it("should toggle calendar visibility on space key", function() {
        spyOn(el, "get").and.returnValue("");

        var toggleSpy = spyOn(calendar, "toggle");

        el.onCalendarKeyDown(calendar, 32, false);
        expect(toggleSpy).toHaveBeenCalled();
    });

    it("should hide calendar on escape key", function() {
        var spy = spyOn(calendar, "hide");

        el.onCalendarKeyDown(calendar, 27, false);
        expect(spy).toHaveBeenCalled();
    });

    it("should prevent default action on any key except tab", function() {
        expect(el.onCalendarKeyDown(calendar, 9, false)).not.toBe(false);
        expect(el.onCalendarKeyDown(calendar, 111, false)).toBe(false);

        var spy = spyOn(calendar, "matches").and.returnValue(true);

        expect(el.onCalendarKeyDown(calendar, 13, false)).toBe(true);
        expect(spy).toHaveBeenCalledWith(":hidden");
    });

    it("should reset calendar value on backspace or delete keys", function() {
        var spy = spyOn(el, "set");

        el.onCalendarKeyDown(calendar, 8, false);
        expect(spy).toHaveBeenCalledWith("");
        el.onCalendarKeyDown(calendar, 46, false);
        expect(spy.calls.count()).toBe(2);
    });

    it("should handle arrow keys with optional shiftKey", function() {
        var now = new Date(),
            getSpy = spyOn(el, "get"),
            setSpy = spyOn(el, "set").and.returnValue(el),
            expectKey = function(key, altKey, expected) {
                el.onCalendarKeyDown(calendar, key, altKey);
                expect(setSpy).toHaveBeenCalledWith(expected);
                setSpy.calls.reset();
            };

        getSpy.and.returnValue("2000-01-01");

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

        getSpy.and.returnValue("");

        now.setDate(now.getDate() + 1);

        expectKey(76, false, formatDateISO(now));
        expectKey(39, false, formatDateISO(now));

        now.setDate(now.getDate() + 6);

        expectKey(74, false, formatDateISO(now));
        expectKey(40, false, formatDateISO(now));

        now.setDate(now.getDate() - 7);
        now.setFullYear(now.getFullYear() + 1);

        expectKey(40, true, formatDateISO(now));

        now.setFullYear(now.getFullYear() - 2);

        expectKey(38, true, formatDateISO(now));
    });

    it("should change month on nav buttons click", function() {
        var getSpy = spyOn(el, "get").and.returnValue("2000-01-01"),
            setSpy = spyOn(el, "set").and.returnValue(el),
            target = DOM.mock("a");

        el.onCalendarClick(calendar, target);
        expect(getSpy).toHaveBeenCalled();
        expect(setSpy).toHaveBeenCalledWith("2000-02-01");

        spyOn(target, "next").and.returnValue(el);

        el.onCalendarClick(calendar, target);
        expect(getSpy).toHaveBeenCalled();
        expect(setSpy).toHaveBeenCalledWith("1999-12-01");
    });

    it("should select appropriate day on calendar click", function() {
        var now = new Date(2011, 6, 13, 12),
            target = DOM.mock("td").data("ts", now.getTime()),
            setSpy = spyOn(el, "set");

        el.onCalendarClick(calendar, target);
        expect(setSpy).toHaveBeenCalledWith("2011-07-13");
    });

    it("should hide calendar on blur", function() {
        var hideSpy = spyOn(calendar, "hide");

        el.onCalendarBlur(calendar);
        expect(hideSpy).toHaveBeenCalled();
    });

    it("should use current date for calendar if value is empty", function() {
        var now = new Date(),
            getSpy = spyOn(el, "get").and.returnValue(""),
            setSpy = spyOn(el, "set").and.returnValue(el),
            target = DOM.mock("a");

        now.setMonth(now.getMonth() + 1);

        el.onCalendarClick(calendar, target);
        expect(getSpy).toHaveBeenCalled();
        expect(setSpy).toHaveBeenCalledWith(formatDateISO(now));

        spyOn(target, "next").and.returnValue(el);

        now.setMonth(now.getMonth() - 2);

        el.onCalendarClick(calendar, target);
        expect(getSpy).toHaveBeenCalled();
        expect(setSpy).toHaveBeenCalledWith(formatDateISO(now));
    });

});
