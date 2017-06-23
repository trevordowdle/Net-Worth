"use strict";

var userDatabase,
    userData = {}; // get user database


var utility = function (profile) {

    // Initialize Firebase
    var config = {
        apiKey: "AIzaSyC7eDuSl0CfhDQ95wEXhaNFNHcT3nlxPGs",
        authDomain: "networth-8b077.firebaseapp.com",
        databaseURL: "https://networth-8b077.firebaseio.com",
        storageBucket: "",
        messagingSenderId: "441384900863"
    };
    firebase.initializeApp(config);

    var $el = void 0,
        $assetEl = void 0,
        $debtEl = void 0;
    if (location.href.indexOf('/profile') >= 0) {
        google.charts.load('current', { 'packages': ['corechart', 'line'] });
    } else {
        google.charts.load('current', { 'packages': [/*'corechart',*/'line'] });
    }
    google.charts.setOnLoadCallback(function () {
        //either use promises or somehow use rxjs to combine the data and the chart callback for when both are ready.
        console.log('google charts loaded');
    });

    var obj = {
        monthMap: {
            1: 'January',
            2: 'Feburary',
            3: 'March',
            4: 'April',
            5: 'May',
            6: 'June',
            7: 'July',
            8: 'August',
            9: 'September',
            10: 'October',
            11: 'November',
            12: 'December'
        },
        profileEdit: true,
        setDatabase: function setDatabase(uid) {
            userDatabase = firebase.database().ref(uid);
        },
        updateUser: function updateUser() {
            var updateObj = {};
            updateObj.displayName = userData.displayName;
            userDatabase.update(updateObj);
        },
        updateProfile: function updateProfile() {
            var updateObj = {};
            if (!userData.displayName) {
                updateObj.displayName = userData.accountName;
            }
            updateObj.photoURL = userData.accountURL;
            userDatabase.update(updateObj);
        },
        watchData: function watchData(el) {

            var firstSnapshot = void 0,
                utilityThis = this;
            $el = $(el);
            $assetEl = $el.find('.asset').next().find('ul li');
            $debtEl = $el.find('.debt').next().find('ul li');

            userDatabase.on("value", function (snapshot) {
                var data = snapshot.val() || {};
                userData.entries = data.entries || {};
                userData.displayName = data.displayName;
                userData.photoURL = data.photoURL;

                if (!firstSnapshot) {
                    userData.presentMonth = userData.currentMonth;
                    userData.presentYear = userData.currentYear;
                    firstSnapshot = true;
                    utilityThis.updateProfile();
                    var dataObj = utility.getDataObj();
                    populateNetWorthValues(dataObj, $assetEl, $debtEl);
                }
            });
        },
        watchDataProfile: function watchDataProfile(el) {

            var firstSnapshot = void 0,
                utilityThis = this;
            $el = $(el);

            userDatabase.on("value", function (snapshot) {
                var data = snapshot.val() || {},
                    i = void 0;
                userData.entries = data.entries || {};

                if (!firstSnapshot) {
                    firstSnapshot = true;
                    userData.displayName = data.displayName;
                    userData.photoURL = data.photoURL;
                    userData.keys = Object.keys(userData.entries);
                    $el.find('.profileImg')[0].src = userData.photoURL;
                    $el.find('.name').text(userData.displayName);
                    var dateObj = utility.getDateObject();
                    userData.currentMonth = dateObj.month;
                    userData.currentYear = dateObj.year;
                    var dataObj = utility.getDataObjProfile();
                    userData.monthString = utility.getMonthString();
                    populateNetWorthGraph(dataObj);
                    console.log($el);
                }
            });
        },
        getMonthString: function getMonthString() {
            var keyString = userData.keys[userData.lookup],
                month = utility.monthMap[parseInt(keyString.substring(4))],
                year = keyString.substring(0, 4);
            return month + " " + year;
        },
        getReferenceStr: function getReferenceStr(month, year) {
            month = month < 10 ? '0' + month : month;
            return year + '' + month;
        },

        updateData: function updateData(entry) {
            var updateObj = {},
                refDate = this.getReferenceStr(userData.currentMonth, userData.currentYear),
                refStr = 'entries/' + refDate,
                netWorthData = void 0;
            if (!userData.entries[refDate]) {
                userData.entries[refDate] = {};
            }
            if (!userData.entries[refDate][entry.type]) {
                userData.entries[refDate][entry.type] = {};
            }
            userData.entries[refDate][entry.type][entry.name] = entry.value;
            netWorthData = this.getNetWorth(userData.entries[refDate]);
            if (netWorthData.Net !== null) {
                updateObj[refStr + '/NetWorth'] = parseFloat(netWorthData.Net).toFixed(2);
                updateObj[refStr + '/Assets'] = parseFloat(netWorthData.Assets).toFixed(2);
                updateObj[refStr + '/Debts'] = parseFloat(netWorthData.Debts).toFixed(2);
            } else {
                updateObj[refStr + '/NetWorth'] = null;
                updateObj[refStr + '/Assets'] = null;
                updateObj[refStr + '/Debts'] = null;
            }
            updateObj[refStr + '/' + entry.type + '/' + entry.name] = entry.value;
            userDatabase.update(updateObj);
            utility.populateValues(true);
        },
        getDateObject: function getDateObject(dateString) {
            var date = void 0,
                dateObject = {};
            if (dateString) {
                date = new Date(dateString);
            }
            date = date || new Date();
            dateObject.date = date;
            dateObject.month = date.getMonth() + 1;
            dateObject.year = date.getFullYear();
            return dateObject;
        },
        populateValues: function populateValues(fromUpdate) {
            var dataObj = this.getDataObj();
            if (fromUpdate && $('.side-nav li:nth-child(2) .entry-grey').length) {
                //don't redraw if grey
                this.updateNetWorthValues(dataObj);
                drawLineGraph(true);
                return false;
            }
            populateNetWorthValues(dataObj, $assetEl, $debtEl);
        },

        updateNetWorthValues: function updateNetWorthValues(dataObj) {
            var networthHeader = document.getElementsByClassName('networth-header')[0],
                opacity = .5;
            networthHeader.getElementsByClassName('networth')[0].getElementsByTagName('span')[0].textContent = '$' + parseFloat(dataObj.NetWorth).toLocaleString(undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 });
            networthHeader.getElementsByClassName('assets')[0].getElementsByTagName('span')[0].textContent = '$' + parseFloat(dataObj.Assets).toLocaleString(undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 });
            networthHeader.getElementsByClassName('debts')[0].getElementsByTagName('span')[0].textContent = '$' + parseFloat(dataObj.Debts).toLocaleString(undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 });
            networthHeader.style.opacity = opacity;
        },
        formatEntry: function formatEntry(entry) {
            var fractionIndicator = 2;

            if (entry.type === "Asset") {
                entry.class = "green-text";
                entry.prefix = '$';
            }

            if (entry.type === "Debt") {
                entry.class = "red-text";
                entry.prefix = '$';
            }

            if (typeof entry.value === "string") {
                entry.value = parseFloat(entry.value.replace(/,/g, ''));
            }

            if (isNaN(entry.value)) {
                entry.value = 0;
            }

            //entry.value = Math.abs(entry.value);
            if (entry.value % 1 === 0) {
                fractionIndicator = 0;
            }
            entry.display = entry.prefix + entry.value.toLocaleString(undefined, { maximumFractionDigits: fractionIndicator, minimumFractionDigits: fractionIndicator });

            return entry;
        },
        getDataObj: function getDataObj() {
            var refString = this.getReferenceStr(userData.currentMonth, userData.currentYear);
            var dataObj = userData.entries[refString],
                tempMonth = void 0,
                tempYear = void 0;
            var entryKeys = void 0,
                entryIndex = void 0;

            if (!dataObj || !dataObj.NetWorth) {
                tempMonth = userData.currentMonth - 1;
                tempYear = userData.currentYear;
                if (tempMonth === 0) {
                    tempMonth = 12;
                    tempYear -= 1;
                }
                refString = this.getReferenceStr(tempMonth, tempYear);
                dataObj = userData.entries[refString];
                if (dataObj) {
                    dataObj.entryGrey = true;
                }
            } else if (dataObj) {
                dataObj.entryGrey = false;
            }

            entryKeys = Object.keys(userData.entries);
            entryIndex = entryKeys.indexOf(refString);
            if (entryIndex >= 6) {
                //calculate 6 mo average
                this.calculateNetworthAvg(entryKeys.slice(entryIndex - 6, entryIndex + 1), dataObj);
            } else if (entryIndex >= 3) {
                //calculate 3 mo average
                this.calculateNetworthAvg(entryKeys.slice(entryIndex - 3, entryIndex + 1), dataObj);
            } else if (entryIndex >= 1) {
                this.calculateNetworthAvg(entryKeys.slice(entryIndex - 1, entryIndex + 1), dataObj);
            }

            return dataObj;
        },
        calculateNetworthAvg: function calculateNetworthAvg(entries, dataObj) {
            var _this = this;

            var sum = 0,
                threeMo = void 0,
                sixMo = void 0,
                oneMo = void 0,
                fractionIndicator = void 0;
            entries.reverse().map(function (entry, index) {
                var entryData = userData.entries[entry];
                if (index + 1 < entries.length) {
                    /*                    if(index === 0){ // Calculate difference 1 month running
                                            Object.keys(entryData.Asset).map((key)=>{
                                                console.log(key,entryData.Asset[key]-userData.entries[entries[index+1]].Asset[key]);
                                            });
                                            Object.keys(entryData.Debt).map((key)=>{
                                                console.log(key,entryData.Debt[key]-userData.entries[entries[index+1]].Debt[key]);
                                            });
                                        }*/
                    sum += entryData.NetWorth - userData.entries[entries[index + 1]].NetWorth;
                }
                if (index === 0) {
                    oneMo = sum;
                    fractionIndicator = _this.getFractionIndicator(oneMo);
                    oneMo = oneMo.toLocaleString(undefined, { maximumFractionDigits: fractionIndicator, minimumFractionDigits: fractionIndicator });
                }
                if (index === 2) {
                    threeMo = sum / 3;
                    fractionIndicator = _this.getFractionIndicator(threeMo);
                    threeMo = threeMo.toLocaleString(undefined, { maximumFractionDigits: fractionIndicator, minimumFractionDigits: fractionIndicator });
                }
                if (index === 5) {
                    sixMo = sum / 6;
                    fractionIndicator = _this.getFractionIndicator(sixMo);
                    sixMo = sixMo.toLocaleString(undefined, { maximumFractionDigits: fractionIndicator, minimumFractionDigits: fractionIndicator });
                }
            });
            dataObj.oneMo = oneMo;
            dataObj.threeMo = threeMo;
            dataObj.sixMo = sixMo;
            //userData
        },
        getFractionIndicator: function getFractionIndicator(num) {
            return num % 1 === 0 ? 0 : 2;
        },
        getDataObjProfile: function getDataObjProfile() {
            var refString = this.getReferenceStr(userData.currentMonth, userData.currentYear),
                dataObj = void 0,
                i = void 0;

            for (i = 0; i < userData.keys.length; i++) {
                if (userData.keys[i] === refString) {
                    userData.lookup = i;
                    userData.keys = userData.keys.slice(0, i + 1);
                    break;
                }
            }

            if (!userData.lookup) {
                userData.lookup = userData.keys.length - 1;
                dataObj = userData.entries[userData.keys[userData.lookup]];
            } else {
                dataObj = userData.entries[refString];
            }
            return dataObj;
        },
        getNetWorth: function getNetWorth(obj) {
            var Assets = void 0,
                Debts = void 0,
                Net = void 0,
                assetKeys = void 0,
                debtKeys = void 0,
                hit = false;
            if (!obj) {
                obj = {};
            }
            if (!obj['Asset']) {
                //create a helper function that will check if something exists and if not create empty obj
                obj['Asset'] = {};
            }
            if (!obj['Debt']) {
                //create a helper function that will check if something exists and if not create empty obj
                obj['Debt'] = {};
            }
            assetKeys = Object.keys(obj['Asset']);
            debtKeys = Object.keys(obj['Debt']);

            Assets = assetKeys.reduce(function (prev, current) {
                if (obj['Asset'][current] !== null) {
                    prev += obj['Asset'][current];
                    hit = true;
                }
                return prev;
            }, 0);
            Debts = debtKeys.reduce(function (prev, current) {
                if (obj['Debt'][current] !== null) {
                    hit = true;
                    prev += obj['Debt'][current];
                }
                return prev;
            }, 0);
            Net = Assets - Debts;
            if (!hit) {
                return { 'Net': null };
            }
            return { 'Net': Net, 'Assets': Assets, 'Debts': Debts };
        }
    };

    return obj;
}();
'use strict';

