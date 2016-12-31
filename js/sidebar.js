
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
      infoItems[1] = infoItems[1].replace(/,/g, "").substring(index);

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
                            img({src:userData.accountURL,style:'width:35px;border-radius:50%;'}),
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
                        ul('.collapsible .collapsible-accordion',[
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
        if(!dataObj.entryGrey){
            //drawGraph(dataObj['Asset'],'Asset');
            //drawGraph(dataObj['Debt'],'Debt');
            //debugger;
            drawLineGraph();
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
            
        }
        else{
            //document.getElementById('chart_Asset').hidden = true;  
            //document.getElementById('chart_Debt').hidden = true;    
            $(document.getElementById('curve_chart')).hide(); 
            document.getElementsByClassName('networth-header')[0].style.visibility = 'hidden';
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

function drawLineGraph(){
       let entryTemp = Object.keys(userData.entries), i, 
       currentString = utility.getReferenceStr(userData.currentMonth,userData.currentYear), 
       entryKeys = [],
       networthMonth;
       let $el = $(document.getElementById('curve_chart')),
       dataArr;

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

        options = {
        chart: {
          title: 'Net worth as of '+networthMonth,
          subtitle: 'in millions of dollars (USD)'
        },
        width: 900,
        height: 500
      };
        chart = new google.charts.Line(document.getElementById('curve_chart'));

        chart.draw(data, options);
        $el.fadeIn('slow');

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



/*
 * jQuery Easing v1.3 - http://gsgd.co.uk/sandbox/jquery/easing/
 *
 * Uses the built in easing capabilities added In jQuery 1.1
 * to offer multiple easing options
 *
 * TERMS OF USE - jQuery Easing
 *
 * Open source under the BSD License.
 *
 * Copyright © 2008 George McGinley Smith
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *
 * Redistributions of source code must retain the above copyright notice, this list of
 * conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright notice, this list
 * of conditions and the following disclaimer in the documentation and/or other materials
 * provided with the distribution.
 *
 * Neither the name of the author nor the names of contributors may be used to endorse
 * or promote products derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
 *  COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 *  EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
 *  GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED
 * AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 *  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED
 * OF THE POSSIBILITY OF SUCH DAMAGE.
 *
*/

// t: current time, b: begInnIng value, c: change In value, d: duration
jQuery.easing['jswing'] = jQuery.easing['swing'];

jQuery.extend( jQuery.easing,
{
	easeOutQuart: function (x, t, b, c, d) {
		return -c * ((t=t/d-1)*t*t*t - 1) + b;
	},
    easeOutSine: function (x, t, b, c, d) {
		return c * Math.sin(t/d * (Math.PI/2)) + b;
	},
    easeOutCubic: function (x, t, b, c, d) {
		return c*((t=t/d-1)*t*t + 1) + b;
	}
});

/*
 *
 * TERMS OF USE - EASING EQUATIONS
 *
 * Open source under the BSD License.
 *
 * Copyright © 2001 Robert Penner
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *
 * Redistributions of source code must retain the above copyright notice, this list of
 * conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright notice, this list
 * of conditions and the following disclaimer in the documentation and/or other materials
 * provided with the distribution.
 *
 * Neither the name of the author nor the names of contributors may be used to endorse
 * or promote products derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
 *  COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 *  EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
 *  GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED
 * AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 *  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED
 * OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 */;    // Custom Easing
    jQuery.extend( jQuery.easing,
    {
      easeInOutMaterial: function (x, t, b, c, d) {
        if ((t/=d/2) < 1) return c/2*t*t + b;
        return c/4*((t-=2)*t*t + 2) + b;
      }
    });

;