describe("better-dateinput-polyfill", function() {
    // function formatDateISO(value) {
    //     return value.toISOString().split("T")[0];
    // }

    var el, picker, months, caption, label;

    beforeEach(function() {
        el = DOM.mock("<input type='date'>");
        picker = DOM.mock("<div>");
        months = DOM.mock();
        caption = DOM.mock();
        label = DOM.mock("<span>");
    });

    describe("keyboard", () => {
        var toggleState;

        beforeEach(() => {
            toggleState = jasmine.createSpy();
        });

        describe("SPACE", () => {
            it("hides visible picker", () => {
                var showSpy = spyOn(picker, "show");
                var hideSpy = spyOn(picker, "hide");

                el._keydownPicker(picker, toggleState, 32);
                expect(hideSpy).toHaveBeenCalled();
                expect(showSpy).not.toHaveBeenCalled();
            });

            it("shows hidden picker", () => {
                var showSpy = spyOn(picker, "show");
                var hideSpy = spyOn(picker, "hide");

                picker.set("aria-hidden", "true");
                el._keydownPicker(picker, toggleState, 32);
                expect(showSpy).toHaveBeenCalled();
                expect(hideSpy).not.toHaveBeenCalled();
            });

            it("does nothing for readonly input", () => {
                var showSpy = spyOn(picker, "show");
                var hideSpy = spyOn(picker, "hide");

                el.set("readonly", true);
                el._keydownPicker(picker, toggleState, 32);
                expect(hideSpy).not.toHaveBeenCalled();
                expect(showSpy).not.toHaveBeenCalled();
            });
        });

        describe("ESC", () => {
            it("hides calendar", function() {
                var spy = spyOn(picker, "hide");
                expect(el._keydownPicker(picker, toggleState, 27)).toBe(false);
                expect(spy).toHaveBeenCalled();
            });
        });

        describe("TAB", () => {
            it("performs default behavior", function() {
                expect(el._keydownPicker(picker, toggleState, 9)).toBe(true);
            });
        });

        describe("BACKSPACE or DELETE", () => {
            it("reset calendar value", function() {
                var spy = spyOn(el, "value").and.returnValue(el);

                el._keydownPicker(picker, toggleState, 8);
                expect(spy).toHaveBeenCalledWith("");

                spy.calls.reset();

                el._keydownPicker(picker, toggleState, 46);
                expect(spy).toHaveBeenCalledWith("");
            });
        });

        describe("CONTROL", () => {
            it("toggles calendar mode", function() {
                el._keydownPicker(picker, toggleState, 17);
                expect(toggleState).toHaveBeenCalled();
            });
        });

        describe("ARROW keys", () => {
            it("navigate calendar day", function() {
                function expectKey(key, expected) {
                    el._keydownPicker(picker, toggleState, key);
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
        });
    });

    // it("changes month/year", function() {
    //     var target = DOM.mock("<a>");

    //     el.value("2000-01-01");
    //     el._clickPicker(picker, months, target);
    //     expect(el.value()).toBe("2000-02-01");

    //     picker.set("expanded", "true");
    //     el._clickPicker(picker, months, target);
    //     expect(el.value()).toBe("2001-02-01");

    //     spyOn(target, "next").and.returnValue(el);

    //     el.value("2000-01-01");
    //     el._clickPicker(picker, months, target);
    //     expect(el.value()).toBe("1999-01-01");

    //     picker.set("expanded", "true");
    //     el._clickPicker(picker, months, target);
    //     expect(el.value()).toBe("1998-01-01");

    //     el.value("1970-01-01");
    //     el._clickPicker(picker, months, target);
    //     expect(el.value()).toBe("1969-01-01");
    // });

    // it("changes month in month picker mode", function() {
    //     var target = DOM.mock("<time>");

    //     spyOn(months, "contains").and.returnValue(true);

    //     el.value("2000-01-01");

    //     target.set("datetime", "2000-06-09");
    //     el._clickPicker(picker, months, target);
    //     expect(el.value()).toBe("2000-06-01");

    //     target.set("datetime", "2000-10-09");
    //     el._clickPicker(picker, months, target);
    //     expect(el.value()).toBe("2000-10-01");

    //     el.value("1970-09-01");
    //     target.set("datetime", "1970-01-01");
    //     el._clickPicker(picker, months, target);
    //     expect(el.value()).toBe("1970-01-01");
    // });

    // it("should select appropriate day on calendar click", function() {
    //     var now = new Date(2011, 6, 13, 12);
    //     var target = DOM.mock();

    //     spyOn(target, "matches").and.callFake((tagName) => {
    //         return tagName === "td";
    //     });

    //     el.value("2000-01-01");
    //     el._clickPicker(picker, months, target);
    //     expect(el.value()).toBe("2000-01-01");

    //     spyOn(target, "data").and.returnValue(now.getTime());
    //     el._clickPicker(picker, months, target);
    //     expect(el.value()).toBe("2011-07-13");

    //     // 0 is for unix time 1970-01-01
    //     el.value("2013-01-01");
    //     target.data = () => { return 0; };
    //     el._clickPicker(picker, months, target);
    //     expect(el.value()).toBe("1970-01-01");
    // });

    it("should hide calendar on blur", function() {
        var hideSpy = spyOn(picker, "hide");

        el._blurPicker(picker);
        expect(hideSpy).toHaveBeenCalled();
    });

    // it("should use current date for calendar if value is empty", function() {
    //     var now = new Date(),
    //         getSpy = spyOn(el, "get").and.returnValue(""),
    //         setSpy = spyOn(el, "value").and.returnValue(el),
    //         months = DOM.mock("<table>"),
    //         target = DOM.mock("<a>");

    //     now.setMonth(now.getMonth() + 1);

    //     el._clickPicker(picker, months, target);
    //     expect(getSpy).toHaveBeenCalled();
    //     expect(setSpy).toHaveBeenCalledWith(formatDateISO(now));

    //     spyOn(target, "next").and.returnValue(el);

    //     now.setMonth(now.getMonth() - 2);

    //     el._clickPicker(picker, months, target);
    //     expect(getSpy).toHaveBeenCalled();
    //     expect(setSpy).toHaveBeenCalledWith(formatDateISO(now));
    // });

    it("should display calendar on focus", function() {
        var spy = spyOn(picker, "show");
        var toggleState = jasmine.createSpy();

        el._focusPicker(picker, toggleState);
        expect(spy.calls.count()).toBe(1);
        el._focusPicker(picker, toggleState);
        expect(spy.calls.count()).toBe(2);

        el.set("readonly", true);
        el._focusPicker(picker, toggleState);
        expect(spy.calls.count()).toBe(2);
    });

    // it("should restore initial value on form reset", function() {
    //     el.set("defaultValue", "2000-10-20");
    //     el.value("2000-10-2");

    //     el._resetForm();

    //     expect(el.value()).toBe("2000-10-20");
    // });

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