var _CycleDOM = CycleDOM,
    label = _CycleDOM.label,
    input = _CycleDOM.input,
    hr = _CycleDOM.hr,
    div = _CycleDOM.div,
    h1 = _CycleDOM.h1,
    h4 = _CycleDOM.h4,
    a = _CycleDOM.a,
    span = _CycleDOM.span,
    makeDOMDriver = _CycleDOM.makeDOMDriver,
    button = _CycleDOM.button,
    p = _CycleDOM.p,
    br = _CycleDOM.br,
    h2 = _CycleDOM.h2,
    header = _CycleDOM.header,
    nav = _CycleDOM.nav,
    ul = _CycleDOM.ul,
    li = _CycleDOM.li,
    img = _CycleDOM.img,
    i = _CycleDOM.i,
    main = _CycleDOM.main,
    select = _CycleDOM.select,
    option = _CycleDOM.option;


function page(sources) {

    var headerTree$ = headerModule(sources).DOM;
    var mainTree$ = mainModule(sources).DOM;

    var vtree$ = Rx.Observable.combineLatest(headerTree$, mainTree$, function (headerTree, mainTree) {
        return div([headerTree, br(), mainTree]);
    });

    return {
        DOM: vtree$
    };
}

var drivers = {
    DOM: makeDOMDriver('#app')
};

