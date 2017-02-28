const {label, input, hr, div, h1, h4, a, span, makeDOMDriver, button, p, br, h2, header, nav, ul, li, img, i, main, select, option} = CycleDOM;
  
function page(sources){ 

  let headerTree$ = headerModule(sources).DOM;
  let mainTree$ = mainModule(sources).DOM;
    
  let vtree$ = Rx.Observable.combineLatest(headerTree$, mainTree$, (headerTree, mainTree) =>
                    div([
                        headerTree,
                        br(),
                        mainTree
                    ])
                );
  
  return {
      DOM: vtree$
  }; 
}

const drivers = {
  DOM: makeDOMDriver('#app')
}


function headerModule(sources){
   let watchNav$ = sources.DOM.select('.nav')
        .observable
        .subscribe((el)=>{
            if(el.length){
                if(!utility.profileEdit){
                    el[0].getElementsByClassName('logout')[0].hidden = true;
                }
                utility.watchDataProfile(el);
                watchNav$.dispose();
            }   
        });

    let watchChangeGraph$ = sources.DOM.select('.changeGraph')
        .observable
        .subscribe((el)=>{
            if(el.length){
                var coverDiv = el[0].getElementsByClassName('coverDiv')[0],
                cardPanel = el[0].nextElementSibling.getElementsByClassName('card-panel')[0];
                coverDiv.style.top = cardPanel.offsetTop + "px";
                coverDiv.style.left = cardPanel.offsetLeft + 10 + "px";
                coverDiv.style.width = cardPanel.offsetWidth - 20 + "px";
                watchChangeGraph$.dispose();
            }      
        });

    let editMouseClick$ = sources.DOM.select('.nav .nav-wrapper .name .edit').events('click').subscribe(function(ev){
        var parent = $(ev.currentTarget.parentElement.parentElement);
        parent.find('.name').hide();
        if(userData.displayName){
            parent.find('.input-field.col label').addClass('active');
        }
        else {
            parent.find('.input-field.col label').removeClass('active');
        }
        parent.find('.input-field.col input').val(userData.displayName).focus().parent().show();
    });

    let updateMouseClick$ = sources.DOM.select('.nav .nav-wrapper .update').events('click').subscribe(function(ev){
        var parent = $(ev.currentTarget.parentElement.parentElement);
        var val = parent.find('.input-field.col').hide().find('#name').val();
        if(!val){
            parent.find('.name').after(parent.find('.name i'));
            parent.find('.name').show();
            return false;
        }
        userData.displayName = val;
        parent.find('.name').after(parent.find('.name i'));
        parent.find('.name').show().text(val);
        utility.updateUser();
    });

    let networthClick$ = sources.DOM.select('.brand-logo').events('click').subscribe(function(ev){
        location.href = "/Net-Worth";
    });

    sources.DOM.select('.logout').events('click').subscribe(function(ev){
        firebase.auth().signOut();
        location.href = "/Net-Worth";
    });

    let getMouseLeave$ = sources.DOM.select('.nav .nav-wrapper .name').events('mouseenter').map(ev => {
        return ev;
    });

    let getMouseEnter$ = sources.DOM.select('.nav .nav-wrapper .name').events('mouseleave').map(ev => {
        return ev;
    });

    getMouseLeave$.merge(getMouseEnter$).subscribe((ev)=>{
        if(!utility.profileEdit){
            return false;
        }
        let el$ = $(ev.currentTarget);
        if(ev.type === 'mouseenter'){
            el$.append($('.edit').removeClass('hide'));
        }
        if(ev.type === 'mouseleave'){
                if(ev.fromElement.className !== 'material-icons edit'){
                    $('.edit').addClass('hide');
                }
        }
    });

    let getFocus$ = sources.DOM.select('.input-field input:not(.select-dropdown)').events('focus').map(ev => {
        ev.currentTarget.nextSibling.className = "active";
    }).startWith('').subscribe(function(){
 
    });
    
  let getBlur$ = sources.DOM.select('.input-field input:not(.select-dropdown)').events('blur').map(ev => {
        if(!ev.currentTarget.value){
            ev.currentTarget.nextSibling.className = "";
        }
    }).startWith('').subscribe(function(){
        console.log('blur');
    });

    sources.DOM.select('.changeGraph button').events('click').subscribe(function(e){
        var $target = $(e.target);
        $target.addClass('active').siblings().removeClass('active');
        populateNetWorthGraph(userData.entries[userData.keys[userData.lookup]]);
    });

    sources.DOM.select('.arrow.left').events('click').subscribe(function(){
        userData.lookup -= 1;
        userData.monthString = utility.getMonthString();
        populateNetWorthGraph(userData.entries[userData.keys[userData.lookup]]);
    });

    sources.DOM.select('.arrow.right').events('click').subscribe(function(){
        userData.lookup += 1;
        userData.monthString = utility.getMonthString();
        populateNetWorthGraph(userData.entries[userData.keys[userData.lookup]]);
    });

    let vtree$ = Rx.Observable.of(
        div([
            div('.nav',{style:'height:120px;'},[
                div('.nav-wrapper',[
                    div('.logout',{style:{padding:'5px',color:'#cecece',cursor:'pointer'}},[
                        span('Sign Out')
                    ]),
                    a('.brand-logo .center','Worth Watchers'),
                    img('.profileImg .center'),
                    label('.name .center'/*,{style:{display:'none'}}*/),
                    div('.input-field .col',{style:{'display':'none','width':'150px','margin-left':'50%','position':'absolute','transform':'translateX(-50%)','top':'152px'}},[
                        input('#name .validate',{type:'text',style:{'font-size':'16px','text-align':'center'}}),
                        label('Name'),
                        i('.material-icons .update','done')
                    ]),
                    i('.material-icons .edit .hide','mode_edit')
                ])
            ]),
            br(),
            br(),
            div('.row .networth-header',{style: {visibility: 'hidden','padding-left':'10px'}},[
                div('.col .s12 .m12 .l12 .navigate',[
            button('.arrow .left',{style:{display:'inline-block'}},[
            i(),
            i()
          ]),
          div({style:{display:'inline-block',width:'115px','text-align':'center'}},[
              label('.nav-title','December 2016')
          ]),
          button('.arrow .right',{style:{display:'inline-block'}},[
            i(),
            i()
          ])
                ]),
                div('.col .s12 .m12 .l12 .assets',[
                    label('Assets: '),
                    span('.green-text','')
                ]),
                div('.col .s12 .m12 .l12 .debts',[
                    label('Debts: '),
                    span('.red-text','')
                ]),
                div('.col .s12 .m12 .l12 .networth',[
                    label('Net Worth: '),
                    span('.green-text .text-darken-3','')
                ])
            ]),
            br(),
            div('.row',[
                div('.col .s12 .m12 .l12 .changeGraph',{style:{opacity:'0'}},[
                    button('.netWorthGraph .active .drawn','Net Worth'),
                    button('.assetsGraph','Assets'),
                    button('.debtsGraph','Debts'),
                    div('.coverDiv')
                ]),
                div('.col .s12 .offset-m1 .m10 .offset-l2 .l8',{style:{'padding-left':'20px'}},[
                    div('.card-panel',{style:{opacity:'0'}},[
                        div('#curve_chart'),
                        div('#curve_chart_assets'),
                        div('#curve_chart_debts')
                    ])
                ]),
                br(),
                div('.col .s6 .offset-m1 .m5 .offset-l2 .l4',{style:{'padding-left':'20px'}},[
                    div('.card-panel',{style:{opacity:'0'}},[
                        div('#pie_chart1')
                    ])
                ]),
                div('.col .s6 .m5 .l4',[
                    div('.card-panel',{style:{opacity:'0'}},[
                        div('#pie_chart2')
                    ])
                ])
            ]),
            br(),
            br()
        ])
    );
  
    return {
        DOM: vtree$
    }; 

}

