describe("better-dateinput-polyfill", function() {
    var dateinput;

    beforeEach(function() {
        dateinput = DOM.mock("input[type=date]");

        spyOn(dateinput, "_refreshCalendar");
        spyOn(dateinput, "getCalendarDate").andReturn(new Date());
    });

    it("should toggle calendar visibility on enter key", function() {
        spyOn(dateinput, "get").andReturn("");

        var calendar = DOM.mock(),
            showSpy = spyOn(calendar, "show"),
            hideSpy = spyOn(calendar, "hide"),
            visibilitySpy = spyOn(calendar, "isHidden");


        visibilitySpy.andReturn(true);

        dateinput._handleDateInputKeys(13, false, calendar);

        expect(visibilitySpy).toHaveBeenCalled();
        expect(showSpy).toHaveBeenCalled();


        visibilitySpy.andReturn(false);

        dateinput._handleDateInputKeys(13, false, calendar);

        expect(visibilitySpy).toHaveBeenCalled();
        expect(hideSpy).toHaveBeenCalled();
    });

    it("should hide calendar on escape or tab key", function() {
        var calendar = DOM.mock(),
            spy = spyOn(calendar, "hide");

        dateinput._handleDateInputKeys(9, false, calendar);

        expect(spy).toHaveBeenCalled();

        dateinput._handleDateInputKeys(27, false, calendar);

        expect(spy.callCount).toBe(2);
    });

    it("should reset calendar value on backspace or delete keys", function() {
        var calendar = DOM.mock(),
            spy = spyOn(dateinput, "set");

        spy.andCallFake(function(value) {
            expect(value).toBe("");
        });

        dateinput._handleDateInputKeys(8, false, calendar);

        expect(spy).toHaveBeenCalled();

        dateinput._handleDateInputKeys(46, false, calendar);

        expect(spy.callCount).toBe(2);
    });

});