function headerModule(sources) {
    var watchNav$ = sources.DOM.select('.nav').observable.subscribe(function (el) {
        if (el.length) {
            if (!utility.profileEdit) {
                el[0].getElementsByClassName('logout')[0].hidden = true;
            }
            utility.watchDataProfile(el);
            watchNav$.dispose();
        }
    });

    var watchChangeGraph$ = sources.DOM.select('.changeGraph').observable.subscribe(function (el) {
        if (el.length) {
            var coverDiv = el[0].getElementsByClassName('coverDiv')[0],
                cardPanel = el[0].nextElementSibling.getElementsByClassName('card-panel')[0];
            coverDiv.style.top = cardPanel.offsetTop + "px";
            coverDiv.style.left = cardPanel.offsetLeft + 10 + "px";
            coverDiv.style.width = cardPanel.offsetWidth - 20 + "px";
            watchChangeGraph$.dispose();
        }
    });

    var editMouseClick$ = sources.DOM.select('.nav .nav-wrapper .name .edit').events('click').subscribe(function (ev) {
        var parent = $(ev.currentTarget.parentElement.parentElement);
        parent.find('.name').hide();
        if (userData.displayName) {
            parent.find('.input-field.col label').addClass('active');
        } else {
            parent.find('.input-field.col label').removeClass('active');
        }
        parent.find('.input-field.col input').val(userData.displayName).focus().parent().show();
    });

    var updateMouseClick$ = sources.DOM.select('.nav .nav-wrapper .update').events('click').subscribe(function (ev) {
        var parent = $(ev.currentTarget.parentElement.parentElement);
        var val = parent.find('.input-field.col').hide().find('#name').val();
        if (!val) {
            parent.find('.name').after(parent.find('.name i'));
            parent.find('.name').show();
            return false;
        }
        userData.displayName = val;
        parent.find('.name').after(parent.find('.name i'));
        parent.find('.name').show().text(val);
        utility.updateUser();
    });

    var networthClick$ = sources.DOM.select('.brand-logo').events('click').subscribe(function (ev) {
        location.href = "/Net-Worth";
    });

    sources.DOM.select('.logout').events('click').subscribe(function (ev) {
        firebase.auth().signOut();
        location.href = "/Net-Worth";
    });

    var getMouseLeave$ = sources.DOM.select('.nav .nav-wrapper .name').events('mouseenter').map(function (ev) {
        return ev;
    });

    var getMouseEnter$ = sources.DOM.select('.nav .nav-wrapper .name').events('mouseleave').map(function (ev) {
        return ev;
    });

    getMouseLeave$.merge(getMouseEnter$).subscribe(function (ev) {
        if (!utility.profileEdit) {
            return false;
        }
        var el$ = $(ev.currentTarget);
        if (ev.type === 'mouseenter') {
            el$.append($('.edit').removeClass('hide'));
        }
        if (ev.type === 'mouseleave') {
            if (ev.fromElement.className !== 'material-icons edit') {
                $('.edit').addClass('hide');
            }
        }
    });

    var getFocus$ = sources.DOM.select('.input-field input:not(.select-dropdown)').events('focus').map(function (ev) {
        ev.currentTarget.nextSibling.className = "active";
    }).startWith('').subscribe(function () {});

    var getBlur$ = sources.DOM.select('.input-field input:not(.select-dropdown)').events('blur').map(function (ev) {
        if (!ev.currentTarget.value) {
            ev.currentTarget.nextSibling.className = "";
        }
    }).startWith('').subscribe(function () {
        console.log('blur');
    });

    sources.DOM.select('.changeGraph button').events('click').subscribe(function (e) {
        var $target = $(e.target);
        $target.addClass('active').siblings().removeClass('active');
        populateNetWorthGraph(userData.entries[userData.keys[userData.lookup]]);
    });

    sources.DOM.select('.arrow.left').events('click').subscribe(function () {
        userData.lookup -= 1;
        userData.monthString = utility.getMonthString();
        populateNetWorthGraph(userData.entries[userData.keys[userData.lookup]]);
    });

    sources.DOM.select('.arrow.right').events('click').subscribe(function () {
        userData.lookup += 1;
        userData.monthString = utility.getMonthString();
        populateNetWorthGraph(userData.entries[userData.keys[userData.lookup]]);
    });

    var vtree$ = Rx.Observable.of(div([div('.nav', { style: 'height:120px;' }, [div('.nav-wrapper', [div('.logout', { style: { padding: '5px', color: '#cecece', cursor: 'pointer' } }, [span('Sign Out')]), a('.brand-logo .center', 'Worth Watchers'), img('.profileImg .center'), label('.name .center' /*,{style:{display:'none'}}*/), div('.input-field .col', { style: { 'display': 'none', 'width': '150px', 'margin-left': '50%', 'position': 'absolute', 'transform': 'translateX(-50%)', 'top': '152px' } }, [input('#name .validate', { type: 'text', style: { 'font-size': '16px', 'text-align': 'center' } }), label('Name'), i('.material-icons .update', 'done')]), i('.material-icons .edit .hide', 'mode_edit')])]), br(), br(), div('.row .networth-header', { style: { visibility: 'hidden', 'padding-left': '10px' } }, [div('.col .s12 .m12 .l12 .navigate', [button('.arrow .left', { style: { display: 'inline-block' } }, [i(), i()]), div({ style: { display: 'inline-block', width: '115px', 'text-align': 'center' } }, [label('.nav-title', 'December 2016')]), button('.arrow .right', { style: { display: 'inline-block' } }, [i(), i()])]), div('.col .s12 .m12 .l12 .assets', [label('Assets: '), span('.green-text', '')]), div('.col .s12 .m12 .l12 .debts', [label('Debts: '), span('.red-text', '')]), div('.col .s12 .m12 .l12 .networth', [label('Net Worth: '), span('.green-text .text-darken-3', '')])]), br(), div('.row', [div('.col .s12 .m12 .l12 .changeGraph', { style: { opacity: '0' } }, [button('.netWorthGraph .active .drawn', 'Net Worth'), button('.assetsGraph', 'Assets'), button('.debtsGraph', 'Debts'), div('.coverDiv')]), div('.col .s12 .offset-m1 .m10 .offset-l2 .l8', { style: { 'padding-left': '20px' } }, [div('.card-panel', { style: { opacity: '0' } }, [div('#curve_chart'), div('#curve_chart_assets'), div('#curve_chart_debts')])]), br(), div('.col .s6 .offset-m1 .m5 .offset-l2 .l4', { style: { 'padding-left': '20px' } }, [div('.card-panel', { style: { opacity: '0' } }, [div('#pie_chart1')])]), div('.col .s6 .m5 .l4', [div('.card-panel', { style: { opacity: '0' } }, [div('#pie_chart2')])])]), br(), br()]));

    return {
        DOM: vtree$
    };
}