function mainModule(sources){

    let vtree$ = Rx.Observable.of(
        div([
            /*p('main')*/
        ])
    );
  
    return {
        DOM: vtree$
    };

}

//firebase.auth().signOut();

let initApp = function() {

    var userLookup, index, doc = document;
    index = location.href.indexOf('user=');
    if(index >= 0){
        userLookup = location.href.substring(index+5);
    }

    firebase.auth().onAuthStateChanged(function(user) {
        if(userLookup){
            utility.setDatabase(userLookup);
            Cycle.run(page, drivers);
            if(!user || (user.uid !== userLookup)){
                utility.profileEdit = false;
            }
        }
        else if (user) {
            utility.setDatabase(user.uid);
            Cycle.run(page, drivers);
            history.replaceState('', 'Net Worth Profile', location.href + '?user='+user.uid);
        } else {
            location.href = "/Net-Worth";    
        }
    }, function(error) {
        console.log(error);
    });
 
};

window.addEventListener('load', function() {
    initApp();
});

function updateView(){
    $('.arrow').css('display','inline-block');
    $('#curve_chart').parent().show();
    $('.changeGraph').show();
    if(userData.lookup === userData.keys.length-1){
        $('.arrow.right').hide();
    }
    if(userData.lookup === 0){
        $('.arrow.left').hide();
        $('#curve_chart').parent().hide();
        $('.changeGraph').hide();
    }
}

