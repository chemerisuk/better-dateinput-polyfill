describe("better-dateinput-polyfill", function() {
    var calendar, dateinput;

    beforeEach(function() {
        calendar = DOM.mock("table");
        dateinput = DOM.mock("input[type=date]");

        spyOn(dateinput, "data").andCallFake(function(key) {
            if (key === "date-picker") return calendar;
            else if (key === "date-input") return DOM.mock();
        });
    });

    it("should toggle calendar visibility on space key", function() {
        spyOn(dateinput, "get").andReturn("");

        var toggleSpy = spyOn(calendar, "toggle");

        dateinput.onCalendarKeyDown(32, false);
        expect(toggleSpy).toHaveBeenCalled();
    });

    it("should hide calendar on escape key", function() {
        var spy = spyOn(calendar, "hide");

        dateinput.onCalendarKeyDown(27, false);
        expect(spy).toHaveBeenCalled();
    });

    it("should prevent default action on any key except tab", function() {
        expect(dateinput.onCalendarKeyDown(9, false)).not.toBe(false);
        expect(dateinput.onCalendarKeyDown(111, false)).toBe(false);
        expect(dateinput.onCalendarKeyDown(13, false)).toBe(true);
    });

    it("should reset calendar value on backspace or delete keys", function() {
        var spy = spyOn(dateinput, "set");

        spy.andCallFake(function(value) {
            expect(value).toBe("");

            return dateinput;
        });

        dateinput.onCalendarKeyDown(8, false);
        expect(spy).toHaveBeenCalled();
        dateinput.onCalendarKeyDown(46, false);
        expect(spy.callCount).toBe(2);
    });

    it("should handle arrow keys with optional shiftKey", function() {
        var now = new Date(),
            nowCopy = new Date(now.getTime()),
            getSpy = spyOn(dateinput, "getCalendarDate"),
            setSpy = spyOn(dateinput, "setCalendarDate").andReturn(dateinput),
            expectKey = function(key, altKey, expected) {
                getSpy.andReturn(new Date(now.getTime()));

                dateinput.onCalendarKeyDown(key, altKey);
                expect(setSpy).toHaveBeenCalledWith(expected);
            };

        expectKey(74, false, new Date(now.getTime() + 604800000));
        expectKey(40, false, new Date(now.getTime() + 604800000));
        expectKey(75, false, new Date(now.getTime() - 604800000));
        expectKey(38, false, new Date(now.getTime() - 604800000));
        expectKey(76, false, new Date(now.getTime() + 86400000));
        expectKey(39, false, new Date(now.getTime() + 86400000));
        expectKey(72, false, new Date(now.getTime() - 86400000));
        expectKey(37, false, new Date(now.getTime() - 86400000));

        // cases with shift key
        nowCopy.setMonth(nowCopy.getMonth() + 1);
        expectKey(39, true, nowCopy);
        nowCopy.setMonth(nowCopy.getMonth() - 2);
        expectKey(37, true, nowCopy);
        nowCopy.setMonth(nowCopy.getMonth() + 1);
        nowCopy.setFullYear(nowCopy.getFullYear() + 1);
        expectKey(40, true, nowCopy);
        nowCopy.setFullYear(nowCopy.getFullYear() - 2);
        expectKey(38, true, nowCopy);
    });

    it("should change month on nav buttons click", function() {
        var now = new Date(),
            getSpy = spyOn(dateinput, "getCalendarDate").andReturn(now),
            setSpy = spyOn(dateinput, "setCalendarDate").andReturn(dateinput),
            target = DOM.mock("a");

        dateinput.onCalendarClick(target);
        expect(getSpy).toHaveBeenCalled();
        expect(setSpy).toHaveBeenCalledWith(new Date(now.getFullYear(), now.getMonth() + 1, 1));

        spyOn(target, "next").andReturn(dateinput);

        dateinput.onCalendarClick(target);
        expect(getSpy).toHaveBeenCalled();
        expect(setSpy).toHaveBeenCalledWith(new Date(now.getFullYear(), now.getMonth() - 1, 1));
    });

    it("should select appropriate day on calendar click", function() {
        var now = new Date(),
            target = DOM.mock("td").data("ts", now.getTime()),
            setSpy = spyOn(dateinput, "setCalendarDate");

        dateinput.onCalendarClick(target);
        expect(setSpy).toHaveBeenCalledWith(new Date(now.getTime()));
    });

    it("should hide calendar on blur", function() {
        var hideSpy = spyOn(calendar, "hide");

        dateinput.onCalendarBlur();
        expect(hideSpy).toHaveBeenCalled();
    });

});
