/*!
 * better-dateinput-polyfill (https://github.com/chemerisuk/better-dateinput-polyfill)
 * input[type=date] polyfill for better-dom (https://github.com/chemerisuk/better-dom)
 *
 * Copyright (c) 2013 Maksim Chemerisuk
 */
DOM.extend("input[type=date]", {
    calendar: "div[hidden].%CLS%>p.%CLS%-header+a.%CLS%-prev+a.%CLS%-next+table.%CLS%-days>thead>tr>th[data-i18n=calendar.weekday.$]*7+tbody>tr*6>td*7".replace(/%CLS%/g, "better-dateinput-calendar")
}, {
    constructor: function(tpl) {
        var calendar = tpl.calendar;
 
        this
            // remove legacy dateinput if it exists and block user input
            .set({type: "text", readonly: true}) 
            // sync value on click
            .on("click", this._syncInputWithCalendar, [calendar])
            // handle arrow keys, esc etc.
            .on("keydown", ["keyCode", "altKey"], this._handleCalendarKeyDown, [calendar]);

        // prevent focusing after click if the input is inside of a label
        calendar.on("click td", {args: ["target"], cancel: true}, this._handleCalendarDayClick, [calendar], this);

        // stop bubbling to allow navigation via prev/next month buttons
        _.forOwn({prev: false, next: true}, function(param, key) {
            calendar.find(".better-dateinput-calendar-" + key)
                .on("click", {cancel: true, stop: true}, this._handleCalendarNavClick, [param], this);
        }, this);
        
        DOM.on("click", this._handleDocumentClick, [calendar], this);

        // cache access to some elements
        this._refreshCalendar = _.bind(this._refreshCalendar, this, 
            calendar.find(".better-dateinput-calendar-header"), calendar.findAll("td"));

        this.after(calendar);

        // show calendar for autofocused elements
        if (this.isFocused()) this.fire("focus");
    },
    getCalendarDate: function() {
        return this.getData("calendarDate");
    },
    setCalendarDate: function(value) {
        this._refreshCalendar(value);

        return this;
    },
    _handleCalendarDayClick: function(el, calendar) {
        var calendarDate = this.getCalendarDate(),
            currentYear = calendarDate.getFullYear(),
            currentMonth = calendarDate.getMonth(),
            targetDate = new Date(currentYear, currentMonth,
                el.parent().get("rowIndex") * 7 + el.get("cellIndex") - 5 - new Date(currentYear, currentMonth, 1).getDay()
            );

        this.setCalendarDate(targetDate)._syncCalendarWithInput(calendar);
    },
    _handleCalendarNavClick: function(next) {
        var calendarDate = this.getCalendarDate(),
            targetDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + (next ? 1 : -1), 1);

        this.setCalendarDate(targetDate).fire("focus");
    },
    _handleCalendarKeyDown: function(key, altKey, calendar) {
        var delta = 0,
            currentDate = this.getCalendarDate();

        if (key === 32) { // show/hide calendar on space key
            if (calendar.isHidden()) {
                this._syncInputWithCalendar(calendar);
            } else {
                this._syncCalendarWithInput(calendar);
            }
        } else if (key === 27 || key === 9) {
            calendar.hide(); // esc or tab key hides calendar
        } else if (key === 8 || key === 46) {
            this.set(""); // backspace or delete clears the value
        } else {
            if (key === 74 || key === 40) { delta = 7; }
            else if (key === 75 || key === 38) { delta = -7; }                            
            else if (key === 76 || key === 39) { delta = 1; }
            else if (key === 72 || key === 37) { delta = -1; }

            if (delta) {
                if (altKey) {
                    currentDate.setMonth(currentDate.getMonth() + (delta > 0 ? 1 : -1));
                } else {
                    currentDate.setDate(currentDate.getDate() + delta);
                }

                this.setCalendarDate(currentDate);
            }
        }
    },
    _syncInputWithCalendar: function(calendar) {
        var value = (this.get("value") || "").split("-");
        // switch calendar to the input value date
        this.setCalendarDate(value.length > 1 ? new Date( parseInt(value[0],10), parseInt(value[1],10) - 1, parseInt(value[2],10)) : new Date());

        calendar.show();
    },
    _syncCalendarWithInput: function(calendar) {
        var date = this.getCalendarDate(),
            zeroPadMonth = ("00" + (date.getMonth() + 1)).slice(-2),
            zeroPadDate = ("00" + date.getDate()).slice(-2);

        this.set(date.getFullYear() + "-" + zeroPadMonth + "-" + zeroPadDate);

        calendar.hide();
    },
    _refreshCalendar: function(calendarCaption, calendarDays, value) {
        var iterDate = new Date(value.getFullYear(), value.getMonth(), 0);
        // update caption
        calendarCaption.set("<span data-i18n='calendar.month." + value.getMonth() + "'> " + (isNaN(value.getFullYear()) ? "" : value.getFullYear()));
        
        if (!isNaN(iterDate.getTime())) {
            // move to begin of the start week
            iterDate.setDate(iterDate.getDate() - iterDate.getDay());
            
            calendarDays.each(function(day, index) {
                iterDate.setDate(iterDate.getDate() + 1);
                
                var mDiff = value.getMonth() - iterDate.getMonth(),
                    dDiff = value.getDate() - iterDate.getDate();

                if (value.getFullYear() !== iterDate.getFullYear()) {
                    mDiff *= -1;
                }

                day.set("className", mDiff ?
                    (mDiff > 0 ? "prev-calendar-day" : "next-calendar-day") :
                    (dDiff ? "calendar-day" : "current-calendar-day")
                );

                day.set(iterDate.getDate().toString());
            });

            // update current date
            this.setData("calendarDate", value);
        }
    },
    _handleDocumentClick: function(calendar) {
        if (!this.isFocused()) calendar.hide();
    },
});