function drawLineGraph(ind, passedInTitle){
       let i, 
       indicator = ind || '',
       title = passedInTitle || "Net Worth",
       dataMap = passedInTitle || "NetWorth",
       currentString = userData.keys[userData.lookup], 
       entryKeys = [],
       networthMonth, temp;
       let $el = $(document.getElementById('curve_chart'+indicator)),
       dataArr, width, ratio = 2.2;

       for(i = 0;i < userData.keys.length;i++){
           entryKeys.push(userData.keys[i]);
           if(userData.keys[i] === currentString){
               break;
           }
       }
       $el.hide(); 

       if(entryKeys.length <= 1){
           return false;
       }

       if(entryKeys.length){
           temp = entryKeys[entryKeys.length-1];
           userData.currentMonth = parseInt(temp.substring(4));
           userData.currentYear = temp.substring(0,4);
       }

       dataArr = entryKeys.reduce((prev,key)=>{
           let keyString = key.toString(),
           month = utility.monthMap[parseInt(keyString.substring(4))],
           year = keyString.substring(0,4);
           networthMonth = month + " " + year;
           prev.push([networthMonth,parseFloat(userData.entries[key][dataMap])]);
           return prev;
       },[['Month',title]]);
        
        let data = google.visualization.arrayToDataTable(dataArr);

        width = $el.parent().width()-5;

        //debugger;
        if(width < 900){
            ratio = 1.5;
        }

        if(width < 450){
            ratio = 1.2;
        }

        let options = {
        chart: {
          title: title + ' as of '+networthMonth,
          subtitle: ''
        },
        width: width,
        height: width/ratio
      };
        let chart = new google.charts.Line($el[0]);

        chart.draw(data, options);

        $el.fadeIn('slow').siblings().hide();

}

function drawPieGraphs(obj,type){
    let rows = [], chart, el = document.getElementById('pie_chart1'), el2 = document.getElementById('pie_chart2'),
    dataArr, width, ratio = 2.2;

    let currentString = userData.keys[userData.lookup];

    // Create the data table.
    let data = new google.visualization.DataTable();
    data.addColumn('string', 'Asset');
    data.addColumn('number', 'Amount');

    if(userData.entries[currentString] && userData.entries[currentString].Asset){

        rows = Object.keys(userData.entries[currentString].Asset).map((key)=>{
            return [key,parseFloat(userData.entries[currentString].Asset[key])];
        });
    }

    width = $(el).parent().width();
    width = width + (.05*width);

    //debugger;
    if(width < 900){
        ratio = 1.5;
    }

    if(width < 450){
        ratio = 1.2;
    }

    let options = {'title':'Asset Allocation',
                width: width,
                height: width/ratio};

    if(rows.length){
        data.addRows(rows); 
        // Instantiate and draw our chart, passing in some options.
        let chart = new google.visualization.PieChart(el);
        el.hidden = false;
        chart.draw(data, options);
    }



    //NEW

    data = new google.visualization.DataTable();
    data.addColumn('string', 'Debt');
    data.addColumn('number', 'Amount');

    rows = [];

    if(userData.entries[currentString] && userData.entries[currentString].Debt){
        rows = Object.keys(userData.entries[currentString].Debt).map((key)=>{
            return [key,parseFloat(userData.entries[currentString].Debt[key])];
        });
    }

    if(rows.length){
        data.addRows(rows); 

        // Set chart options
        options.title = 'Debt Allocation';

        // Instantiate and draw our chart, passing in some options.
        let chart = new google.visualization.PieChart(el2);
        el2.hidden = false;
        chart.draw(data, options);
    }

}

function populateNetWorthGraph(dataObj){
    let networthHeader, indicator = "", title = "", activeTab;

            if(dataObj){
                updateView();
                networthHeader = document.getElementsByClassName('networth-header')[0];
                networthHeader.getElementsByClassName('nav-title')[0].textContent = userData.monthString;
                networthHeader.getElementsByClassName('networth')[0].getElementsByTagName('span')[0].textContent = '$' + parseFloat(dataObj.NetWorth).toLocaleString(undefined, {maximumFractionDigits: 0, minimumFractionDigits: 0});
                networthHeader.getElementsByClassName('assets')[0].getElementsByTagName('span')[0].textContent = '$' + parseFloat(dataObj.Assets).toLocaleString(undefined, {maximumFractionDigits: 0, minimumFractionDigits: 0});
                networthHeader.getElementsByClassName('debts')[0].getElementsByTagName('span')[0].textContent = '$' + parseFloat(dataObj.Debts).toLocaleString(undefined, {maximumFractionDigits: 0, minimumFractionDigits: 0});
                networthHeader.style.visibility = "";

                activeTab = $('.changeGraph .active');
                if(activeTab.text() === "Assets"){
                    indicator = "_assets";
                    title = "Assets";
                }
                if(activeTab.text() === "Debts"){
                    indicator = "_debts";
                    title = "Debts";
                }

                drawLineGraph(indicator,title);
                drawPieGraphs();
                $('.card-panel, .changeGraph').css('opacity',1);
            }        

}

  