/*!
 * better-dateinput-polyfill (https://github.com/chemerisuk/better-dateinput-polyfill)
 * input[type=date] polyfill for better-dom (https://github.com/chemerisuk/better-dom)
 *
 * Copyright (c) 2013 Maksim Chemerisuk
 */
DOM.extend("input[type=date]", [
    "div[hidden].%CLS%>p.%CLS%-header+a.%CLS%-prev+a.%CLS%-next+table.%CLS%-days>thead>tr>th[data-i18n=calendar.weekday.$]*7+tbody>tr*6>td*7".replace(/%CLS%/g, "better-dateinput-calendar")
], {
    constructor: (function(){
        var notTabKey = function(keyCode) { return keyCode !== 9; };

        return function(calendar) {
            this
                // remove legacy dateinput if it exists
                .set("type", "text") 
                // sync value on click
                .on("click", this._syncInputWithCalendar, [calendar])
                // handle arrow keys, esc etc.
                // MUST stop propagation because of IE8
                .on("keydown", {args: ["keyCode", "altKey"], cancel: notTabKey, stop: true}, this._handleCalendarKeyDown, [calendar]);

            // prevent focusing after click if the input is inside of a label
            calendar.on("click td", {args: ["target"], cancel: true}, this._handleCalendarDayClick, [calendar], this);

            // stop bubbling to allow navigation via prev/next month buttons
            calendar.findAll("a").on("click", {cancel: true, stop: true, args: ["target"]}, this._handleCalendarNavClick, this);
                    
            // hide calendar when a user clicks somewhere outside
            DOM.on("click", this._handleDocumentClick, [calendar], this);

            // cache access to some elements
            this.bind("_refreshCalendar", 
                calendar.find(".better-dateinput-calendar-header"), 
                calendar.findAll("td")
            );                                                                               

            this.after(calendar);

            // show calendar for autofocused elements
            if (this.isFocused()) this.fire("focus");
        }
    })(),
    getCalendarDate: function() {
        return this.getData("calendarDate");
    },
    setCalendarDate: function(value) {
        this._refreshCalendar(value);

        return this;
    },
    _handleCalendarDayClick: function(target, calendar) {
        var calendarDate = this.getCalendarDate(),
            currentYear = calendarDate.getFullYear(),
            currentMonth = calendarDate.getMonth(),
            targetDate = new Date(currentYear, currentMonth,
                target.parent().get("rowIndex") * 7 + target.get("cellIndex") - 5 - new Date(currentYear, currentMonth, 1).getDay()
            );

        this.setCalendarDate(targetDate);
        this._syncCalendarWithInput(calendar);
    },
    _handleCalendarNavClick: function(target) {
        var isNext = target.hasClass("better-dateinput-calendar-next"),
            calendarDate = this.getCalendarDate(),
            targetDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + (isNext ? 1 : -1), 1);

        this.setCalendarDate(targetDate).fire("focus");
    },
    _handleCalendarKeyDown: function(key, altKey, calendar) {
        var delta = 0,
            currentDate = this.getCalendarDate();

        if (key === 13) { 
            calendar.toggle(); // show/hide calendar on enter key
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

                this.setCalendarDate(currentDate)._syncCalendarWithInput(calendar, true);
            }
        }
    },
    _syncInputWithCalendar: function(calendar, skipCalendar) {
        var value = (this.get("value") || "").split("-");
        // switch calendar to the input value date
        this.setCalendarDate(value.length > 1 ? new Date( parseInt(value[0],10), parseInt(value[1],10) - 1, parseInt(value[2],10)) : new Date());

        if (!skipCalendar) calendar.show();
    },
    _syncCalendarWithInput: function(calendar, skipCalendar) {
        var date = this.getCalendarDate(),
            zeroPadMonth = ("00" + (date.getMonth() + 1)).slice(-2),
            zeroPadDate = ("00" + date.getDate()).slice(-2);

        this.set(date.getFullYear() + "-" + zeroPadMonth + "-" + zeroPadDate);

        if (!skipCalendar) calendar.hide();
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

// I18N

DOM.importStrings({
    // days of week
    "calendar.weekday.1": "Mon",
    "calendar.weekday.2": "Tue",
    "calendar.weekday.3": "Wed",
    "calendar.weekday.4": "Thu",
    "calendar.weekday.5": "Fri",
    "calendar.weekday.6": "Sat",
    "calendar.weekday.7": "Sun",
    // monthes
    "calendar.month.0": "January",
    "calendar.month.1": "February",
    "calendar.month.2": "March",
    "calendar.month.3": "April",
    "calendar.month.4": "May",
    "calendar.month.5": "June",
    "calendar.month.6": "July",
    "calendar.month.7": "August",
    "calendar.month.8": "September",
    "calendar.month.9": "October",
    "calendar.month.10": "November",
    "calendar.month.11": "December", 
});

// ru language

DOM.importStrings({
    // days of week
    "calendar.weekday.1": "Пн",
    "calendar.weekday.2": "Вт",
    "calendar.weekday.3": "Ср",
    "calendar.weekday.4": "Чт",
    "calendar.weekday.5": "Пт",
    "calendar.weekday.6": "Сб",
    "calendar.weekday.7": "Вс",
    // monthes
    "calendar.month.0": "Январь",
    "calendar.month.1": "Февраль",
    "calendar.month.2": "Март",
    "calendar.month.3": "Апрель",
    "calendar.month.4": "Май",
    "calendar.month.5": "Июнь",
    "calendar.month.6": "Июль",
    "calendar.month.7": "Август",
    "calendar.month.8": "Сентябрь",
    "calendar.month.9": "Октябрь",
    "calendar.month.10": "Ноябрь",
    "calendar.month.11": "Декабрь", 
}, "ru");
