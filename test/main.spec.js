describe("better-dateinput-polyfill", function() {
    function formatDateISO(value) {
        return value.toISOString().split("T")[0];
    }

    var el, picker, months, caption, label;

    beforeEach(function() {
        el = DOM.mock("<input type='date'>");
        picker = DOM.mock("<div>");
        months = DOM.mock();
        caption = DOM.mock();
        label = DOM.mock("<span>");
    });

    it("should toggle calendar visibility on space key", function() {
        spyOn(el, "get").and.returnValue("");

        var toggleSpy = spyOn(picker, "toggle");

        el._keydownPicker(picker, 32);
        expect(toggleSpy).toHaveBeenCalled();
    });

    it("should hide calendar on escape key", function() {
        var spy = spyOn(picker, "hide");

        el._keydownPicker(picker, 27);
        expect(spy).toHaveBeenCalled();
    });

    it("should prevent default action on any key except tab", function() {
        expect(el._keydownPicker(picker, 9)).not.toBe(false);
        expect(el._keydownPicker(picker, 111)).toBe(false);

        var spy = spyOn(picker, "matches").and.returnValue(true);

        expect(el._keydownPicker(picker, 13)).toBe(true);
        expect(spy).toHaveBeenCalledWith(":hidden");
    });

    it("should reset calendar value on backspace or delete keys", function() {
        var spy = spyOn(el, "value").and.returnValue(el);

        el._keydownPicker(picker, 8);
        expect(spy).toHaveBeenCalledWith("");

        spy.calls.reset();

        el._keydownPicker(picker, 46);
        expect(spy).toHaveBeenCalledWith("");
    });

    it("toggles calendar mode on control key", function() {
        expect(picker.get("aria-expanded")).not.toBe("true");

        el._keydownPicker(picker, 17);
        expect(picker.get("aria-expanded")).toBe("true");

        el._keydownPicker(picker, 17);
        expect(picker.get("aria-expanded")).not.toBe("true");
    });

    it("should handle arrow keys", function() {
        function expectKey(key, expected) {
            el._keydownPicker(picker, key);
            expect(el.value()).toBe(expected);
            el.value("2000-01-01");
        }

        el.value("2000-01-01");

        expectKey(74, "2000-01-08");
        expectKey(40, "2000-01-08");
        expectKey(75, "1999-12-25");
        expectKey(38, "1999-12-25");
        expectKey(76, "2000-01-02");
        expectKey(39, "2000-01-02");
        expectKey(72, "1999-12-31");
        expectKey(37, "1999-12-31");

        picker.set("aria-expanded", "true");
        // cases with shift key
        expectKey(39, "2000-02-01");
        expectKey(37, "1999-12-01");
        expectKey(40, "2000-05-01");
        expectKey(38, "1999-09-01");
    });

    it("changes month/year", function() {
        var target = DOM.mock("<a>");

        el.value("2000-01-01");
        el._clickPicker(picker, months, target);
        expect(el.value()).toBe("2000-02-01");

        picker.set("aria-expanded", "true");
        el._clickPicker(picker, months, target);
        expect(el.value()).toBe("2001-02-01");

        spyOn(target, "next").and.returnValue(el);

        el.value("2000-01-01");
        el._clickPicker(picker, months, target);
        expect(el.value()).toBe("1999-01-01");

        picker.set("aria-expanded", "true");
        el._clickPicker(picker, months, target);
        expect(el.value()).toBe("1998-01-01");

        el.value("1970-01-01");
        el._clickPicker(picker, months, target);
        expect(el.value()).toBe("1969-01-01");
    });

    it("changes month in month picker mode", function() {
        var target = DOM.mock("<time>");

        spyOn(months, "contains").and.returnValue(true);

        el.value("2000-01-01");

        target.set("datetime", "2000-06-09");
        el._clickPicker(picker, months, target);
        expect(el.value()).toBe("2000-06-01");

        target.set("datetime", "2000-10-09");
        el._clickPicker(picker, months, target);
        expect(el.value()).toBe("2000-10-01");

        el.value("1970-09-01");
        target.set("datetime", "1970-01-01");
        el._clickPicker(picker, months, target);
        expect(el.value()).toBe("1970-01-01");
    });

    it("should select appropriate day on calendar click", function() {
        var now = new Date(2011, 6, 13, 12);
        var target = DOM.mock();

        spyOn(target, "matches").and.callFake((tagName) => {
            return tagName === "td";
        });

        el.value("2000-01-01");
        el._clickPicker(picker, months, target);
        expect(el.value()).toBe("2000-01-01");

        spyOn(target, "data").and.returnValue(now.getTime());
        el._clickPicker(picker, months, target);
        expect(el.value()).toBe("2011-07-13");

        // 0 is for unix time 1970-01-01
        el.value("2013-01-01");
        target.data = () => { return 0; };
        el._clickPicker(picker, months, target);
        expect(el.value()).toBe("1970-01-01");
    });

    it("should hide calendar on blur", function() {
        var hideSpy = spyOn(picker, "hide");

        el._blurPicker(picker);
        expect(hideSpy).toHaveBeenCalled();
    });

    it("should use current date for calendar if value is empty", function() {
        var now = new Date(),
            getSpy = spyOn(el, "get").and.returnValue(""),
            setSpy = spyOn(el, "value").and.returnValue(el),
            months = DOM.mock("<table>"),
            target = DOM.mock("<a>");

        now.setMonth(now.getMonth() + 1);

        el._clickPicker(picker, months, target);
        expect(getSpy).toHaveBeenCalled();
        expect(setSpy).toHaveBeenCalledWith(formatDateISO(now));

        spyOn(target, "next").and.returnValue(el);

        now.setMonth(now.getMonth() - 2);

        el._clickPicker(picker, months, target);
        expect(getSpy).toHaveBeenCalled();
        expect(setSpy).toHaveBeenCalledWith(formatDateISO(now));
    });

    it("should display calendar on focus", function() {
        var spy = spyOn(picker, "show");

        el._focusPicker(picker);
        expect(spy.calls.count()).toBe(1);

        el._focusPicker(picker);
        expect(spy.calls.count()).toBe(2);

        el.set("readonly", true);
        el._focusPicker(picker);
        expect(spy.calls.count()).toBe(2);
    });

    // it("should restore initial value on form reset", function() {
    //     el.set("defaultValue", "2000-10-20");
    //     el.value("2000-10-2");

    //     el._resetForm();

    //     expect(el.value()).toBe("2000-10-20");
    // });

    describe("caption", () => {
        var pickerCaption;
        var calendarDaysMain;

        beforeEach(() => {
            pickerCaption = DOM.mock();
            calendarDaysMain = DOM.mock();
        });

        it("updates visible value format on click", () => {
            expect(picker.get("aria-expanded")).not.toBe("true");

            el._clickPickerCaption(picker);
            expect(picker.get("aria-expanded")).toBe("true");

            el._clickPickerCaption(picker);
            expect(picker.get("aria-expanded")).not.toBe("true");
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

    describe("data-polyfill", () => {
        it("skips when value is 'none'", () => {
            el.set("data-polyfill", "none");
            expect(el._isNative()).toBe(true);
        });

        it("forces polyfill if value is 'all'", () => {
            el.set("data-polyfill", "all");
            expect(el._isNative()).toBe(false);
            expect(el.get("type")).toBe("text");
        });

        it("supports desktop value", () => {
            el.set("data-polyfill", "desktop");
            expect(el._isNative()).toBe(false);
            expect(el.get("type")).toBe("text");
        });
    });
});