function mainModule(sources) {

    var vtree$ = Rx.Observable.of(div([
        /*p('main')*/
    ]));

    return {
        DOM: vtree$
    };
}

//firebase.auth().signOut();

var initApp = function initApp() {

    var userLookup,
        index,
        doc = document;
    index = location.href.indexOf('user=');
    if (index >= 0) {
        userLookup = location.href.substring(index + 5);
    }

    firebase.auth().onAuthStateChanged(function (user) {
        if (userLookup) {
            utility.setDatabase(userLookup);
            Cycle.run(page, drivers);
            if (!user || user.uid !== userLookup) {
                utility.profileEdit = false;
            }
        } else if (user) {
            utility.setDatabase(user.uid);
            Cycle.run(page, drivers);
            history.replaceState('', 'Net Worth Profile', location.href + '?user=' + user.uid);
        } else {
            location.href = "/Net-Worth";
        }
    }, function (error) {
        console.log(error);
    });
};

window.addEventListener('load', function () {
    initApp();
});

function updateView() {
    $('.arrow').css('display', 'inline-block');
    $('#curve_chart').parent().show();
    $('.changeGraph').show();
    if (userData.lookup === userData.keys.length - 1) {
        $('.arrow.right').hide();
    }
    if (userData.lookup === 0) {
        $('.arrow.left').hide();
        $('#curve_chart').parent().hide();
        $('.changeGraph').hide();
    }
}

