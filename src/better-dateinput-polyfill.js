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
                focus: function() {
                    input._syncDate();

                    calendar.show();
                }/*,
                blur: function() {
                    calendar.hide();
                }*/
            });

        calendar.on({
            // mousedown: function(e) {
            //     e.preventDefault();
            //     e.stopPropagation();
            // },
            click: function(e) {
                var target = e.target,
                    selectedDate = input.getData("selectedDate"),
                    currentYear = selectedDate.getFullYear(),
                    currentMonth = selectedDate.getMonth(),
                    currentDate = selectedDate.getDate(),
                    targetDate;

                if (target.get("data-index")) {
                    targetDate = new Date(currentYear, currentMonth,
                        parseInt(target.getData("index"), 10) + 3 -
                            new Date(currentYear, currentMonth, 1).getDay());

                    if (targetDate.getFullYear() !== currentYear ||
                        targetDate.getMonth() !== currentMonth ||
                        targetDate.getDate() !== currentDate) {
                        // update input value and trigger blur manually to hide calendar control
                        
                        input.set("value", JSON.parse(JSON.stringify(targetDate)).split("T")[0]);
                    }
                } else if (target.hasClass("better-dateinput-calendar-prev")) {
                    input.setDate(new Date(currentYear, currentMonth - 1, 1));
                } else if (target.hasClass("better-dateinput-calendar-next")) {
                    input.setDate(new Date(currentYear, currentMonth + 1, 1));
                }

                e.preventDefault();
            }
        });

        var container = calendar.find(".better-dateinput-calendar-days"),
            containerCaption = calendar.find(".better-dateinput-calendar-header"),
            containerDays = calendar.findAll("[data-index]");

        this.setDate = function(date) {
            var iterDate = new Date(date.getFullYear(), date.getMonth(), 0);
            // update caption
            containerCaption.set("<span data-i18n='calendar.month." + date.getMonth() + "'> " + (isNaN(date.getFullYear()) ? "" : date.getFullYear()));
            
            if (!isNaN(iterDate.getTime())) {
                // move to begin of the start week
                iterDate.setDate(iterDate.getDate() - iterDate.getDay());
                
                containerDays.each(function(day, index) {
                    iterDate.setDate(iterDate.getDate() + 1);
                    
                    var mDiff = date.getMonth() - iterDate.getMonth(),
                        dDiff = date.getDate() - iterDate.getDate();

                    if (date.getFullYear() !== iterDate.getFullYear()) {
                        mDiff *= -1;
                    }

                    day.set("className", mDiff ?
                        (mDiff > 0 ? "prev-calendar-day" : "next-calendar-day") :
                        (dDiff ? "calendar-day" : "current-calendar-day")
                    );

                    day.set(iterDate.getDate().toString());
                });
                // update current date
                input.setData("selectedDate", date);
            }
        };

        // show calendar for autofocused elements
        if (this.isFocused()) {
            this.fire("focus");
        }
    },
    getDate: function() {
        return this.getData("selectedDate");
    },
    _syncDate: function() {
        var value = this.get("value").split("-");
        // switch calendar to appropriate date
        this.setDate(value.length > 1 ? new Date( parseInt(value[0],10), parseInt(value[1],10), parseInt(value[2],10) ) : new Date());
    }
});
