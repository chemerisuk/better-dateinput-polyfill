describe("better-dateinput-polyfill", function() {
    var calendar, dateinput;

    beforeEach(function() {
        calendar = DOM.mock();
        dateinput = DOM.mock("input[type=date]");

        spyOn(dateinput, "_refreshCalendar");
    });

    it("should toggle calendar visibility on enter key", function() {
        spyOn(dateinput, "getCalendarDate").andReturn(new Date());
        spyOn(dateinput, "get").andReturn("");

        var toggleSpy = spyOn(calendar, "toggle");

        dateinput._handleCalendarKeyDown(13, false, calendar);
        expect(toggleSpy).toHaveBeenCalled();
    });

    it("should hide calendar on escape key", function() {
        var spy = spyOn(calendar, "hide");

        dateinput._handleCalendarKeyDown(27, false, calendar);
        expect(spy).toHaveBeenCalled();
    });

    it("should prevent default action on any key except tab", function() {
        expect(dateinput._handleCalendarKeyDown(9, false, calendar)).not.toBe(false);
        expect(dateinput._handleCalendarKeyDown(111, false, calendar)).toBe(false);
        expect(dateinput._handleCalendarKeyDown(141, false, calendar)).toBe(false);
    });

    it("should reset calendar value on backspace or delete keys", function() {
        var spy = spyOn(dateinput, "set");

        spy.andCallFake(function(value) {
            expect(value).toBe("");
        });

        dateinput._handleCalendarKeyDown(8, false, calendar);
        expect(spy).toHaveBeenCalled();
        dateinput._handleCalendarKeyDown(46, false, calendar);
        expect(spy.callCount).toBe(2);
    });

    it("should handle arrow keys", function() {
        var now = new Date(),
            getSpy = spyOn(dateinput, "getCalendarDate"),
            setSpy = spyOn(dateinput, "setCalendarDate").andReturn(dateinput),
            expectKey = function(key, altKey, expected) {
                getSpy.andReturn(new Date(now.getTime()));

                dateinput._handleCalendarKeyDown(key, altKey, calendar);
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
    });

});
