describe("better-dateinput-polyfill", function() {
    var calendar, dateinput, calendarCaption, calendarDays,
        DOM = window.DOM;

    beforeEach(function() {
        calendar = DOM.mock();
        calendarCaption = DOM.mock();
        calendarDays = DOM.mock();
        dateinput = DOM.mock("input[type=date]");

        spyOn(dateinput, "getData").andCallFake(function(key) {
            if (key === "calendar") return calendar;
            else if (key === "calendarCaption") return calendarCaption;
            else if (key === "calendarDays") return calendarDays;
        });
    });

    it("should toggle calendar visibility on enter key", function() {
        spyOn(dateinput, "getCalendarDate").andReturn(new Date());
        spyOn(dateinput, "get").andReturn("");

        var toggleSpy = spyOn(calendar, "toggle");

        dateinput.handleCalendarKeyDown(13, false);
        expect(toggleSpy).toHaveBeenCalled();
    });

    it("should hide calendar on escape key", function() {
        var spy = spyOn(calendar, "hide");

        dateinput.handleCalendarKeyDown(27, false);
        expect(spy).toHaveBeenCalled();
    });

    it("should prevent default action on any key except tab", function() {
        expect(dateinput.handleCalendarKeyDown(9, false)).not.toBe(false);
        expect(dateinput.handleCalendarKeyDown(111, false)).toBe(false);
        expect(dateinput.handleCalendarKeyDown(13, false)).toBe(false);
    });

    it("should reset calendar value on backspace or delete keys", function() {
        var spy = spyOn(dateinput, "set");

        spy.andCallFake(function(value) {
            expect(value).toBe("");

            return dateinput;
        });

        dateinput.handleCalendarKeyDown(8, false);
        expect(spy).toHaveBeenCalled();
        dateinput.handleCalendarKeyDown(46, false);
        expect(spy.callCount).toBe(2);
    });

    it("should handle arrow keys with optional shiftKey", function() {
        var now = new Date(),
            nowCopy = new Date(now.getTime()),
            getSpy = spyOn(dateinput, "getCalendarDate"),
            setSpy = spyOn(dateinput, "setCalendarDate").andReturn(dateinput),
            expectKey = function(key, altKey, expected) {
                getSpy.andReturn(new Date(now.getTime()));

                dateinput.handleCalendarKeyDown(key, altKey);
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
            spy = spyOn(calendar, "hasClass"),
            getSpy = spyOn(dateinput, "getCalendarDate").andReturn(now),
            setSpy = spyOn(dateinput, "setCalendarDate").andReturn(dateinput);

        spy.andReturn(true);
        dateinput.handleCalendarNavClick(calendar);
        expect(spy).toHaveBeenCalled();
        expect(getSpy).toHaveBeenCalled();
        expect(setSpy).toHaveBeenCalledWith(new Date(now.getFullYear(), now.getMonth() + 1, 1));

        spy.andReturn(false);
        dateinput.handleCalendarNavClick(calendar);
        expect(spy).toHaveBeenCalled();
        expect(getSpy).toHaveBeenCalled();
        expect(setSpy).toHaveBeenCalledWith(new Date(now.getFullYear(), now.getMonth() - 1, 1));
    });

    it("should select appropriate day on calendar click", function() {
        var now = new Date(),
            target = DOM.mock(),
            parent = DOM.mock(),
            colSpy = spyOn(target, "get"),
            rowSpy = spyOn(parent, "get"),
            getSpy = spyOn(dateinput, "getCalendarDate"),
            setSpy = spyOn(dateinput, "setCalendarDate");

        spyOn(target, "parent").andReturn(parent);

        rowSpy.andReturn(2); // the third week of current month
        colSpy.andReturn(5); // the 5th day of the week
        getSpy.andReturn(now);
        dateinput.handleCalendarDayClick(target);
        expect(rowSpy).toHaveBeenCalled();
        expect(colSpy).toHaveBeenCalled();
        expect(getSpy).toHaveBeenCalled();

        now.setDate(1);

        expect(setSpy).toHaveBeenCalledWith(new Date(
            now.getFullYear(), now.getMonth(), (2 - 1) * 7 + (5 + 2) - now.getDay()));
    });

    it("should hide calendar on outer focus", function() {
        var focusedSpy = spyOn(dateinput, "isFocused"),
            hideSpy = spyOn(calendar, "hide");

        focusedSpy.andReturn(true);
        dateinput.handleDocumentClick();
        expect(hideSpy).not.toHaveBeenCalled();

        focusedSpy.andReturn(false);
        dateinput.handleDocumentClick();
        expect(hideSpy).toHaveBeenCalled();
    });

});
