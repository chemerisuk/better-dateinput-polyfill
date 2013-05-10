/*!
 * better-dateinput-polyfill (https://github.com/chemerisuk/better-dateinput-polyfill)
 * input[type=date] polyfill for better-dom (https://github.com/chemerisuk/better-dom)
 *
 * Copyright (c) 2013 Maksim Chemerisuk
 */
DOM.extend("input[type=date]", {
    template: {
        after: (function() {
            var content = "<p class='better-dateinput-calendar-header'></p><a class='better-dateinput-calendar-prev'></a><a class='better-dateinput-calendar-next'></a><div class='better-dateinput-calendar-days'>";

            for (var i = 0; i < 7; ++i) {
                content += "<ol class='better-dateinput-calendar-row'>";

                for (var j = 0; j < 7; ++j) {
                    content += (i ? "<li data-index='" + (j + 7 * (i - 1)) : "</li><li data-i18n='calendar.weekday." + j) + "'></li>"; 
                }

                content += "</ol>";
            }

            return "<div class='better-dateinput-calendar' hidden>" + content + "</div>";
        })()
    },
    constructor: function() {
        var input = this,
            calendar = input.next();

        input
            .set("type", "text") // remove legacy dateinput if it exists
            .on({
                input: function() {
                    if (input.get("value")) input._syncDate();
                },
                click: function() {
                    input._syncDate();

                    calendar.show();
                },
                keydown: function(e) {
                    var key = e.get("keyCode"),
                        delta = 0,
                        currentDate = this.getDate();

                    if (key === 27 || key === 9 || key === 13) {
                        calendar.hide(); // enter, esc or tab key exits
                    } else if (key === 8 || key === 46) {
                        this.set(""); // backspace or delete clears the value
                    } else {
                        if (key === 74 || key === 40) { delta = 7; }
                        else if (key === 75 || key === 38) { delta = -7; }                            
                        else if (key === 76 || key === 39) { delta = 1; }
                        else if (key === 72 || key === 37) { delta = -1; }

                        if (delta) {
                            if (e.get("altKey")) {
                                currentDate.setMonth(currentDate.getMonth() + (delta > 0 ? 1 : -1));
                            } else {
                                currentDate.setDate(currentDate.getDate() + delta);
                            }

                            this.setDate(currentDate);
                        }
                    }

                    e.preventDefault();
                }
            });

        calendar.on({
            click: function(e) {
                var target = e.target,
                    calendarDate = input.getData("calendarDate"),
                    currentYear = calendarDate.getFullYear(),
                    currentMonth = calendarDate.getMonth(),
                    currentDate = calendarDate.getDate(),
                    targetDate;

                if (target.get("data-index")) {
                    input.setDate(new Date(currentYear, currentMonth,
                        parseInt(target.getData("index"), 10) + 3 -
                            new Date(currentYear, currentMonth, 1).getDay()));

                    calendar.hide();
                } else if (target.hasClass("better-dateinput-calendar-prev")) {
                    input.setDate(new Date(currentYear, currentMonth - 1, 1));
                } else if (target.hasClass("better-dateinput-calendar-next")) {
                    input.setDate(new Date(currentYear, currentMonth + 1, 1));
                }

                e.preventDefault();
                e.stopPropagation();
            }
        });

        DOM.on("click", function() {
            if (!input.isFocused()) {
                calendar.hide();    
            }
        });

        var container = calendar.find(".better-dateinput-calendar-days"),
            containerCaption = calendar.find(".better-dateinput-calendar-header"),
            containerDays = calendar.findAll("[data-index]");

        this.setDate = function(value) {
            var iterDate = new Date(value.getFullYear(), value.getMonth(), 0);
            // update caption
            containerCaption.set("<span data-i18n='calendar.month." + value.getMonth() + "'> " + (isNaN(value.getFullYear()) ? "" : value.getFullYear()));
            
            if (!isNaN(iterDate.getTime())) {
                // move to begin of the start week
                iterDate.setDate(iterDate.getDate() - iterDate.getDay());
                
                containerDays.each(function(day, index) {
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
                input.setData("calendarDate", value);
            }

            input.set("value", JSON.parse(JSON.stringify(value)).split("T")[0]);
        };

        // show calendar for autofocused elements
        if (this.isFocused()) {
            this.fire("focus");
        }
    },
    getDate: function() {
        return this.getData("calendarDate");
    },
    _syncDate: function() {
        var value = (this.get("value") || "").split("-");
        // switch calendar to appropriate date
        this.setDate(value.length > 1 ? new Date( parseInt(value[0],10), parseInt(value[1],10) - 1, parseInt(value[2],10)) : new Date());
    }
});
