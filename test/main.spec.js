describe("better-dateinput-polyfill", function() {
    function formatDateISO(value) {
        return value.toISOString().split("T")[0];
    }

    var el, calendar, months, label;

    beforeEach(function() {
        el = DOM.mock("<input type='date'>");
        calendar = DOM.mock();
        months = DOM.mock();
        label = DOM.mock("<span>");
    });

    it("should toggle calendar visibility on space key", function() {
        spyOn(el, "get").and.returnValue("");

        var toggleSpy = spyOn(calendar, "toggle");

        el._keydownPicker(calendar, months, 32);
        expect(toggleSpy).toHaveBeenCalled();
    });

    it("should hide calendar on escape key", function() {
        var spy = spyOn(calendar, "hide");

        el._keydownPicker(calendar, months, 27);
        expect(spy).toHaveBeenCalled();
    });

    it("should prevent default action on any key except tab", function() {
        expect(el._keydownPicker(calendar, months, 9)).not.toBe(false);
        expect(el._keydownPicker(calendar, months, 111)).toBe(false);

        var spy = spyOn(calendar, "matches").and.returnValue(true);

        expect(el._keydownPicker(calendar, months, 13)).toBe(true);
        expect(spy).toHaveBeenCalledWith(":hidden");
    });

    it("should reset calendar value on backspace or delete keys", function() {
        var spy = spyOn(el, "value");

        el._keydownPicker(calendar, months, 8);
        expect(spy).toHaveBeenCalledWith("");
        el._keydownPicker(calendar, months, 46);
        expect(spy.calls.count()).toBe(2);
    });

    it("should handle arrow keys with optional shiftKey", function() {
        function expectKey(key, altKey, expected) {
            el._keydownPicker(calendar, months, key);
            expect(el.value()).toBe(expected);
            el.value("2000-01-01");
        }

        el.value("2000-01-01");

        expectKey(74, false, "2000-01-08");
        expectKey(40, false, "2000-01-08");
        expectKey(75, false, "1999-12-25");
        expectKey(38, false, "1999-12-25");
        expectKey(76, false, "2000-01-02");
        expectKey(39, false, "2000-01-02");
        expectKey(72, false, "1999-12-31");
        expectKey(37, false, "1999-12-31");

        // cases with shift key
        // expectKey(39, true, "2000-02-01");
        // expectKey(37, true, "1999-12-01");
        // expectKey(40, true, "2001-01-01");
        // expectKey(38, true, "1999-01-01");
    });

    describe("nav", () => {
        it("changes month in day picker mode", function() {
            var target = DOM.mock("<a>");

            el.value("2000-01-01");
            el._clickPicker(calendar, months, target);
            expect(el.value()).toBe("2000-02-01");

            spyOn(target, "next").and.returnValue(el);
            el._clickPicker(calendar, months, target);
            expect(el.value()).toBe("2000-01-01");
        });

        it("changes year in month picker mode", function() {
            var target = DOM.mock("<time>");

            spyOn(months, "contains").and.returnValue(true);

            el.value("2000-01-01");

            target.set("datetime", "2000-06-09");
            el._clickPicker(calendar, months, target);
            expect(el.value()).toBe("2000-06-01");

            target.set("datetime", "2000-10-09");
            el._clickPicker(calendar, months, target);
            expect(el.value()).toBe("2000-10-01");
        });
    });

    it("should select appropriate day on calendar click", function() {
        var now = new Date(2011, 6, 13, 12);
        var target = DOM.mock();

        spyOn(target, "matches").and.callFake((tagName) => {
            return tagName === "td";
        });

        el.value("2000-01-01");
        el._clickPicker(calendar, months, target);
        expect(el.value()).toBe("2000-01-01");

        spyOn(target, "data").and.returnValue(now.getTime());
        el._clickPicker(calendar, months, target);
        expect(el.value()).toBe("2011-07-13");
    });

    it("should hide calendar on blur", function() {
        var hideSpy = spyOn(calendar, "hide");

        el._blurPicker(calendar);
        expect(hideSpy).toHaveBeenCalled();
    });

    it("should use current date for calendar if value is empty", function() {
        var now = new Date(),
            getSpy = spyOn(el, "get").and.returnValue(""),
            setSpy = spyOn(el, "value"),
            months = DOM.mock("<table>"),
            target = DOM.mock("<a>");

        now.setMonth(now.getMonth() + 1);

        el._clickPicker(calendar, months, target);
        expect(getSpy).toHaveBeenCalled();
        expect(setSpy).toHaveBeenCalledWith(formatDateISO(now));

        spyOn(target, "next").and.returnValue(el);

        now.setMonth(now.getMonth() - 2);

        el._clickPicker(calendar, months, target);
        expect(getSpy).toHaveBeenCalled();
        expect(setSpy).toHaveBeenCalledWith(formatDateISO(now));
    });

    it("should display calendar on focus", function() {
        var spy = spyOn(calendar, "show");

        el._focusPicker(calendar);
        expect(spy).toHaveBeenCalled();
    });

    it("should restore initial value on form reset", function() {
        el.set("defaultValue", "2000-10-20");
        el.value("2000-10-2");

        el._resetForm();

        expect(el.value()).toBe("2000-10-20");
    });

    describe("caption", () => {
        var pickerCaption;
        var calendarDaysMain;

        beforeEach(() => {
            pickerCaption = DOM.mock();
            calendarDaysMain = DOM.mock();
        });

        it("updates visible value format on click", () => {
            var spy = jasmine.createSpy();
            var setSpy = spyOn(pickerCaption, "set");

            el._clickPickerCaption(calendar, months, calendarDaysMain, pickerCaption, spy);
            expect(setSpy).toHaveBeenCalledWith("data-format", "yyyy");
            expect(spy.calls.count()).toBe(1);

            spyOn(calendar, "contains").and.returnValue(true);
            el._clickPickerCaption(calendar, months, calendarDaysMain, pickerCaption, spy);
            expect(setSpy).toHaveBeenCalledWith("data-format", "MMMM yyyy");
            expect(spy.calls.count()).toBe(2);
        });
    });

    describe("label", () => {
        it("propagates click to input", () => {
            var spy = jasmine.createSpy();

            el.on("focus", spy);
            el._clickLabel();
            expect(spy).toHaveBeenCalled();
        });
    });
});