function drawLineGraph(ind, passedInTitle) {
    var i = void 0,
        indicator = ind || '',
        title = passedInTitle || "Net Worth",
        dataMap = passedInTitle || "NetWorth",
        currentString = userData.keys[userData.lookup],
        entryKeys = [],
        networthMonth = void 0,
        temp = void 0;
    var $el = $(document.getElementById('curve_chart' + indicator)),
        dataArr = void 0,
        width = void 0,
        ratio = 2.2;

    for (i = 0; i < userData.keys.length; i++) {
        entryKeys.push(userData.keys[i]);
        if (userData.keys[i] === currentString) {
            break;
        }
    }
    $el.hide();

    if (entryKeys.length <= 1) {
        return false;
    }

    if (entryKeys.length) {
        temp = entryKeys[entryKeys.length - 1];
        userData.currentMonth = parseInt(temp.substring(4));
        userData.currentYear = temp.substring(0, 4);
    }

    dataArr = entryKeys.reduce(function (prev, key) {
        var keyString = key.toString(),
            month = utility.monthMap[parseInt(keyString.substring(4))],
            year = keyString.substring(0, 4);
        networthMonth = month + " " + year;
        prev.push([networthMonth, parseFloat(userData.entries[key][dataMap])]);
        return prev;
    }, [['Month', title]]);

    var data = google.visualization.arrayToDataTable(dataArr);

    width = $el.parent().width() - 5;

    //debugger;
    if (width < 900) {
        ratio = 1.5;
    }

    if (width < 450) {
        ratio = 1.2;
    }

    var options = {
        chart: {
            title: title + ' as of ' + networthMonth,
            subtitle: ''
        },
        width: width,
        height: width / ratio
    };
    var chart = new google.charts.Line($el[0]);

    chart.draw(data, options);

    $el.fadeIn('slow').siblings().hide();
}

