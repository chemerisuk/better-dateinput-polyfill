describe("better-dateinput-polyfill", function() {
    function formatDateISO(value) {
        return value.toISOString().split("T")[0];
    }

    var el, calendar, label;

    beforeEach(function() {
        el = DOM.mock("input[type=date]");
        calendar = DOM.mock();
        label = DOM.mock("span");
    });

    it("should toggle calendar visibility on space key", function() {
        spyOn(el, "get").and.returnValue("");

        var toggleSpy = spyOn(calendar, "toggle");

        el._keydownCalendar(calendar, 32, false);
        expect(toggleSpy).toHaveBeenCalled();
    });

    it("should hide calendar on escape key", function() {
        var spy = spyOn(calendar, "hide");

        el._keydownCalendar(calendar, 27, false);
        expect(spy).toHaveBeenCalled();
    });

    it("should prevent default action on any key except tab", function() {
        expect(el._keydownCalendar(calendar, 9, false)).not.toBe(false);
        expect(el._keydownCalendar(calendar, 111, false)).toBe(false);

        var spy = spyOn(calendar, "matches").and.returnValue(true);

        expect(el._keydownCalendar(calendar, 13, false)).toBe(true);
        expect(spy).toHaveBeenCalledWith(":hidden");
    });

    it("should reset calendar value on backspace or delete keys", function() {
        var spy = spyOn(el, "set");

        el._keydownCalendar(calendar, 8, false);
        expect(spy).toHaveBeenCalledWith("");
        el._keydownCalendar(calendar, 46, false);
        expect(spy.calls.count()).toBe(2);
    });

    it("should handle arrow keys with optional shiftKey", function() {
        function expectKey(key, altKey, expected) {
            el._keydownCalendar(calendar, key, altKey);
            expect(el.get()).toBe(expected);
            el.set("2000-01-01");
        }

        el.set("2000-01-01");

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
        var target = DOM.mock("a");

        el.set("2000-01-01");
        el._clickCalendar(calendar, target);
        expect(el.get()).toBe("2000-02-01");

        spyOn(target, "next").and.returnValue(el);
        el._clickCalendar(calendar, target);
        expect(el.get()).toBe("2000-01-01");
    });

    it("should select appropriate day on calendar click", function() {
        var now = new Date(2011, 6, 13, 12),
            target = DOM.mock("td").set("_ts", now.getTime()),
            setSpy = spyOn(el, "set");

        el._clickCalendar(calendar, target);
        expect(setSpy).toHaveBeenCalledWith("2011-07-13");
    });

    it("should hide calendar on blur", function() {
        var hideSpy = spyOn(calendar, "hide");

        el._blurCalendar(calendar);
        expect(hideSpy).toHaveBeenCalled();
    });

    it("should use current date for calendar if value is empty", function() {
        var now = new Date(),
            getSpy = spyOn(el, "get").and.returnValue(""),
            setSpy = spyOn(el, "set"),
            target = DOM.mock("a");

        now.setMonth(now.getMonth() + 1);

        el._clickCalendar(calendar, target);
        expect(getSpy).toHaveBeenCalled();
        expect(setSpy).toHaveBeenCalledWith(formatDateISO(now));

        spyOn(target, "next").and.returnValue(el);

        now.setMonth(now.getMonth() - 2);

        el._clickCalendar(calendar, target);
        expect(getSpy).toHaveBeenCalled();
        expect(setSpy).toHaveBeenCalledWith(formatDateISO(now));
    });

    it("should display calendar on focus", function() {
        var spy = spyOn(calendar, "show");

        el._focusCalendar(calendar);
        expect(spy).toHaveBeenCalled();
    });

    it("should restore initial value on form reset", function() {
        el.set("defaultValue", "2000-10-20");
        el.set("value", "2000-10-2");

        el._resetForm();

        expect(el.get()).toBe("2000-10-20");
    });

    it("should format date with default format", function() {
        el.set("value", "2014-11-02");

        el._formatValue(label);

        expect(label.get("textContent")).toBe("Su, 02 NovNov. 2014");
    });

    it("should format date with custom formats", function() {
        el.set("value", "2014-08-03");
        el.set("data-format", "MM/dd/yyyy");
        el._formatValue(label);
        expect(label.get("textContent")).toBe("08/03/2014");

        el.set("value", "2008-02-03");
        el.set("data-format", "w: d/M/y");
        el._formatValue(label);
        expect(label.get("textContent")).toBe("5: 3/2/8");

        el.set("value", "2007-02-08");
        el.set("data-format", "dd W MM, DD ww yy");
        el._formatValue(label);
        expect(label.get("textContent")).toBe("08 2 02, 039 06 07");

        el.set("value", "2012-10-14");
        el.set("data-format", "d W M, D w y");
        el._formatValue(label);
        expect(label.get("textContent")).toBe("14 3 10, 288 41 12");
    });

    it("should keep literals on custom formats", function() {
        el.set("value", "2014-12-03");
        el.set("data-format", "EE (u), F'th week of' MMMM d'th' yy (DD'th of year')");

        el._formatValue(label);

        expect(label.get("textContent")).toBe("Wednesday (3), 1th week of December 3th 14 (337th of year)");
    });
});
