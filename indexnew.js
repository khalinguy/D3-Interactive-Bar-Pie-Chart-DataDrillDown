//Import data from JSON
d3.json("NewStudentUsersByWeek.json", function (data) {


    dashboard('#dashboard', data, '#pie');


    function segColor(c) {
        return {student: "#807dba", others: "#e08214"}[c];
    }

    function dashboard(id, Data, idOptions) {
        var barColor = 'steelblue';

        // compute total for each week.
        Data.forEach(function (d) {
            console.log(d.user)
            d.total = d.user.student + d.user.others;
        });

        // function to handle histogram.
        function histoGram(fD) {
            var hG = {}, hGDim = {t: 60, r: 0, b: 30, l: 100};
            hGDim.w = 500 - hGDim.l - hGDim.r,
                hGDim.h = 300 - hGDim.t - hGDim.b;

            //create svg for histogram.
            var hGsvg = d3.select(id).append("svg")
                .attr("width", hGDim.w + hGDim.l + hGDim.r)
                .attr("height", hGDim.h + hGDim.t + hGDim.b).append("g")
                .attr("transform", "translate(" + hGDim.l + "," + hGDim.t + ")");

            // create function for x-axis mapping.
            var x = d3.scale.ordinal().rangeRoundBands([0, hGDim.w], 0.45)
                .domain(fD.map(function (d) {
                    return d.date;
                }));


            // Add x-axis to the histogram svg.
            hGsvg.append("g").attr("class", "x axis")
                .attr("transform", "translate(0," + hGDim.h + ")")
                .call(d3.svg.axis().scale(x).orient("bottom"));


            // Create function for y-axis map.
            var y = d3.scale.linear().range([hGDim.h, 0])
                .domain([0, d3.max(fD, function (d) {
                    return d.total;
                })])

            // Add y-axis to histogram svg
            hGsvg.append("g").attr("class", "y axis")
                .call(d3.svg.axis().scale(y).orient("left"));

            // Create bars for histogram to contain rectangles and labels.
            var bars = hGsvg.selectAll("bar").data(fD).enter()
                .append("g").attr("class", "bar");

            //create the rectangles.
            bars.append("rect")
                .attr("x", function (d) {
                    return x(d.date);
                })
                .attr("y", function (d) {
                    return y(d.total);
                })
                .attr("width", x.rangeBand())
                .attr("height", function (d) {
                    return hGDim.h - y(d.total);
                })
                .attr('fill', barColor)
                .on("mouseover", mouseover)// mouseover is defined below.
                .on("mouseout", mouseout)// mouseout is defined below.
                .on("click", onclick); // onclick is defined below

            //Create the frequency labels above the rectangles.
            bars.append("text").text(function (d) {
                return d3.format(",")(d.total)
            })
                .attr("x", function (d) {
                    return x(d.date) + x.rangeBand() / 2;
                })
                .attr("y", function (d) {
                    return y(d.total) - 10;
                })
                .attr("text-anchor", "middle");


            function mouseover(d) {  // utility function to be called on mouseover.
                // filter for selected date.
                d3.select(this)
                    .transition()
                    .duration(100)
                    .attr("opacity", 0.9)
                    .attr("x", (d) => x(d.date) - 5)
                    .attr("y", (d) => y(d.total) - 5)
                    .attr("height", (d) =>  hGDim.h - y(d.total) + 10)
                    .attr("width", x.rangeBand() + 10)


            }

            function mouseout(d) {
                // utility function to be called on mouseout.
                d3.select(this)
                    .transition()
                    .duration(100)
                    .attr('opacity', 5)
                    .attr('height', (d) => hGDim.h - y(d.total))
                    .attr('width', x.rangeBand()  )
                    .attr("x", (d) => x(d.date) )
                    .attr("y", (d) => y(d.total) )

            }

            // Click function
            function onclick(d) {
                //Remove histogram
                d3.select( id + ' svg').remove()
                //new data for pie
                var st = Data.filter(function (s) {
                        return s.Date == d.date;
                    })[0],
                    nD = d3.keys(st.user).map(function (s) {
                        console.log(st.user[s])
                        return {type: s, user: st.user[s]};
                    });

                // Call corresponding pie chart and legend
                pieChart(nD, idOptions)
                legend(nD, idOptions)



            }


            // create function to update the bars. This will be used by pie-chart.
            hG.update = function (nD, color) {
                // update the domain of the y-axis map to reflect change in frequencies.
                y.domain([0, d3.max(nD, function (d) {
                    return d[1];
                })]);

                // Attach the new data to the bars.
                var bars = hGsvg.selectAll(".bar").data(nD);

                // transition the height and color of rectangles.
                bars.select("rect").transition().duration(500)
                    .attr("y", function (d) {
                        return y(d[1]);
                    })
                    .attr("height", function (d) {
                        return hGDim.h - y(d[1]);
                    })
                    .attr("fill", color);

                // transition the frequency labels location and change value.
                bars.select("text").transition().duration(500)
                    .text(function (d) {
                        return d3.format(",")(d[1])
                    })
                    .attr("y", function (d) {
                        return y(d[1]) - 5;
                    });
            }
            return hG;
        }


        // calculate each user type by time.
        var tF = ["student", "others"].map(function (d) {
            return {
                type: d, user: d3.sum(Data.map(function (t) {
                    return t.user[d];
                }))
            };
        });

        // calculate total user by for each week.
        var sF = Data.map(function (d) {
            return {
                date: d.Date,
                total: d.total
            }
        });

        var hG = histoGram(sF) // create the histogram.


    }

    // function to handle pieChart.
    function pieChart(pD, id) {

        var pC = {}, pieDim = {w: 300, h: 250};
        pieDim.r = Math.min(pieDim.w, pieDim.h) / 2;

        // create svg for pie chart.
        var piesvg = d3.select(id).append("svg")
            .attr("width", pieDim.w).attr("height", pieDim.h).append("g")
            .attr("transform", "translate(" + pieDim.w / 2 + "," + pieDim.h / 2 + ")");

        // create function to update pie-chart. This will be used by histogram.
        //pC.update = function (nD) {
            //piesvg.selectAll("path").data(pie(nD)).transition().duration(500)
                //.attrTween("d", arcTween);
        //}
        // create function to draw the arcs of the pie slices.
        var arc = d3.svg.arc().outerRadius(pieDim.r - 10).innerRadius(0);

        // create a function to compute the pie slice angles.
        var pie = d3.layout.pie().sort(null)
            //.startAngle(1.1*Math.PI)
            //.endAngle(3.1*Math.PI)
            .value(function (d) {
            return d.user;
        })

        //Draw arc

        piesvg.selectAll('.arc').data(pie(pD)).enter().append("g").attr('class','arc');

        // Draw the pie slices.
        piesvg.selectAll("path").data(pie(pD)).enter().append("path").attr("d", arc)
            .each(function (d) {
                this._current = d;
            })
            .style("fill", function (d) {
                return segColor(d.data.type);
            })
            // .transition()
            // .delay(function(d,i) {
            //     return i * 500
            // })
            // .duration(700)
            // .attrTween('d', function(d) {
            //     var i = d3.interpolate(d.startAngle + 0.1, d.endAngle);
            //     return function(t) {
            //         d.endAngle = i(t);
            //         return arc(d)
            //     }
            // })
            .on("click", onclick);
            //.on("mouseover", mouseover).on("mouseout", mouseout);
        //

        // Click function

        function onclick(){
            d3.select( id + ' svg').remove()
            d3.select ( id + ' table').remove()
            dashboard('#dashboard',data, id)

        }
        // Utility function to be called on mouseover a pie slice.
        function mouseover(d) {


            // call the update function of histogram with new data.

            //hG.update(Data.map(function (v) {
                //return [v.Date, v.user[d.data.type]];
            //}), segColor(d.data.type));
        }

        //Utility function to be called on mouseout a pie slice.
        //function mouseout(d) {
            // call the update function of histogram with all data.
            //hG.update(Data.map(function (v) {
                //return [v.Date, v.total];
            //}), barColor);
        //}


        // Animating the pie-slice requiring a custom function which specifies
        // how the intermediate paths should be drawn.
        function arcTween(a) {
            var i = d3.interpolate(this._current, a);
            this._current = i(0);
            return function (t) {
                return arc(i(t));
            };
        }

        return pC;
    }

    // function to handle legend.
    function legend(lD, id) {
        var leg = {};

        // create table for legend.
        var legend = d3.select(id).append("table").attr('class', 'legend');

        // create one row per segment.
        var tr = legend.append("tbody").selectAll("tr").data(lD).enter().append("tr");

        // create the first column for each segment.
        tr.append("td").append("svg").attr("width", '16').attr("height", '16').append("rect")
            .attr("width", '16').attr("height", '16')
            .attr("fill", function (d) {
                return segColor(d.type);
            });

        // create the second column for each segment.
        tr.append("td").text(function (d) {
            return d.type;
        });

        // create the third column for each segment.
        tr.append("td").attr("class",'legendFreq')
        .text(function(d){ return d3.format(",")(d.user);});

        // create the fourth column for each segment.
        tr.append("td").attr("class", 'legendPerc')
            .text(function (d) {
                return getLegend(d, lD);
            });

        // Utility function to be used to update the legend.
        leg.update = function (nD) {
            // update the data attached to the row elements.
            var l = legend.select("tbody").selectAll("tr").data(nD);

            // update the value.
            l.select(".legendFreq").text(function (d) {
                return d3.format(",")(d.user);
            });


            // update the percentage column.
            l.select(".legendPerc").text(function (d) {
                return getLegend(d, nD);
            });
        }

        function getLegend(d, aD) { // Utility function to compute percentage.
            return d3.format("%")(d.user / d3.sum(aD.map(function (v) {
                return v.user;
            })));
        }

        return leg;

    }

})