function drawPieGraphs(obj, type) {
    var rows = [],
        chart = void 0,
        el = document.getElementById('pie_chart1'),
        el2 = document.getElementById('pie_chart2'),
        dataArr = void 0,
        width = void 0,
        ratio = 2.2;

    var currentString = userData.keys[userData.lookup];

    // Create the data table.
    var data = new google.visualization.DataTable();
    data.addColumn('string', 'Asset');
    data.addColumn('number', 'Amount');

    if (userData.entries[currentString] && userData.entries[currentString].Asset) {

        rows = Object.keys(userData.entries[currentString].Asset).map(function (key) {
            return [key, parseFloat(userData.entries[currentString].Asset[key])];
        });
    }

    width = $(el).parent().width();
    width = width + .05 * width;

    //debugger;
    if (width < 900) {
        ratio = 1.5;
    }

    if (width < 450) {
        ratio = 1.2;
    }

    var options = { 'title': 'Asset Allocation',
        width: width,
        height: width / ratio };

    if (rows.length) {
        data.addRows(rows);
        // Instantiate and draw our chart, passing in some options.
        var _chart = new google.visualization.PieChart(el);
        el.hidden = false;
        _chart.draw(data, options);
    }

    //NEW

    data = new google.visualization.DataTable();
    data.addColumn('string', 'Debt');
    data.addColumn('number', 'Amount');

    rows = [];

    if (userData.entries[currentString] && userData.entries[currentString].Debt) {
        rows = Object.keys(userData.entries[currentString].Debt).map(function (key) {
            return [key, parseFloat(userData.entries[currentString].Debt[key])];
        });
    }

    if (rows.length) {
        data.addRows(rows);

        // Set chart options
        options.title = 'Debt Allocation';

        // Instantiate and draw our chart, passing in some options.
        var _chart2 = new google.visualization.PieChart(el2);
        el2.hidden = false;
        _chart2.draw(data, options);
    }
}

