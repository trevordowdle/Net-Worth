
function sideNavModule(sources){

  let vtree$;

  let getMouseLeave$ = sources.DOM.select('.collapsible-body ul li a').events('mouseenter').map(ev => {
      return ev;
  });

  let getMouseEnter$ = sources.DOM.select('.collapsible-body ul li a').events('mouseleave').map(ev => {
      return ev;
  });

  getMouseLeave$.merge(getMouseEnter$).subscribe((ev)=>{
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
    
  let getClickSideBar$ = sources.DOM.select('.collapsible-header').events('click').map(ev => {
    let $target = $(ev.currentTarget);
    $target.toggleClass('active');
    accordionToggle($target); 
  }).startWith('');
    
  let getClickAdd$ = sources.DOM.select('.btn-floating.add').events('click').map(ev => {
    $('#modal1').openModal();     
  });

  let getClickEdit$ = sources.DOM.select('.material-icons.edit').events('click').map(ev => {
      let item = ev.currentTarget.parentElement,
      infoItems, itemType, index,
      itemClass = item.parentElement.className,
      modal2 = $('#modal2');
      if(itemClass.indexOf('asset-items') >= 0){
          itemType = 'Asset';
          index = 1;
      }
      else if(itemClass.indexOf('debt-items') >= 0){
          itemType = 'Debt';
          index = 1;
      }
      infoItems = item.firstChild.innerText.split(' - ');
      infoItems[1] = infoItems[1]/*.replace(/,/g, "")*/.substring(index);

      $('#modal2').find('select')[0].disabled = true;
      $('#modal2').find('select').val(itemType).material_select();
      $('#modal2').find('#name').val(infoItems[0]).next().addClass('active');
      $('#modal2').find('#value').val(infoItems[1]).next().addClass('active');
      $('#modal2').data("item",item);
      $('#modal2').openModal();     
  });
    
  let getClicks$ = getClickSideBar$.merge(getClickAdd$).merge(getClickEdit$);
    
  watchSidebar$ = sources.DOM.select('.side-nav li .collapsible')
                       .observable
                       .subscribe((el)=>{
                            //$(el).append(temp);
                            if(el.length){
                                utility.watchData(el);
                                watchSidebar$.dispose();
                            }   
                        });

 watchToggleNav$ = sources.DOM.select('.button-collapse')
    .observable
    .subscribe((el)=>{
        //$(el).append(temp);
        if(el.length){
            $(el).sideNav();
            watchToggleNav$.dispose();
        }   
    });

  clickProfile$ = sources.DOM.select('#profile')
                  .events('click')
                  .subscribe((ev)=>{
                      location.href = "profile";
                  });
    
  vtree$ = getClicks$.map(()=>
            div([
                ul('.side-nav .fixed #nav-mobile',[
                    li('.side-nav-top',[
                        span('#profile',[
                            img({src:userData.accountURL,style:{width:'35px','border-radius':'50%'}}),
                        ]),
                        span('#logo .noselect',[
                            /*img({src:'https://material.google.com/static/images/nav_google_logo.svg'}),*/
                            img({src:'img/logo.png',style:{'width':'100px'}})
                        ]),
                        a('.add .btn-floating .btn-large .waves-effect .waves-light .green',[
                            i('.material-icons','add')    
                        ])
                    ]),
                    li('.no-padding',[
                        ul('#sideNav .collapsible .collapsible-accordion',[
                            li('.bold',[
                                a('.collapsible-header .waves-effect .waves-teal .asset','Assets'),
                                div('.collapsible-body',[
                                    ul([
                                        li('.asset-items')
                                    ])
                                ])
                            ]),
                            li('.bold',[
                                a('.collapsible-header .waves-effect .waves-teal .debt','Debts'),
                                div('.collapsible-body',[
                                    ul([
                                        li('.debt-items')
                                    ])
                                ])
                            ])
                        ])
                    ])
                  ]),
                  a('.button-collapse',{attributes:{'data-activates':'nav-mobile'},style:{position:'absolute',top:'5px',left:'5px',color:'white',cursor:'pointer'}},[
                      i('.material-icons','menu')
                  ]),
                  i('.material-icons .edit .hide','mode_edit') // to do give this background and waves
                ])
      );
    
  return {
    DOM: vtree$
  };

}

function accordionToggle(object) {
    if (object.hasClass('active')){
      object.siblings('.collapsible-body').stop(true,false).slideDown({ duration: 350, easing: "easeOutQuart", queue: false, complete: function() {$(this).css('height', '');}});
    }
    else{
      object.siblings('.collapsible-body').stop(true,false).slideUp({ duration: 350, easing: "easeOutQuart", queue: false, complete: function() {$(this).css('height', '');}});
    }
}

function populateNetWorthValues(dataObj,$elAsset,$elDebt){
    let networthHeader;
    moveEdit($elAsset.closest('.collapsible-accordion')[0]);
    $elAsset.empty();
    $elDebt.empty();
    if(dataObj){
        //Somewhere in here we can initiate the graphs but need to create a uncoupled function so I can use it for updates as well

            //drawGraph(dataObj['Asset'],'Asset');
            //drawGraph(dataObj['Debt'],'Debt');
            //debugger;
            drawLineGraph(dataObj.entryGrey);
            //document.getElementBy
            networthHeader = document.getElementsByClassName('networth-header')[0];
            networthHeader.getElementsByClassName('networth')[0].getElementsByTagName('span')[0].textContent = '$' + parseFloat(dataObj.NetWorth).toLocaleString(undefined, {maximumFractionDigits: 0, minimumFractionDigits: 0});
            networthHeader.getElementsByClassName('assets')[0].getElementsByTagName('span')[0].textContent = '$' + parseFloat(dataObj.Assets).toLocaleString(undefined, {maximumFractionDigits: 0, minimumFractionDigits: 0});
            networthHeader.getElementsByClassName('debts')[0].getElementsByTagName('span')[0].textContent = '$' + parseFloat(dataObj.Debts).toLocaleString(undefined, {maximumFractionDigits: 0, minimumFractionDigits: 0});
            networthHeader.style.visibility = "";

            setTimeout(function(){
                $('.networth-header .networth').addClass('transition');
                setTimeout(()=>{
                    $('.networth-header .networth').removeClass('transition');    
                },1000);
            },120);

        if(dataObj.entryGrey){ 
          networthHeader.style.opacity = .5;  
        }
        else{
          networthHeader.style.opacity = 1;   
        }

        addValues(dataObj['Asset'],'$','Asset',$elAsset,dataObj.entryGrey);
        addValues(dataObj['Debt'],'$','Debt',$elDebt,dataObj.entryGrey);
        dataObj.entryGrey = undefined;
    }
    else{
        //document.getElementById('chart_Asset').hidden = true;  
        //document.getElementById('chart_Debt').hidden = true; 
        $(document.getElementById('curve_chart')).hide(); 
        document.getElementsByClassName('networth-header')[0].style.visibility = 'hidden';     
    }
}

function drawLineGraph(entryGrey){
       let entryTemp = Object.keys(userData.entries), i, 
       currentString = utility.getReferenceStr(userData.currentMonth,userData.currentYear), 
       entryKeys = [],
       width,
       ratio = 1.8,
       networthMonth;

       if(!userData.entries[currentString]){
         entryGrey = true;
       }

       let $el = $(document.getElementById('curve_chart')),
       dataArr,
       opacity = entryGrey ? .5 : 1;

       for(i = 0;i < entryTemp.length;i++){
           entryKeys.push(entryTemp[i]);
           if(entryTemp[i] === currentString){
               break;
           }
       }
       $el.hide(); 

       if(entryKeys.length <= 1){
           return false;
       }

       dataArr = entryKeys.reduce((prev,key)=>{
           let keyString = key.toString(),
           month = utility.monthMap[parseInt(keyString.substring(4))],
           year = keyString.substring(0,4);
           networthMonth = month + " " + year;
           prev.push([networthMonth,parseFloat(userData.entries[key].NetWorth)]);
           return prev;
       },[['Month','Net Worth']]);
        
        data = google.visualization.arrayToDataTable(dataArr);

        width = $el.parent().width()-10;

        //debugger;
        if(width < 900){
            ratio = 1.5;
        }

        if(width < 450){
            ratio = .9;
        }

        options = {
        chart: {
          title: 'Net worth as of '+networthMonth,
          subtitle: 'keep progressing!'
        },
        width: width,
        height: width/ratio
      };
        chart = new google.charts.Line(document.getElementById('curve_chart'));

        chart.draw(data, options);
        $el.fadeTo('slow',opacity);

}

function drawGraph(obj,type){
    let rows, el = document.getElementById('chart_'+type);
    // Create the data table.
    let data = new google.visualization.DataTable();
    data.addColumn('string', 'Topping');
    data.addColumn('number', 'Slices');

    rows = Object.keys(obj).map((key)=>{
        return [key,obj[key]];
    });

    data.addRows(rows); 

    // Set chart options
    let options = {'title':type + ' Allocation',
                    /*'width':440,
                    'height':330*/};

    // Instantiate and draw our chart, passing in some options.
    let chart = new google.visualization.PieChart(el);
    el.hidden = false;
    chart.draw(data, options);
}

function addValues(valueObj,prefix,type,$el,entryGrey){ 
    if(valueObj){
    //debugger;
        Object.keys(valueObj).map(function(key){
            let entry = utility.formatEntry({type:type,value:valueObj[key]});
            entry.grey = entryGrey ? 'entry-grey' : '';
            $el.append('<a><span class="' + entry.grey + '" style="pointer-events:none;">' + key + ' - <span style="font-size:12px;pointer-events: none;" class="'+entry.class+'">' + entry.display + '</span></span></a>');
        });
        
    }
}