function populateNetWorthGraph(dataObj) {
    var networthHeader = void 0,
        indicator = "",
        title = "",
        activeTab = void 0;

    if (dataObj) {
        updateView();
        networthHeader = document.getElementsByClassName('networth-header')[0];
        networthHeader.getElementsByClassName('nav-title')[0].textContent = userData.monthString;
        networthHeader.getElementsByClassName('networth')[0].getElementsByTagName('span')[0].textContent = '$' + parseFloat(dataObj.NetWorth).toLocaleString(undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 });
        networthHeader.getElementsByClassName('assets')[0].getElementsByTagName('span')[0].textContent = '$' + parseFloat(dataObj.Assets).toLocaleString(undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 });
        networthHeader.getElementsByClassName('debts')[0].getElementsByTagName('span')[0].textContent = '$' + parseFloat(dataObj.Debts).toLocaleString(undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 });
        networthHeader.style.visibility = "";

        activeTab = $('.changeGraph .active');
        if (activeTab.text() === "Assets") {
            indicator = "_assets";
            title = "Assets";
        }
        if (activeTab.text() === "Debts") {
            indicator = "_debts";
            title = "Debts";
        }

        drawLineGraph(indicator, title);
        drawPieGraphs();
        $('.card-panel, .changeGraph').css('opacity', 1);
    }
}